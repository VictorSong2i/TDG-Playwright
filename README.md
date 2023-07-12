# TDG Test data suite written in Playwright

### Contains the following 3 tests:

#### Test 1: Generate Test data and save into Downloads folder
#### Test 2: Asserts CSV and JSON file in downloaded zip folder
#### Test 3: Change data and re-upload to TDG site

---

You will need to run the following commands in terminal when you use vscode: 

>npm install unzip-stream
>
>npm install fs-extra
>
>npm install csv-parser

`RunAll.spec.ts` runs tests 1-3 sequentially and will automatically update its CSV and JSON files accordingly to the test run. 

**Test 1** generates 5 entries with the required fields saves and downlaods them and then unzips the folder into the downloads folder

**Test 2**  Validates the headers in the csv and json files to ensure it is the headers we expect eg title exists

**Test 3** will copy the `CSV1.csv` unzipped from test 2 and alters a preset of fields: 

+ Personal title
+ Personal date of birth
+ Medical GP's name

Then it is re-uploaded onto the TDG website. (**CAUTION:** Currently TDG does not have ability to re-download it's contents as mentioned in [things to improve](#things-to-improve)).

## Things to improve

TDG site does not update history tab fast enough for assertions to be made if file was saved correctly in test 1. Ater re-downloading the file with its modified contents in test 3, the zip folder contains no CSV or JSON files. 