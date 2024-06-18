var { Country, Region, City, Conversion, Salespartner, Countryanddialcode } = require("../models/commonModel");
const Publishers = require("../models/publisherModel");
const Applist = require("../models/applistModel");
const GeoPrice = require("../models/geopayoutModel");
const Offer = require("../models/offerModel");

const { dateprint } = require('../common/helper');
const fs = require('fs-extra')

const randomBytes = require('randombytes');
const appLists = require("../models/applistModel");
const axios = require('axios');
const aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;



const { parse } = require('csv-parse');
const { Readable } = require('stream');

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const path = require('path');
const { url } = require("inspector");



// create offer on trackier
const axios_header = {
  headers: {
    'x-api-key': process.env.API_KEY,
    'Content-Type': 'application/json'
  }
};



const { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, generateRandomString, bin2hex } = require('../common/helper');


// Get goal and price of offer
exports.getGoalByofferId = async (req, res) => {
  const trackier_camp_id = req.params.id;
  // Get all goals
  await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", axios_header).then(async (campGoals) => {
    if (typeof campGoals.statusText !== 'undefined' && campGoals.statusText == "OK") {
      var goalsData = [];
      for (let q = 0; q < campGoals.data.goals.length; q++) {
        let goalBudget = campGoals.data.goals[q];
        goalsData.push({ [goalBudget._id]: goalBudget.title });
      }

      const ofDt = await Offer.findOne({ 'trackier_camp_id': trackier_camp_id }).exec()

      var noPaybaleArr = [];
      if (ofDt.non_payable_event_name) {
        let nonPrice = ofDt.non_payable_event_price
        const nonPriceArr = nonPrice.split(',');
        for (let i = 0; i < nonPriceArr.length; i++) {
          if (nonPriceArr[i] > 0) {
            noPaybaleArr.push(parseFloat(nonPriceArr[i]));
          }
        }
      } else {
        noPaybaleArr.push(parseFloat(ofDt.payable_event_price))
      }


      if (Array.isArray(goalsData) && goalsData.length == 0) {
        goalsData.push({ 0: 'Install' })
      }

      const response = { 'success': true, 'price': noPaybaleArr[0], 'results': goalsData };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!! 22" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.error(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });
}


// Get Country Data
exports.getCountry = async (req, res, next) => {
  const country = {};
  Country.find({}).sort({ ISO: 1 }).exec().then((country) => {
    res.getCountry = country;
    next();
    const response = { 'success': true, 'results': country };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get sales partner
exports.getSalesPartner = async (req, res, next) => {
  const salespartner = {};
  Salespartner.find({}).sort({ name: 1 }).exec().then((salespartner) => {
    res.getSalesPartner = salespartner;
    next();
    const response = { 'success': true, 'results': salespartner };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get State By Country
exports.getStateByCountry = (req, res, next) => {
  const countryCode = req.query.countryCode;
  const state = {};
  if (!countryCode) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "countryCode is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  Region.find({ 'Country': countryCode.toLowerCase() }).sort({ Region: 1 }).exec().then((state) => {
    res.getStateByCountry = state;
    next();
    const response = { 'success': true, 'results': state };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// Search city and get 
exports.citySearch = async (req, res, next) => {
  const searchVal = req.query.search;
  const city = {};
  if (!searchVal) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "search is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  City.find({ "City": { $regex: `${searchVal}`, $options: 'i' } }).sort({ City: 1 }).limit(10).exec().then((city) => {
    res.citySearch = city;
    next();
    const response = { 'success': true, 'results': city };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// Get Publisher By Country
exports.getPublisherByCountry = async (req, res, next) => {
  const { country } = req.body;
  const publisher = {};
  if (!Array.isArray(country)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(country) && country.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  const c_string = country.join(',');
  Publishers.find({ "pub_status": "Enabled", '$text': { '$search': `${c_string}` } }).sort({ pub_name: 1 }).exec().then((publisher) => {
    res.getPublisherByCountry = publisher;
    next();
    const response = { 'success': true, 'results': publisher };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get Applist  By Country lan int os
exports.getApplists = async (req, res) => {
  const { country, operating_system, language, interest } = req.body;
  if (!Array.isArray(country)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(country) && country.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(language)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language should be []!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(language) && language.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(interest)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest should be []!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(interest) && interest.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // START push app lists on trackier
  // APPS LIST UPDATE WHILE SDK
  if (operating_system == 'android') {
    var os = "AOS";
  } else {
    var os = "IOS";
  }
  await appLists.find({ '$and': [{ 'Geo': { '$in': country } }, { "OS": os }, { 'Category': { '$in': interest } }, { 'Language': { '$in': language } }] }).sort({ _id: -1 }).exec().then((app_lists) => {

    // console.log(app_lists);

    var valid_fields = [];
    for (let i = 0; i < app_lists.length; i++) {
      let app = app_lists[i];
      valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio + "__" + app.App_Name + "__" + app._id);
    }
    var fionalAppList = [];
    for (let j = 0; j < valid_fields.length; j++) {

      let expIntApp = valid_fields[j].split("__");
      for (let k = 0; k < parseInt(expIntApp[1]); k++) {
        let icon_names = expIntApp[2];
        let app_names_icon = icon_names.replace(/[^A-Z0-9]+/ig, "_") + ".png";
        fionalAppList.push({ '_id': expIntApp[3], 'appName': expIntApp[2], 'appBundle': expIntApp[0], 'appIcon': app_names_icon });
      }
    }

    shuffle(fionalAppList);
    n = 30;
    var shuffled = fionalAppList.sort(function () { return 0.5 - Math.random() });
    var randomlyPickedappList = shuffled.slice(0, n);


    result = randomlyPickedappList.filter(function (a) {
      var key = a.appBundle;
      if (!this[key]) {
        this[key] = true;
        return true;
      }
    }, Object.create(null));

    n = 30;
    const finalData = result.slice(0, n);

    const response = { 'success': true, 'results': finalData };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// Get Applist By Interest 
exports.getApplistsByInterest = async (req, res) => {
  const { interest } = req.body;

  await appLists.find({ 'Category': interest }).sort({ _id: -1 }).exec().then((app_lists) => {

    var valid_fields = [];
    for (let i = 0; i < app_lists.length; i++) {
      let app = app_lists[i];
      valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio + "__" + app.App_Name + "__" + app._id + "__" + app.Reach);
    }
    var finalAppList = [];
    var totalReach = [];
    for (let j = 0; j < valid_fields.length; j++) {

      let expIntApp = valid_fields[j].split("__");
      for (let k = 0; k < parseInt(expIntApp[1]); k++) {
        let icon_names = expIntApp[2];
        let app_names_icon = icon_names.replace(/[^A-Z0-9]+/ig, "_") + ".png";
        finalAppList.push({ '_id': expIntApp[3], 'appName': expIntApp[2], 'appBundle': expIntApp[0], 'appIcon': app_names_icon });
        totalReach.push({ 'appBundle': expIntApp[0], 'Reach': expIntApp[4] });
      }
    }

    result = finalAppList.filter(function (a) {
      var key = a.appBundle;
      if (!this[key]) {
        this[key] = true;
        return true;
      }
    }, Object.create(null));
    n = 11;
    const finalData = result.slice(0, n);

    const moreData = (parseInt(result.length) - parseInt(finalData.length));


    result1 = totalReach.filter(function (a) {
      var key = a.appBundle;
      if (!this[key]) {
        this[key] = true;
        return true;
      }
    }, Object.create(null));

    var totalReach = 0;
    for (let m = 0; m < result1.length; m++) {
      let val = result1[m].Reach;
      totalReach += parseInt(val);
    }

    const response = { 'success': true, 'audienceSize': totalReach, 'moreData': moreData, 'results': finalData };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get Language By Country
exports.getLanguageByCountry = async (req, res, next) => {
  const { country } = req.body;
  const language = {};
  if (!Array.isArray(country)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(country) && country.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  var filterDatas = { '$match': { 'Geo': { '$in': country } } };
  Applist.aggregate([
    filterDatas,
    {
      '$group': {
        '_id': '$Language',
        'sum': { '$sum': 1 }
      }
    }
  ]).sort({ Language: 1 }).exec().then((language) => {
    res.getLanguageByCountry = language;
    next();
    const response = { 'success': true, 'results': language };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get Interest By Country
exports.getInterestByCountry = async (req, res) => {
  const { country } = req.body;
  if (!Array.isArray(country)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(country) && country.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  var filterDatas = { '$match': { 'Geo': { '$in': country } } };
  Applist.aggregate([
    filterDatas,
    {
      '$group': {
        '_id': '$Category',
        'sum': { '$sum': 1 }
      }
    }
  ]).sort({ _id: 1 }).exec().then((interest) => {

    var interestArr = [];
    if (interest) {
      for (let i = 0; i < interest.length; i++) {
        let intDt = interest[i];
        if (intDt._id !== "") {
          interestArr.push({
            _id: intDt._id,
            sum: intDt.sum
          });
        }
      }
    }

    const response = { 'success': true, 'results': interestArr };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// Get All Interest
exports.getAllInterest = async (req, res) => {
  var filterDatas = { '$match': { 'Geo': { '$ne': "" } } };
  Applist.aggregate([
    filterDatas,
    {
      '$group': {
        '_id': '$Category',
        'sum': { '$sum': 1 }
      }
    }
  ]).sort({ _id: 1 }).exec().then((interest) => {

    var interestArr = [];
    for (let j = 0; j < interest.length; j++) {
      let val = interest[j];
      if (val._id !== "") {
        interestArr.push({ '_id': val._id, 'sum': val.sum });
      }
    }
    const response = { 'success': true, 'results': interestArr };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// Get Geo Price List
exports.getGeoWisePrice = async (req, res, next) => {
  const geoprice = {};
  GeoPrice.find({}).sort({ geo: 1 }).exec().then((geoprice) => {
    res.getGeoWisePrice = geoprice;
    next();
    const response = { 'success': true, 'results': geoprice };
    res.status(200).send(response);
    return;
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// check offer name exist
exports.checkOffernameExist = async (req, res) => {
  const { offer_name, trackier_camp_id } = req.body;
  if (!offer_name) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "offer_name is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  if (typeof trackier_camp_id !== 'undefined' && trackier_camp_id !== "") {
    Offer.findOne({ '$and': [{ 'trackier_camp_id': { '$ne': 0 } }, { 'trackier_camp_id': { '$ne': trackier_camp_id } }, { 'offer_name': offer_name }] }).exec().then((offerName) => {
      if (offerName) {
        const response = { 'success': true, 'results': { 'offerNameExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'offerNameExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  } else {
    Offer.findOne({ '$and': [{ 'trackier_camp_id': { '$ne': 0 } }, { 'offer_name': offer_name }] }).exec().then((offerName) => {
      if (offerName) {
        const response = { 'success': true, 'results': { 'offerNameExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'offerNameExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  }
}

// Define valid headers
const validHeaders = ['created', 'campaign_id', 'publisher_id', 'source', 'country', 'goal_id', 'app_name', 'cr_name', 'currency', 'revenue'];

// Function to validate CSV headers
function validateHeaders(headers) {
  return headers.length === validHeaders.length && headers.every((header, index) => header === validHeaders[index]);
}


function getHeadersFromBuffer(buffer) {
  const lines = buffer.toString().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty buffer');
  }

  const linedat = lines[0].replace(/"/g, '');
  const headers = linedat.split(',').map(header => header.trim());
  return headers;
}

// request.body
exports.addConversionlist = async (req, res) => {

  if (req.file) {
    const buffer = req.file.buffer.toString();
    const headers = getHeadersFromBuffer(buffer);
    if (!validateHeaders(headers)) {
      const resData = { 'success': false, 'message': "Invalid CSV headers" };
      res.status(400).send(resData);
      return;
    }

    const readable = Readable.from(buffer);
    const results = [];

    readable
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', row => {
        results.push(row);
      })
      .on('end', async () => {
        try {

          var cnvDataArr = [];
          for (let i = 0; i < results.length; i++) {
            const bytes = randomBytes(10);
            let cnvData = results[i];

            cnvDataArr.push({
              "created": cnvData.created,
              "campaign_id": cnvData.campaign_id,
              "publisher_id": cnvData.publisher_id,
              "source": cnvData.source,
              "country": cnvData.country,
              "goal_id": cnvData.goal_id,
              "app_name": cnvData.app_name,
              "cr_name": cnvData.cr_name,
              "currency": cnvData.currency,
              "revenue": cnvData.revenue,
              "txn_id": bin2hex(bytes),
              "job_status": "",
              "note": req.body.note,
              "status": "cancelled",
              "job_id": ""
            });

          }
          await Conversion.insertMany(cnvDataArr);


          const bcc_mail = process.env.BCC_EMAILS.split(",");
          // Send Mail to Admin
          const admin_mail = process.env.ADMIN_EMAILS.split(",");
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/conversion_upload_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            uploaded_by: ucwords(req.body.uploaded_by),
            base_url: process.env.APPLABS_URL
          }))
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msgAdmin = {
            to: admin_mail,
            from: {
              name: process.env.MAIL_FROM_NAME,
              email: process.env.MAIL_FROM_EMAIL,
            },
            bcc: bcc_mail,
            subject: 'Applabs Alert - Conversion uploaded',
            html: messageBodyAdmin
          };
          //ES6
          sgMail.send(msgAdmin).then(() => { }, error => {
            console.error(error);
            if (error.response) {
              console.error(error.response.body)
            }
          }).catch((error) => {
            const response = { 'success': false, 'message': error };
            res.status(200).send(response);
            return;
          });
          // EMAIlL SENT END

          const resData = { 'success': true, 'message': "File processed successfully", 'results': results };
          res.status(200).send(resData);
          return;
        } catch (error) {
          const resData = { 'success': false, 'message': error.message, 'results': results };
          res.status(200).send(resData);
          return;
        }
      })
      .on('error', err => {
        const resData = { 'success': false, 'message': err.message, 'results': results };
        res.status(200).send(resData);
        return;
      });
  } else {
    const resData = { 'success': false, 'message': "File not found!" };
    res.status(200).send(resData);
    return;
  }
};



var signatures = {
  JVBERi0: "application/pdf",
  R0lGODdh: "image/gif",
  R0lGODlh: "image/gif",
  iVBORw0KGgo: "image/png",
  "/9j/": "image/jpg"
};

function detectMimeType(b64) {
  for (var s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s];
    }
  }
}

function base64Mime(encoded) {
  var result = null;
  if (typeof encoded !== 'string') {
    return result;
  }
  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length) {
    result = mime[1];
  }
  return result;
}

exports.uploadImagesFromBase64 = async (req, res) => {
  const { ads, icons } = req.body;
  if (Array.isArray(ads) && ads.length > 0) {
    for (let i = 0; i < ads.length; i++) {
      let adsVal = ads[i];
      // Base64 string


      let mimetypeCheck = base64Mime(adsVal.image);
      if (mimetypeCheck.includes("image")) {
        var data_val = adsVal.image.replace(/^data:image\/[a-z]+;base64,/, "");
        var data_name = adsVal.img_name;
        var mimetype = detectMimeType(adsVal.image);
      } else {
        console.log("Videos");
        var mimetype = base64Mime(adsVal.image);
        var data_val = adsVal.image.replace(`data:${mimetype};base64,`, "");
        var data_name = adsVal.img_name;
      }
      // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
      const buffer = Buffer.from(data_val, "base64");
      const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
      let s3 = new aws.S3({
        credentials: {
          accessKeyId: BUCKET_ACCESS_ID,
          secretAccessKey: BUCKET_SECRET
        },
        region: BUCKET_REGION
      });
      const putobj = {
        Bucket: "applabs2024",
        Key: data_name,
        Body: buffer,
        ContentType: mimetype,
        acl: "private"
      }
      s3.upload(putobj, function (err, data) {
        if (err) {
          console.log("Error", err)
          const erroData = { 'success': false, 'error': err };
          res.status(400).send(erroData);
          return;
        } else {
          data && console.log("Upload success", data);
        }
      })
    }
  }

  if (icons.icon.length !== 0) {

    const icon_check = stringIsAValidUrl(icons.icon, ['https']);
    if (icon_check == true) {
      let image = await axios.get(icons.icon, { responseType: 'arraybuffer' });
      let ICON_image = Buffer.from(image.data).toString('base64');

      let data_val = ICON_image.replace(/^data:image\/[a-z]+;base64,/, "");
      let data_name = icons.icon_name;
      let mimetype = detectMimeType(ICON_image);
      // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
      const buffer = Buffer.from(data_val, "base64");
      const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
      let s3 = new aws.S3({
        credentials: {
          accessKeyId: BUCKET_ACCESS_ID,
          secretAccessKey: BUCKET_SECRET
        },
        region: BUCKET_REGION
      });
      const putobj = {
        Bucket: "applabs2024",
        Key: data_name,
        Body: buffer,
        ContentType: mimetype,
        acl: "private"
      }
      s3.upload(putobj, function (err, data) {
        if (err) {
          console.log("Error", err)
          const erroData = { 'success': false, 'error': err };
          res.status(400).send(erroData);
          return;
        } else {
          data && console.log("Upload success", data);
        }
      })

    } else {

      let data_val = icons.icon.replace(/^data:image\/[a-z]+;base64,/, "");
      let data_name = icons.icon_name;
      let mimetype = detectMimeType(icons.icon);
      // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
      const buffer = Buffer.from(data_val, "base64");
      const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
      let s3 = new aws.S3({
        credentials: {
          accessKeyId: BUCKET_ACCESS_ID,
          secretAccessKey: BUCKET_SECRET
        },
        region: BUCKET_REGION
      });
      const putobj = {
        Bucket: "applabs2024",
        Key: data_name,
        Body: buffer,
        ContentType: mimetype,
        acl: "private"
      }
      s3.upload(putobj, function (err, data) {
        if (err) {
          console.log("Error", err)
          const erroData = { 'success': false, 'error': err };
          res.status(400).send(erroData);
          return;
        } else {
          data && console.log("Upload success", data);
        }
      })
    }
  }
  const resData = { 'success': true, 'message': "ads/icon upload was successful." };
  res.status(200).send(resData);
  return;
};



// Get Publisher By Country
exports.getAllFlagDialCode = async (req, res) => {
  const { dial_code } = req.body;
  Countryanddialcode.find({}).exec().then((dialCode) => {
    if (dialCode) {
      var dialCodeArray = [];
      for (let i = 0; i < dialCode.length; i++) {
        let dt = dialCode[i];
        dialCodeArray.push({
          _id: dt._id,
          name: dt.name,
          dial_code: dt.dial_code,
          code: dt.code,
          flag: dt.code.toLowerCase() + ".png"
        })
      }
      const response = { 'success': true, 'results': dialCodeArray };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': [] };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};

// Get Publisher By Country
exports.getFlagByDialCode = async (req, res) => {
  const { dial_code } = req.body;
  Countryanddialcode.findOne({ "dial_code": dial_code }).exec().then((dialCode) => {
    if (dialCode) {
      var dialCodeArray = [];
      dialCodeArray.push({
        _id: dialCode._id,
        name: dialCode.name,
        dial_code: dialCode.dial_code,
        code: dialCode.code,
        flag: dialCode.code.toLowerCase() + ".png"
      })
      const response = { 'success': true, 'results': dialCodeArray };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': [] };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};


// exports.uploadImagesFromBase64 = (req, res) => {
//   const Jimp = require("jimp");
//   const fs = require("fs-extra");
//   const { ads, icons } = req.body;

//   if (Array.isArray(ads) && ads.length !== 0) {
//     for (let i = 0; i < ads.length; i++) {
//       let adsVal = ads[i];
//       // Base64 string
//       const data_val = adsVal.image.replace(/^data:image\/[a-z]+;base64,/, "");
//       const data_name = adsVal.img_name;
//       // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
//       const buffer = Buffer.from(data_val, "base64");
//       Jimp.read(buffer, (err, res) => {
//         if (err) throw new Error(err);
//         res.quality(90).write("uploads/ads/" + data_name);
//       });
//     }
//   }

//   if (icons.icon.length !== 0) {
//     // Base64 string
// 	const data_val = icons.icon.replace(/^data:image\/[a-z]+;base64,/, "");
//     const data_name = icons.icon_name;
//     // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
//     const buffer = Buffer.from(data_val, "base64");
//     Jimp.read(buffer, (err, res) => {
//       if (err) throw new Error(err);
//       res.quality(90).write("uploads/ads/" + data_name);
//     });
//   }

//   const resData = { 'success': true, 'message': "ads/icon upload was successful." };
//   res.status(200).send(resData);
//   return;
// };



exports.getAllCretives = async (req, res) => {
	process.exit();
  var creativeArr = ["DreameBanners8_53478_320x480.jpg", "DreameBanners9_43150_480x320.jpg"];
  for (let i = 0; i < creativeArr.length; i++) {
    let cr = creativeArr[i];

    if (fs.existsSync('uploads/ads/' + cr)) {
      let contents = await fs.readFile('uploads/ads/' + cr, { encoding: 'base64' });

      if (contents) {
        let data_val = contents.replace(/^data:image\/[a-z]+;base64,/, "");
        let data_name = cr;
        let mimetype = detectMimeType(contents);
        // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
        const buffer = Buffer.from(data_val, "base64");
        const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
        let s3 = new aws.S3({
          credentials: {
            accessKeyId: BUCKET_ACCESS_ID,
            secretAccessKey: BUCKET_SECRET
          },
          region: BUCKET_REGION
        });
        const putobj = {
          Bucket: "applabs2024",
          Key: data_name,
          Body: buffer,
          ContentType: mimetype,
          acl: "private"
        }
        s3.upload(putobj, function (err, data) {
          if (err) {
            console.log("Error", err)
            const erroData = { 'success': false, 'error': err };
            res.status(400).send(erroData);
            return;
          } else {
            data && console.log("Upload success", data);
          }
        })
      }
    }
  }


  // Offer.find({ 'trackier_camp_id': { '$ne': 0 } }).exec().then(async (offRes) => {
  //   // console.log(offRes);
  //   if (offRes) {
  //     for (let i = 0; i < offRes.length; i++) {
  //       let off = offRes[i];
  //       let contents = await fs.readFile('uploads/ads/' + off.icon, { encoding: 'base64' });
  //       let data_val = contents.replace(/^data:image\/[a-z]+;base64,/, "");
  //       let data_name = off.icon;
  //       let mimetype = detectMimeType(contents);
  //       // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
  //       const buffer = Buffer.from(data_val, "base64");
  //       const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
  //       let s3 = new aws.S3({
  //         credentials: {
  //           accessKeyId: BUCKET_ACCESS_ID,
  //           secretAccessKey: BUCKET_SECRET
  //         },
  //         region: BUCKET_REGION
  //       });
  //       const putobj = {
  //         Bucket: "applabs2024",
  //         Key: data_name,
  //         Body: buffer,
  //         ContentType: mimetype,
  //         acl: "private"
  //       }
  //       s3.upload(putobj, function (err, data) {
  //         if (err) {
  //           console.log("Error", err)
  //           const erroData = { 'success': false, 'error': err };
  //           res.status(400).send(erroData);
  //           return;
  //         } else {
  //           data && console.log("Upload success", data);
  //         }
  //       })
  //     }
  //   } else {
  //     const response = { 'success': true, 'results': "No data available!!" };
  //     res.status(200).send(response);
  //     return;
  //   }
  // }).catch((error) => {
  //   const reMsg = { "status": false, "message": error };
  //   res.status(400).send(reMsg);
  // });
}