#!/usr/bin/env node
const readlineSync = require('readline-sync');
const fs = require("fs");

var subdomain = readlineSync.question("Enter PROD_SUBDOMAIN: ");
var username = readlineSync.question("Enter PROD_USERNAME: ");
var password = readlineSync.question("Enter PROD_PASSWORD: ");
var licenseLimit = readlineSync.question("Enter license limit # of users: ");
var minUsers = readlineSync.question("Enter minimum number of users in input file to run: ");
var shouldBackup = readlineSync.question("Run a backup before syncing? (Y or N): ");
if(shouldBackup.toLowerCase() === 'y'){
    shouldBackup = 'true';
}else{
    shouldBackup = 'false';
}
var config = "PROD_SUBDOMAIN=" + subdomain + "\nPROD_USERNAME=" + username + "\nPROD_PASSWORD=" + password +
                "\nLICENSELIMIT=" + licenseLimit + "\nMIN_USERS=" + minUsers + "\nSHOULD_BACKUP=" + shouldBackup;
fs.writeFileSync("./.env", config);
console.log("Environment settings written to .env file. Old contents overwritten.");