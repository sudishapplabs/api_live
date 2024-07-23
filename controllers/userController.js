const User = require("../models/userModel");
const Advertiser = require("../models/advertiserModel");
var ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, generateOTP, dateprint } = require('../common/helper');
var sprintf = require('sprintf-js').sprintf;

const { addNotificationsData } = require('../common/common');



const aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const Jimp = require("jimp");


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



exports.addUser = async (req, res) => {

  const { advertiser_id, profile_pic_name, profile_pic, name, email, mobile, comment, company_name, designation, im_id, user_type, permissions } = req.body;

  // Validate request
  if (!profile_pic_name || !profile_pic || !name || !email || !user_type, !im_id) {
    var requestVal = "";
    if (!profile_pic) {
      var requestVal = "profile_pic_name";
    } else if (!profile_pic) {
      var requestVal = "profile_pic";
    } else if (!name) {
      var requestVal = "name";
    } else if (!email) {
      var requestVal = "email";
    } else if (!user_type) {
      var requestVal = "user_type";
    } else if (!im_id) {
      var requestVal = "im_id";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  if (user_type == 'sa') {
    if (!advertiser_id) {
      const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiser is not allowed to be empty" } };
      res.status(400).send(reMsg);
      return;
    }

    if ((user_type == 'sa') && (advertiser_id != process.env.APPLABS_TID)) {
      const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Super Admin can't be added to this Advertiser." } };
      res.status(400).send(reMsg);
      return;
    } else {
      userType = user_type;
    }
  } else {
    var userType = 'user';
  }

  // check email already exist
  const checkEmailExist = await User.findOne({ email: email.toLowerCase() });
  if (checkEmailExist) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Email id already exist." } };
    res.status(400).send(reMsg);
    return;
  }

  try {
    const totUser = await User.findOne({ 'user_type': { '$ne': 'advertiser' } }).sort({ userId: -1 }).exec();
    const totalUser = (parseInt(totUser.userId) + 1);
    const userId = sprintf('%04d', totalUser);

    let data_val = profile_pic.replace(/^data:image\/[a-z]+;base64,/, "");
    let data_name = profile_pic_name;
    let mimetype = detectMimeType(profile_pic);
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


    const user = new User({
      userId: userId,
      profile_pic: profile_pic_name,
      name: name.toLowerCase(),
      email: email.toLowerCase(),
      company_name: company_name.toLowerCase(),
      tid: advertiser_id,
      contact: mobile,
      comment: comment,
      user_type: userType,
      status: true,
      profile_status: 'complete',
      permissions: permissions,
      im_id: im_id,
      designation: designation
    });

    // Save advertiser in user collection
    user.save(user).then(DBdata => {
      if (DBdata) {

        // Update Advertiser  user into advertiser collection
        const advUpdateData = {
          userId: userId,
          profile_pic: profile_pic_name,
          name: name.toLowerCase(),
          email: email.toLowerCase(),
          mobile: mobile,
          im_id: im_id,
          designation: designation
        };

        Advertiser.findOneAndUpdate({ tid: advertiser_id }, { '$push': { 'users': advUpdateData } }, { new: true }).exec().then(async (AdvertiserData) => {
          if (AdvertiserData) {

            // INSERT DATA INTO NOTIFICATIONS
            const notificationData = {
              advertiser_id: parseInt(advertiser_id),
              advertiser_name: ucfirst(AdvertiserData.name),
              company_name: ucfirst(AdvertiserData.organization),
              offer_id: 0,
              offer_name: "",
              category: "User",

              subject_adv: 'New User Added to ' + AdvertiserData.organization.toUpperCase(),
              message_adv: "Congratulations! A new user <span class='text_primary'> " + ucwords(AdvertiserData.name) + "</span>",

              subject_sa: 'Advertiser ' + AdvertiserData.organization.toUpperCase() + ' Added New User',
              message_sa: "This is to notify that the Advertiser <span class='text_primary'> " + ucfirst(AdvertiserData.organization) + "</span> has added a new user.",

              read: 0,
            }
            // END INSERT DATA INTO NOTIFICATIONS
            await addNotificationsData(notificationData);


            // Check mail preference is on or not
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            if (AdvertiserData.email_preferences == true) {

              ///////////////// Send Mail to User /////////////////
              const emailUserTemplate = fs.readFileSync(path.join("templates/user_account_created.handlebars"), "utf-8");
              const templateUser = handlebars.compile(emailUserTemplate);
              const messageBodyUser = (templateUser({
                todayDate: dateprint(),
                user_id: userId,
                adv_name: AdvertiserData.organization.toUpperCase(),
                role: ucwords(userType),
                designation: ucwords(designation),
                name: ucwords(AdvertiserData.name),
                url: process.env.APPLABS_URL + 'DashboardPage',
                base_url: process.env.APPLABS_URL
              }))
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              const msg_user = {
                to: [DBdata.email],
                from: {
                  name: process.env.MAIL_FROM_NAME,
                  email: process.env.MAIL_FROM_EMAIL,
                },
                bcc: bcc_mail,
                subject: 'Applabs Alert - New User Successfully Added',
                html: messageBodyUser
              };
              //ES6
              sgMail.send(msg_user).then(() => { }, error => {
                console.error(error);
                if (error.response) {
                  console.error(error.response.body)
                }
              }).catch((error) => {
                const response = { 'success': false, 'message': error };
                res.status(200).send(response);
                return;
              });
              // END EMAIlL SENT START


              ///////////////// Send Mail to Advertiser /////////////////

              const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/advertiser_user_account_created.handlebars"), "utf-8");
              const templateAdv = handlebars.compile(emailAdvertiserTemplate);
              const messageBodyAdv = (templateAdv({
                todayDate: dateprint(),
                adv_name: AdvertiserData.organization.toUpperCase(),
                advertiserName: ucwords(AdvertiserData.organization),
                role: ucwords(userType),
                designation: ucwords(designation),
                name: ucwords(AdvertiserData.name),
                url: process.env.APPLABS_URL + 'DashboardPage',
                base_url: process.env.APPLABS_URL
              }))

              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              const msg_adv = {
                to: [AdvertiserData.email],
                from: {
                  name: process.env.MAIL_FROM_NAME,
                  email: process.env.MAIL_FROM_EMAIL,
                },
                bcc: bcc_mail,
                subject: 'Applabs Alert - New User Added to ' + AdvertiserData.organization.toUpperCase(),
                html: messageBodyAdv
              };
              //ES6
              sgMail.send(msg_adv).then(() => { }, error => {
                console.error(error);
                if (error.response) {
                  console.error(error.response.body)
                }
              }).catch((error) => {
                const response = { 'success': false, 'message': error };
                res.status(200).send(response);
                return;
              });
              // END EMAIlL SENT START
            }

            ///////////////// Send Mail to Admin /////////////////
            const admin_mail = process.env.ADMIN_EMAILS.split(",");
            const emailTemplateAdmin = fs.readFileSync(path.join("templates/user_created_admin.handlebars"), "utf-8");
            const templateAdmin = handlebars.compile(emailTemplateAdmin);
            const messageBodyAdmin = (templateAdmin({
              todayDate: dateprint(),
              adv_name: AdvertiserData.organization.toUpperCase(),
              role: ucwords(userType),
              designation: ucwords(designation),
              name: ucwords(AdvertiserData.name),
              url: process.env.APPLABS_URL + 'UserList',
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
              subject: 'Applabs Alert - Advertiser ' + AdvertiserData.organization.toUpperCase() + '  Added New User',
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
            /////////////////// EMAIlL SENT END ////////////////////
            const response = { 'success': true, 'message': 'User Added Successfully.', 'results': AdvertiserData };
            res.status(200).send(response);
            return;
          } else {
            const reMsg = { "status": false, "message": 'Something went wrong please try again!  first' };
            res.status(200).send(reMsg);
            return;
          }
        }).catch((error) => {
          console.log('JKL');
          console.log(error);
          const reMsg = { "status": false, "message": error };
          res.status(400).send(reMsg);
          return;
        })
      } else {
        const resMsg = { "success": false, "message": "Something went wrong please try again!! second" };
        res.status(200).send(resMsg);
        return;
      }
    }).catch(err => {
      res.status(500).send({ message: err.message || "Errors detected, please try again." });
      return;
    });
  } catch (error) {
    const reMsg = { "status": false, "message": error.message };
    res.status(400).send(reMsg);
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, last_login, last_login_ip } = req.body;
  var login_otp = generateOTP(6);
  // check param validate
  const paramSchema = { 1: 'email', 2: 'last_login', 3: 'last_login_ip' };
  var new_array = [];
  for (var key in paramSchema) {
    if (!req.body.hasOwnProperty(paramSchema[key])) {
      new_array.push(paramSchema[key]);
    }
  }

  if (new_array.length !== 0) {
    let text = new_array.toString();
    const reMsg = { "success": false, "errors": { "statusCode": 500, "codeMsg": "VALIDATION_ERROR", "message": `${text} key is missing!` } };
    res.status(500).send(reMsg);
    return;
  }

  if (!email) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "email is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  try {
    User.findOne({ email }).exec().then((userData) => {
      if (userData) {
        if (userData.status == true) {
          // Send Mail to user with OTP
          const emailTemplate = fs.readFileSync(path.join("templates/login_otp.handlebars"), "utf-8");
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          const template = handlebars.compile(emailTemplate);
          const messageBody = (template({
            todayDate: dateprint(),
            name: ucfirst(userData.name),
            otp: login_otp,
            base_url: process.env.APPLABS_URL
          }))
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg = {
            to: [userData.email],
            from: {
              name: process.env.MAIL_FROM_NAME,
              email: process.env.MAIL_FROM_EMAIL,
            },
            bcc: bcc_mail,
            subject: 'Verification code for Applabs',
            html: messageBody
          };
          //ES6
          sgMail.send(msg).then(() => { }, error => {
            console.error(error);
            if (error.response) {
              console.error(error.response.body)
            }
          }).catch((error) => {
            console.error(error);
            const reMsg = { "success": false, "errors": { "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "At the Moment unable to send mail." } };
            res.status(200).send(reMsg);
            return;
          });
          const loginUpdatedata = {
            last_login: last_login,
            last_login_ip: last_login_ip
          }
          User.findOneAndUpdate({ email: email }, loginUpdatedata, { new: true }).exec().then((resUser) => {
            const response = { "success": true, "message": "OTP sent to your registered email address", 'otp': login_otp, 'results': resUser };
            res.status(200).send(response);
            return;
          }).catch((error) => {
            const reMsg = { "status": false, "message": error.message };
            res.status(400).send(reMsg);
            return;
          });
        } else {
          const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "This email id pending for review by admin." } };
          res.status(400).send(reMsg);
          return;
        }
      } else {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "This email is not registered! Please Signup." } };
        res.status(400).send(reMsg);
        return;
      }
    }).catch((error) => {
      const response = { 'success': false, 'message': error };
      res.status(400).send(response);
      return;
    })
  } catch (error) {
    const response = { 'success': false, 'message': error };
    res.status(500).send(response);
    return;
  }
};

// Get User Data
exports.getUserData = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const advertiserId = parseInt(req.query.advertiserId);
  const userType = req.query.userType;


  const { sorttype, sortdirection, advId, searchQuery, status } = req.body;

  if (sorttype && sortdirection) {
    var sortObject = {};
    var stype = sorttype;
    var sdir = sortdirection;
    sortObject[stype] = sdir;
  } else {
    var sortObject = {};
    var stype = '_id';
    var sdir = -1;
    sortObject[stype] = sdir;
  }

  if (!userType) {
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "userType is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  var filter = {};
  if (userType == "sa") {
    filter['user_type'] = { '$ne': 'advertiser' };
    if (advId) {
      filter['tid'] = advId;
    }
  } else {
    filter['user_type'] = 'user';
    if ((userType == "user") || (userType == "advertiser")) {
      if (advertiserId) {
        filter['tid'] = advertiserId;
      }
    }
  }

  if (typeof searchQuery !== "undefined" && searchQuery !== "") {
    const myArray = Array.from(searchQuery);
    var num = myArray[0];
    var searchId = "";
    if (searchQuery && isNumeric(searchQuery) && num !== '0') {
      searchId = parseInt(searchQuery);
      filter['tid'] = searchId;
    } else if (num == '0') {
      filter['userId'] = { '$regex': searchQuery, $options: 'i' }
    } else {
      Object.assign(filter, {
        $or: [{ 'email': { '$regex': searchQuery, $options: 'i' } }, { 'name': { '$regex': searchQuery, $options: 'i' } }]
      });
    }
  }



  if (typeof status !== "undefined" && status !== "") {
    if (status == "true") {
      filter['status'] = true;
    } else {
      filter['status'] = false;
    }
  }


  var filters = {};
  if (userType == "sa") {
    filters['user_type'] = { '$ne': 'advertiser' };
    if (advId) {
      filters['tid'] = advId;
    }
  } else {
    filters['user_type'] = 'user';
    if ((userType == "user") || (userType == "advertiser")) {
      if (advertiserId) {
        filters['tid'] = advertiserId;
      }
    }
  }

  if (typeof searchQuery !== "undefined" && searchQuery !== "") {
    const myArray = Array.from(searchQuery);
    var num = myArray[0];
    var searchId = "";
    if (searchQuery && isNumeric(searchQuery) && num !== '0') {
      searchId = parseInt(searchQuery);
      filters['tid'] = searchId;
    } else if (num == '0') {
      filters['userId'] = { '$regex': searchQuery, $options: 'i' }
    } else {
      Object.assign(filters, {
        $or: [{ 'email': { '$regex': searchQuery, $options: 'i' } }, { 'name': { '$regex': searchQuery, $options: 'i' } }]
      });
    }
  }

  if (typeof status !== "undefined" && status !== "") {
    if (status == "true") {
      filters['status'] = true;
    } else {
      filters['status'] = false;
    }
  }

  let result = await User.aggregate([
    { '$match': filters },
    {
      '$lookup': {
        'foreignField': 'tid',
        'localField': 'tid',
        'as': 'Advertiser',
        'from': 'advertiser'
      }
    },
    { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        'advertiser.profile_pic': '$Advertiser.profile_pic'
      }
    }, {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort(sortObject).exec();

  var totalUser = parseInt(result.length);



  console.log(JSON.stringify(filter))

  await User.aggregate([
    { '$match': filter },
    {
      '$lookup': {
        'foreignField': 'tid',
        'localField': 'tid',
        'as': 'Advertiser',
        'from': 'advertiser'
      }
    },
    { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        'advertiser.profile_pic': '$Advertiser.profile_pic'
      }
    }, {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort(sortObject).skip(skipIndex).limit(limit).exec().then((users) => {
    if (users) {
      const response = { 'success': true, 'totoalRecords': totalUser, 'results': users };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch(error => {
    console.log(error);
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });

};


exports.userStatusUpdate = async (req, res) => {

  // check body key
  const paramSchema = { 1: 'userId', 2: 'userStatus', 3: 'approved_by', 4: 'approved_by_email' };
  var new_array = [];
  for (var key in paramSchema) {
    if (!req.body.hasOwnProperty(paramSchema[key])) {
      new_array.push(paramSchema[key]);
    }
  }

  if (new_array.length !== 0) {
    let text = new_array.toString();
    const response = { "status": false, "message": `${text} is missing!` };
    res.status(200).send(response);
    return;
  }

  const { userId, userStatus, approved_by, approved_by_email } = req.body;
  const status = (userStatus == 'active') ? true : false;

  // Validate request
  if (!userStatus || !approved_by || !approved_by_email) {
    var requestVal = "";
    if (!userStatus) {
      var requestVal = "userStatus";
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

  if (!Array.isArray(userId)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "userId should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(userId) && userId.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "userId is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }


  try {
    const updateDbStatus = await User.updateMany({ _id: { '$in': userId } }, { 'status': status }).exec();
    if (updateDbStatus) {
      for (let i = 0; i < userId.length; i++) {
        let _id = userId[i];
        const res_user_status = await User.findOne({ _id }).exec();
        if (userStatus != 'active') {

          // INSERT DATA INTO NOTIFICATIONS
          const notificationData = {
            advertiser_id: parseInt(res_user_status.tid),
            advertiser_name: ucfirst(res_user_status.name),
            company_name: ucfirst(res_user_status.company_name),
            offer_id: 0,
            offer_name: "",
            category: "User",

            subject_adv: "",
            message_adv: "",

            subject_sa: 'User ' + res_user_status.name.toUpperCase() + ' Account is Suspended',
            message_sa: "This is to notify that the user <span class='text_primary'> " + ucwords(res_user_status.name) + "</span> account from advertiser <span class='text_primary'> " + ucfirst(res_user_status.company_name) + "! </span> has been suspended by <span class='text_primary'> " + ucwords(approved_by) + "[" + approved_by_email + "]</span> due to violations of our Terms & Conditions.",

            read: 0,
          }
          // END INSERT DATA INTO NOTIFICATIONS
          await addNotificationsData(notificationData);

          // Send Mail to Admin if status inactive/suspended
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          const admin_mail = process.env.ADMIN_EMAILS.split(",");
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/user_account_suspended_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            user_name: ucwords(res_user_status.name),
            suspended_by: ucwords(approved_by),
            suspended_by_email: approved_by_email,
            adv_name: res_user_status.company_name.toUpperCase(),
            url: process.env.APPLABS_URL + 'UserList',
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
            subject: 'Applabs Alert - User ' + res_user_status.name.toUpperCase() + ' Account is Suspended',
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

        } else {

          // INSERT DATA INTO NOTIFICATIONS
          const notificationData = {
            advertiser_id: parseInt(res_user_status.tid),
            advertiser_name: ucfirst(res_user_status.name),
            company_name: ucfirst(res_user_status.company_name),
            offer_id: 0,
            offer_name: "",
            category: "User",

            subject_adv: "",
            message_adv: "",

            subject_sa: 'User ' + res_user_status.name.toUpperCase() + ' has been Approved',
            message_sa: "An user <span class='text_primary'> " + ucwords(res_user_status.name) + "</span> from advertiser <span class='text_primary'> " + ucfirst(res_user_status.company_name) + "! </span> has been approved by <span class='text_primary'> " + approved_by + " [" + approved_by_email + "</span>.",

            read: 0,
          }
          // END INSERT DATA INTO NOTIFICATIONS
          await addNotificationsData(notificationData);


          // Send Mail to Admin if status approved
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          const admin_mail = process.env.ADMIN_EMAILS.split(",");
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/user_account_approved_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            user_name: ucwords(res_user_status.name),
            approved_by: ucwords(approved_by),
            approved_by_email: approved_by_email,
            adv_name: res_user_status.company_name.toUpperCase(),
            url: process.env.APPLABS_URL + 'UserList',
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
            subject: 'Applabs Alert - User ' + res_user_status.name.toUpperCase() + ' has been Approved',
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
        }

      }
      const response = { 'success': true, 'message': 'Status successfully updated.' };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      res.status(200).send(resMsg);
      return;
    }
  } catch (error) {
    console.log(error);
    const response = { "status": false, "message": error.message };
    res.status(400).send(response);
    return;
  }
}


// Get User Data by id
exports.getUserDataById = async (req, res) => {
  const _id = req.params.id;
  User.findOne({ _id }).sort({ _id: -1 }).exec().then((users) => {
    if (users) {
      const response = { 'success': true, 'results': [users] };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch(error => {
    console.log(error);
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });

};


exports.updateUserProfile = async (req, res) => {
  const _id = req.params.id;
  const { advertiser_id, profile_pic_name, profile_pic, name, email, mobile, comment, company_name, designation, im_id, user_type, permissions } = req.body;

  // Validate request
  if (!profile_pic_name || !name || !email || !user_type || !im_id) {
    var requestVal = "";
    if (!profile_pic_name) {
      var requestVal = "profile_pic_name";
    } else if (!name) {
      var requestVal = "name";
    } else if (!email) {
      var requestVal = "email";
    } else if (!user_type) {
      var requestVal = "user_type";
    } else if (!im_id) {
      var requestVal = "im_id";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  if (user_type == 'sa') {
    if (!advertiser_id) {
      const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiser is not allowed to be empty" } };
      res.status(400).send(reMsg);
      return;
    }

    if ((user_type == 'sa') && (advertiser_id != process.env.APPLABS_TID)) {
      const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Super Admin can't be added to this Advertiser." } };
      res.status(400).send(reMsg);
      return;
    } else {
      userType = user_type;
    }
  } else {
    var userType = 'user';
  }

  try {

    if (profile_pic) {
      let data_val = profile_pic.replace(/^data:image\/[a-z]+;base64,/, "");
      let data_name = profile_pic_name;
      let mimetype = detectMimeType(profile_pic);
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

    const advUpdateData = {
      profile_pic: profile_pic_name,
      name: name.toLowerCase(),
      company_name: company_name.toLowerCase(),
      contact: mobile,
      comment: comment,
      user_type: userType,
      status: true,
      profile_status: 'complete',
      permissions: permissions,
      im_id: im_id,
      designation: designation
    }
    // Save User in user collection
    await User.findByIdAndUpdate(_id, advUpdateData, { new: true }).exec().then(async (DBdata) => {
      if (DBdata) {

        // Update Advertiser  user into advertiser collection
        const advUpdateData = {
          'users.$.userId': DBdata.userId,
          'users.$.profile_pic': profile_pic_name,
          'users.$.name': name.toLowerCase(),
          'users.$.email': DBdata.email.toLowerCase(),
          'users.$.mobile': mobile,
          'users.$.im_id': im_id,
          'users.$.designation': designation
        };

        await Advertiser.updateOne({ tid: advertiser_id, 'users.userId': DBdata.userId }, { '$set': advUpdateData }, { new: true }).exec().then((AdvertiserData) => {
          if (AdvertiserData) {
            const response = { 'success': true, 'message': 'User Updated Successfully.', 'results': [DBdata] };
            res.status(200).send(response);
            return;
          } else {
            const reMsg = { "status": false, "message": 'Something went wrong please try again!  first' };
            res.status(200).send(reMsg);
            return;
          }
        }).catch((error) => {
          console.log('JKL');
          console.log(error);
          const reMsg = { "status": false, "message": error };
          res.status(400).send(reMsg);
          return;
        })
      } else {
        const resMsg = { "success": false, "message": "Something went wrong please try again!! second" };
        res.status(200).send(resMsg);
        return;
      }
    }).catch(err => {
      res.status(500).send({ message: err.message || "Errors detected, please try again." });
      return;
    });
  } catch (error) {
    const reMsg = { "status": false, "message": error.message };
    res.status(400).send(reMsg);
  }
};