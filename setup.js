#!/usr/bin/env node
const readlineSync = require('readline-sync');
const fs = require("fs");

var subdomain = readlineSync.question("Enter PROD_SUBDOMAIN: ");
var username = readlineSync.question("Enter PROD_USERNAME: ");
var password = readlineSync.question("Enter PROD_PASSWORD: ");
var config = "PROD_SUBDOMAIN=" + subdomain + "\nPROD_USERNAME=" + username + "\nPROD_PASSWORD=" + password;
fs.writeFileSync("./.env", config);
console.log("Environment settings written to .env file. Old contents overwritten.");