#!/usr/bin/env node
const xm = require("xmtoolbox");
const env = require('dotenv').config();
const fs = require('fs')
const { exec } = require("child_process");
// var execSync = require('exec-sync');

//Set credentials environment variables or in this file by replaceing the examples below.
//Defaults to using environment variables if they are set.
//Create a .env file in the same directory as the project and set the environment variables there for them to be used below
//Check if .env file is created before
if(!fs.existsSync("./.env")){
  execSync('npm run setup');
//   exec("npm run setup", (error, stdout, stderr) => {
//     if (error) {
//         console.log(`error: ${error.message}`);
//         return;
//     }
//     if (stderr) {
//         console.log(`stderr: ${stderr}`);
//         return;
//     }
//     console.log(`stdout: ${stdout}`);
// });
  // console.log("ERROR: .env file does not exist. Please run the setup scripts first " +
  //  "by running 'npm run setup' or 'npm run setupAndSync' to setup and sync data.")
  //  process.exit(0);
}
const PROD_SUBDOMAIN = process.env.PROD_SUBDOMAIN || "company"; //company from url--> https://company.xmatters.com
const PROD_USERNAME = process.env.PROD_USERNAME || "user";
const PROD_PASSWORD = process.env.PROD_PASSWORD || "password";

exports.xm = xm;

const prod = xm.environments.create(PROD_SUBDOMAIN, PROD_USERNAME, PROD_PASSWORD, {
  logLevel: "debug",
  readOnly: false,
});

prod.licenseLimitUsers = parseInt(process.env.LICENSELIMIT) || 200;
prod.minUsersInputFile = parseInt(process.env.MIN_USERS) || 2;
prod.resultsApiPath =
  "/api/integration/1/functions/99d68524-22fa-440d-82a0-8e97176be23f/triggers?apiKey=4966438f-57a5-404d-ad2d-391a2e0b2b64";

exports.prod = prod;