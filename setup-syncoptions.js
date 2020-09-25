#!/usr/bin/env node
const readlineSync = require('readline-sync');
const fs = require("fs");

var syncOptions = "";
var syncUsers = readlineSync.question("Sync Users? (Y or N): ");
if(syncUsers.toLowerCase() === 'y'){
    syncOptions += "\nUSERS=true";
    var syncDevices = readlineSync.question("Sync Devices? (Y or N): ");
    if(syncDevices.toLowerCase() === 'y') syncOptions += "\nDEVICES=true";
}

var syncGroups = readlineSync.question("Sync Groups? (Y or N): ");
if(syncGroups.toLowerCase() === 'y'){
    syncOptions += "\nGROUPS=true";
    var syncMembers = readlineSync.question("Sync Group Roster? (Y or N): ");
    if(syncMembers === 'y') syncOptions += "\nMEMBERS=true";
}

fs.appendFileSync("./.env", syncOptions);
console.log("syncOptions written to .env file. To overwrite, go delete lines from .env and re-run sync-setup.");