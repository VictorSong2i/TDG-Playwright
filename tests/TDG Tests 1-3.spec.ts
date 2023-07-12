import { test, expect } from '@playwright/test';
import dataNameLib from '../Fixtures/dataNameLib.json';
import csv from 'csv-parser';

let numData = 5; //number of entries to create
var zipFile = 'GENERIC-dvTPxM.zip'; //Declare gloabl zip file name to be used for all tests

//Fields to select
let personalData =  ["Title","First name","Last Name","Date Of Birth"];
let medical = ["GP Location","GP Name", "Patient Ref No"];
let residentialAddress = ["Full Address"];

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

test.beforeEach(async({page})=>{

  //Enter TDG site 
  await page.goto('https://develop.d3nylssqqiptjw.amplifyapp.com/');

  //Login
  await page.locator('#email-input').fill('joebloggs@gmail.com');
  await page.locator('#password-input').fill('123456');
  await page.getByRole('button', {name: 'Login'}).click();
  await expect(page.getByRole('link', { name: 'DATA' })).toBeVisible();
})

test.afterEach(async({page})=>{
  await page.locator('#logout-link').click();
})

test('Test 1 generate and save data', async ({ page }) => {

  await page.getByRole('link', { name: 'DATA' }).click();
  await page.locator('input#entries-counter').fill(numData.toString());

  //Click on personal data fields
  await page.getByPlaceholder('Personal Data').click();
  for (let field of personalData) {
    await page.getByText(field, {exact: true}).click();
  }

  //Click on medical fields
  await page.getByPlaceholder('Medical').click();
  for (let field of medical) {
    await page.getByText(field, {exact: true}).click();
  }

  //Click on Residential Address fields
  await page.getByPlaceholder('Residential Address').click();
  for (let field of residentialAddress) {
    await page.getByText(field, {exact: true}).click();
  }

  //Submit fields for data generation
  await page.getByRole('button', { name: 'Submit Selected' }).click();

  //Check fields are present
  let allFields = personalData.concat(medical, residentialAddress);
  for(let field of allFields){
    await expect(page.locator('[class="custom-values"]')).toContainText(field);
  }

  //Select CSV and JSON output
  await page.getByRole('button', { name: 'CSV & JSON' }).click();

  //Generate Data
  await page.getByRole('button', { name: 'Generate Data' }).click();

  //Get filename name
  const inputElement = page.locator('#file-name-input');
  let fileName = inputElement.getAttribute('value');

  //Start waiting for download before clicking. Note no await.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name:'Download'}).click(); 
  const download = await downloadPromise;
  
  //downloaded file
  zipFile = download.suggestedFilename();
  await download.saveAs('./Downloads/' + zipFile);

  //Save data
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText('OK').click();

  //Unzip file into downloads folder
  let unzip = require('unzip-stream');
  let fs = require('fs-extra'); 
  fs.createReadStream('./Downloads/' + zipFile).pipe(unzip.Extract({ path: './Downloads' }));
});

test('Test 2 unzip and validate files', async ({page}) => {

  //Get fs-extra
  let fs = require('fs-extra'); 

  async function readCSVFile(filePath: string): Promise<object[]> {

    const results: object[] = []; //Create empty object array
    
    //Returns CSV data
    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data)) //Parse row of data and push into results array 
        .on('end', () => resolve(results)) //Ends when all rows of data have been parsed
    });
  }

  //Initiate variable to count total number of fields
  let allFieldsNum = personalData.concat(residentialAddress, medical).length;
  let path = './Downloads/CSV1.csv' //Path to CSV file

  //CSV assertions
  readCSVFile(path).then((data)=>{

    //Get all the fields from keys in CSV file
    let csvFields = Object.keys(data[0])

    expect(csvFields.length).toBe(allFieldsNum) //Checks number of fields matches from csv file to number of fields selected
    expect(data.length).toBe(numData) //Checks number of entries match

    //Check if each field exist in the existing data name library
    csvFields.forEach(field=>{
      (Object.keys(dataNameLib) as (keyof typeof dataNameLib)[]).find((key) => {
        dataNameLib[key] === field;
      });
    })
  })

  //Parse JSON file
  let jsonFile = JSON.parse(JSON.stringify(require("../Downloads/JSON1.json")))

  //Get all fields as keys in JSON file
  let jsonFields = Object.keys(jsonFile[0])

  expect(jsonFields.length).toEqual(allFieldsNum) //Checks number of fields matches from json file to number of fields selected
  expect(jsonFile.length).toEqual(numData) //Checks number of entries match, convert to string
  
  //Check if each field exist in the existing data name library
  jsonFields.forEach(field=>{
    (Object.keys(dataNameLib) as (keyof typeof dataNameLib)[]).find((key) => {
      dataNameLib[key] === field;
    })
  })
})

test('Test 3 upload data to TDG site', async ({ page }) => {

  //goes to data page
  await page.click('#root > header > div.navbar > div > div > a:nth-child(2)');
  //press next button
  await page.click('#next-section-btn > button');
  //upload the file you want to modify
  await page.setInputFiles("input[type='file']", 'Downloads/CSV1.csv')

  //does the modifications to the file
  await page.fill('#personal_title','Mr');
  await page.fill('#personal_dob','Sun Oct 22 1999 16:34:00 GMT+0100 (British Summer Time)');
  await page.fill('#medical_gpName','GP Daniel');
  await page.click('#csv-json-btn');
  await page.click('#btn-down-xml');
  await page.click('#upload-button');
  await page.click('#modal-ok-button');


  // Start waiting for download before clicking. Note no await.
  const downloadPromise = page.waitForEvent('download')
    
  //press download button
  await page.click('#download-button');
  const download = await downloadPromise;

  //save file to path
  await download.saveAs('./Downloads/CSV1Altered.zip');
    
  //get filename on webpage
  const textBox = await page.$('#file-name-input');
  const value = await textBox.getAttribute('value');

  //go to the history page
  await page.click('#root > header > div.navbar > div > div > a:nth-child(3)');

  //validate if file has been saved by comparing filenames
  await expect(page.locator('#root > div.page.light > div > div > table > tbody')).toContainText(String(value));
});