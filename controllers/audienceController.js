const Audience = require("../models/audienceModel");
const axios = require('axios');
const aws = require("aws-sdk");
const Offer = require("../models/offerModel");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const { dateprint } = require('../common/helper');
const Advertiser = require("../models/advertiserModel");
const { getAdvertiserBalByAdvId, getAdvertiserNameByAdvId, getAdertiseDetailsByAdvId, getpublisherPayoutByPubandGeo, getpublisherPayoutArr, getPublisherByPubId, getAdvertiserBasicDetailsByAdvId, getpublisherPayoutByPubId, decodeHtml, addNotificationsData } = require("../common/common");

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");

exports.uploadCSV = async (req, res) => {
  let data_name = req.file.originalname;
  let mimetype = req.file.mimetype;
  // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
  const buffer = req.file.buffer;
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
  const resData = { 'success': true, 'message': "CSV upload was successful." };
  res.status(200).send(resData);
  return;
}


// request.body
exports.addAudience = async (req, res) => {
  const { tid, user_email, user_type, audience_type, audience_name, bundle_id, app_name, os_version, audience_api_key, csv_file_name, csv_link, geo, gender, language, interest, age_group } = req.body;
  // console.log(RU_erid);
  // process.exit();
  // Validate request
  if (!tid || !user_email || !user_type || !audience_type || !audience_name) {
    var requestVal = "";
    if (!tid) {
      var requestVal = "tid";
    } else if (!user_email) {
      var requestVal = "user_email";
    } else if (!user_type) {
      var requestVal = "user_type";
    } else if (!audience_type) {
      var requestVal = "audience_type";
    } else if (!audience_name) {
      var requestVal = "audience_name";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(geo)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "geo should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(gender)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "gender should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(language)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(interest)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(age_group)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  const audience = new Audience({
    tid: tid,
    user_email: user_email,
    user_type: user_type,
    audience_type: audience_type,
    audience_name: audience_name,
    bundle_id: bundle_id,
	app_name:app_name,
    os_version: os_version,
    audience_api_key: audience_api_key,
    csv_file_name: csv_file_name,
    csv_link: csv_link,
    geo: geo,
    gender: gender,
    language: language,
    interest: interest,
    age_group: age_group
  });

  // Save Audience in the database
  audience.save(audience).then(async DBdata => {

    if (req.file) {

      let data_name = req.file.originalname;
      let mimetype = req.file.mimetype;
      // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
      const buffer = req.file.buffer;
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
	
	 const advDt = await getAdertiseDetailsByAdvId(tid);

    // INSERT DATA INTO NOTIFICATIONS
    const notificationData = {
      advertiser_id: parseInt(tid),
      advertiser_name: ucfirst(advDt.advertiserName),
      company_name: ucfirst(advDt.advName),
      offer_id: 0,
      offer_name: "",
      category: "Audience",

      subject_adv: "",
      message_adv: "",

      subject_sa: 'Applabs Alert - ' + ucfirst(advDt.advName) + ' added New Audience',
      message_sa: "A new audience <span class='text_primary'> " + ucfirst(DBdata.audience_name) + "</span> has been created by <span class='text_primary'> " + ucfirst(advDt.advName) + "</span>",

      read: 0,
    }
    // END INSERT DATA INTO NOTIFICATIONS
    await addNotificationsData(notificationData);
    const bcc_mail = process.env.BCC_EMAILS.split(",");
    // Send Mail to Admin
    const admin_mail = process.env.ADMIN_EMAILS.split(",");
    const emailTemplateAdmin = fs.readFileSync(path.join("templates/audience_created_admin.handlebars"), "utf-8");
    const templateAdmin = handlebars.compile(emailTemplateAdmin);
    const messageBodyAdmin = (templateAdmin({
      todayDate: dateprint(),
      audience_name: ucfirst(DBdata.audience_name),
      adv_name: advDt.advName.toUpperCase(),
      //added_by: ucwords(added_by),
      url: process.env.APPLABS_URL + 'CreateAudiencePage',
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
      subject: 'Applabs Alert - ' + advDt.advName + ' added New Audience',
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

    const resData = { 'success': true, 'message': "Audience added successfully", 'results': DBdata };
    res.status(200).send(resData);
    return
  }).catch(err => {
    const resData = { 'success': false, 'message': "" + err.message };
    res.status(400).send(resData);
    return;
  });
};

// Get Audience Data
exports.getAudienceData = async (req, res) => {

  await Audience.find({}).sort({ _id: -1 }).exec().then(async (audRes) => {

    var audResArr = [];
    for (let j = 0; j < audRes.length; j++) {
      let record = audRes[j];
      const audience_api_key = await Offer.findOne({ audience_id: record._id }).exec();
      if (audience_api_key !== null && record.audience_api_key !== "") {
        var audience_api_key_exist = "Yes";
      } else {
        var audience_api_key_exist = "No";
      }


      audResArr.push({
        _id: record._id,
        tid: record.tid,
        user_email: record.user_email,
        user_type: record.user_type,
        audience_type: record.audience_type,
        audience_name: record.audience_name,
        bundle_id: record.bundle_id,
        app_name: record.app_name,
        os_version: record.os_version,
        audience_api_key: record.audience_api_key,
        audience_api_key_exist: audience_api_key_exist,
        csv_file_name: record.csv_file_name,
        csv_link: record.csv_link,
        geo: record.geo,
        gender: record.gender,
        language: record.language,
        age_group: record.age_group,
        interest: record.interest,
        created_at: record.created_at,
        updated_at: record.updated_at
      })
    }

    if (audResArr) {
      const response = { 'success': true, 'results': audResArr };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error['message'] };
    res.status(400).send(response);
    return;
  });
};

// Get Audience Data by id
exports.getAudienceDataById = async (req, res) => {
  const id = req.params.id;
  await Audience.findById(id).sort({ _id: -1 }).exec().then(async (record) => {

    const audience_api_key = await Offer.findOne({ audience_id: record._id }).exec();
    if (audience_api_key !== null && record.audience_api_key !== "") {
      var audience_api_key_exist = "Yes";
    } else {
      var audience_api_key_exist = "No";
    }

    const audResArr = {
      _id: record._id,
      tid: record.tid,
      user_email: record.user_email,
      user_type: record.user_type,
      audience_type: record.audience_type,
      audience_name: record.audience_name,
      bundle_id: record.bundle_id,
      app_name: record.app_name,
      os_version: record.os_version,
      audience_api_key: record.audience_api_key,
      audience_api_key_exist: audience_api_key_exist,
      csv_file_name: record.csv_file_name,
      csv_link: record.csv_link,
      geo: record.geo,
      gender: record.gender,
      language: record.language,
      age_group: record.age_group,
      interest: record.interest,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
    if (audResArr) {
      const response = { 'success': true, 'results': audResArr };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error['message'] };
    res.status(400).send(response);
    return;
  });
};


// delete audience
exports.deleteAudience = (req, res) => {
  const id = req.params.id;
  Audience.findOneAndDelete({ _id: id }).exec().then((pubDel) => {
    if (pubDel) {
      const response = { 'success': true, 'results': "Audience deleted successfully!" };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error['message'] };
    res.status(400).send(response);
    return;
  });
};


// check audience name exist
exports.checkAudienceNameExist = async (req, res) => {
  const { audience_name, tid, _id } = req.body;
  if (!audience_name) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "audience_name is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  if (!tid) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "tid is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (typeof _id !== 'undefined' && _id !== '') {
    Audience.findOne({ '$and': [{ '_id': { '$ne': _id } }, { 'tid': parseInt(tid) }, { 'audience_name': audience_name }] }).exec().then((audienceName) => {
      if (audienceName) {
        const response = { 'success': true, 'results': { 'audienceNameExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'audienceNameExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  } else {
    Audience.findOne({ '$and': [{ 'tid': parseInt(tid) }, { 'audience_name': audience_name }] }).exec().then((audienceName) => {
      if (audienceName) {
        const response = { 'success': true, 'results': { 'audienceNameExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'audienceNameExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  }
}

// Get Audience Data by Advertiser Id
exports.getAudienceByAdvertiserId = async (req, res) => {
  const tid = req.params.advertiserId;
  await Audience.find({ tid: tid }).sort({ _id: -1 }).exec().then(async (audRes) => {
    var audResArr = [];
    for (let j = 0; j < audRes.length; j++) {
      let record = audRes[j];
      const audience_api_key = await Offer.findOne({ audience_id: record._id }).exec();
      if (audience_api_key !== null && record.audience_api_key !== "") {
        var audience_api_key_exist = "Yes";
      } else {
        var audience_api_key_exist = "No";
      }


      audResArr.push({
        _id: record._id,
        tid: record.tid,
        user_email: record.user_email,
        user_type: record.user_type,
        audience_type: record.audience_type,
        audience_name: record.audience_name,
        bundle_id: record.bundle_id,
        app_name: record.app_name,
        os_version: record.os_version,
        audience_api_key: record.audience_api_key,
        audience_api_key_exist: audience_api_key_exist,
        csv_file_name: record.csv_file_name,
        csv_link: record.csv_link,
        geo: record.geo,
        gender: record.gender,
        language: record.language,
        age_group: record.age_group,
        interest: record.interest,
        created_at: record.created_at,
        updated_at: record.updated_at
      })
    }

    if (audResArr) {
      const response = { 'success': true, 'results': audResArr };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error['message'] };
    res.status(400).send(response);
    return;
  });
};


// find by id and update
exports.updateAudience = (req, res) => {

  const _id = req.params.id;
  const { tid, user_email, user_type, audience_type, audience_name, bundle_id, app_name, os_version, audience_api_key, csv_file_name, csv_link, geo, gender, language, interest, age_group } = req.body;
  // console.log(RU_erid);
  // process.exit();
  // Validate request
  if (!tid || !user_email || !user_type || !audience_type || !audience_name) {
    var requestVal = "";
    if (!tid) {
      var requestVal = "tid";
    } else if (!user_email) {
      var requestVal = "user_email";
    } else if (!user_type) {
      var requestVal = "user_type";
    } else if (!audience_type) {
      var requestVal = "audience_type";
    } else if (!audience_name) {
      var requestVal = "audience_name";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(geo)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "geo should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(gender)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "gender should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(language)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(interest)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(age_group)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }

  Audience.findByIdAndUpdate(_id, req.body, { new: true, upsert: true }).exec().then(async (audienceRes) => {
    if (audienceRes) {

      if (req.file) {

        let data_name = req.file.originalname;
        let mimetype = req.file.mimetype;
        // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
        const buffer = req.file.buffer;
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
	  
	  const advDt = await getAdertiseDetailsByAdvId(tid);

      // INSERT DATA INTO NOTIFICATIONS
      const notificationData = {
        advertiser_id: parseInt(tid),
        advertiser_name: ucfirst(advDt.advertiserName),
        company_name: ucfirst(advDt.advName),
        offer_id: 0,
        offer_name: "",
        category: "Audience",

        subject_adv: "",
        message_adv: "",

        subject_sa: 'Applabs Alert - ' + ucfirst(audience_name) + 'has been edited',
        message_sa: "A new audience <span class='text_primary'> " + ucfirst(audience_name) + "</span> has been edited by <span class='text_primary'> " + ucfirst(advDt.advName) + "</span>",

        read: 0,
      }
      // END INSERT DATA INTO NOTIFICATIONS
      await addNotificationsData(notificationData);
	  
      const bcc_mail = process.env.BCC_EMAILS.split(",");
      // Send Mail to Admin
      const admin_mail = process.env.ADMIN_EMAILS.split(",");
      const emailTemplateAdmin = fs.readFileSync(path.join("templates/audience_update_admin.handlebars"), "utf-8");
      const templateAdmin = handlebars.compile(emailTemplateAdmin);
      const messageBodyAdmin = (templateAdmin({
        todayDate: dateprint(),
        audience_name: ucfirst(audience_name),
        adv_name: advDt.advName.toUpperCase(),
        //added_by: ucwords(added_by),
        url: process.env.APPLABS_URL + 'CreateAudiencePage',
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
        subject: 'Applabs Alert - ' + ucfirst(audience_name) + 'has been edited',
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

      const response = { 'success': true, 'message': 'Audience updated successfully', 'results': audienceRes };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error['message'] };
    res.status(400).send(response);
    return;
  });
};


exports.changePublisherStatus = (req, res) => {
  const { publisherId, pub_status, approved_by, approved_by_email } = req.body;
  // console.log(RU_erid);
  // process.exit();
  // Validate request
  if (!publisherId || !pub_status || !approved_by || !approved_by_email) {
    var requestVal = "";
    if (!publisherId) {
      var requestVal = "publisherId";
    } else if (!pub_status) {
      var requestVal = "pub_status";
    } else if (!approved_by) {
      var requestVal = "approved_by";
    } else if (!approved_by_email) {
      var requestVal = "approved_by_email";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(publisherId)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisherId should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(publisherId) && publisherId.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisherId is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  for (let i = 0; i < publisherId.length; i++) {
    let _id = publisherId[i];
    Publisher.findByIdAndUpdate(_id, { 'pub_status': pub_status }, { new: true }).exec().then(async (resStatus) => {
      if (!resStatus) {
        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
        res.status(200).send(resMsg);
        return;
      }
    }).catch((error) => {
      console.log('JKL');
      console.log(error);
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
      return;
    })
  }
  const response = { 'success': true, 'message': 'Status successfully updated.' };
  res.status(200).send(response);
  return;
}




