var express = require('express');
var router = express.Router();
var fs = require('fs');
const app = require('../app');
const { exec } = require("child_process");
const path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  var array = [];
  var dict = [];
  if(fs.existsSync('.env')){
    array = fs.readFileSync('.env').toString().split('\n');
    array.forEach(element => {
      dict[element.split("=")[0]] = element.split("=")[1];
    });
  }
  res.locals.PROD_SUBDOMAIN = dict["PROD_SUBDOMAIN"];
  res.locals.PROD_USERNAME = dict["PROD_USERNAME"];
  res.locals.PROD_PASSWORD = dict["PROD_PASSWORD"];
  res.locals.LICENSELIMIT = dict["LICENSELIMIT"];
  res.locals.MIN_USERS = dict["MIN_USERS"];
  res.locals.SHOULD_BACKUP = dict["SHOULD_BACKUP"];
  res.locals.USERS = dict["USERS"];
  res.locals.DEVICES = dict["DEVICES"];
  res.locals.GROUPS = dict["GROUPS"];
  res.locals.MEMBERS = dict["MEMBERS"];
  res.render('index', {data: array});
});

/* POST Route for saving config to .env */
router.post('/saveSetup', function(req,res){
  var config = "PROD_SUBDOMAIN=" + req.body.domain + "\nPROD_USERNAME=" + req.body.username + "\nPROD_PASSWORD=" + req.body.password +
                "\nLICENSELIMIT=" + req.body.license + "\nMIN_USERS=" + req.body.minUsers + "\nSHOULD_BACKUP=" + req.body.shouldBackup +
                "\nUSERS=" + req.body.syncUsers + "\nDEVICES=" + req.body.syncDevices + "\nGROUPS=" + req.body.syncGroups + "\nMEMBERS=" + req.body.syncMembers;
  console.log(config);
  fs.writeFileSync('.env', config);
});

/* POST Route to run sync with exec command */
router.post('/runSync', function(req,res){
  exec("npm run sync", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

/** POST Uploads user CSV to specific path for running data sync */
router.post('/uploadUserCSV', function (req, res) {
  fs.writeFile(path.join(__dirname, '../public/images/User_Upload.csv'), req.files.userCSV.data, 'utf8', function (err) {
    if (err) {
      console.log(err);
      console.log('Some error occured - file either not saved or corrupted file saved.');
    } else{
      console.log('It\'s saved!');
    }
  });
});

/** POST Uploads groups CSV to specific path for running data sync */
router.post('/uploadGroupCSV', function (req, res) {
  fs.writeFile(path.join(__dirname, '../public/images/Group_Upload.csv'), req.files.groupCSV.data, 'utf8', function (err) {
    if (err) {
      console.log(err);
      console.log('Some error occured - file either not saved or corrupted file saved.');
    } else{
      console.log('It\'s saved!');
    }
  });
});

module.exports = router;