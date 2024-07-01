const Advertiser = require("../models/advertiserregisterModel");
const AdvertiserUpdate = require("../models/advertiserModel");
const User = require("../models/userregisterModel");
const Users = require("../models/userModel");
const { isNumeric, isNumericVal, dateprint } = require('../common/helper');
const aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const { addNotificationsData } = require('../common/common');


const { lookup } = require('geoip-lite');

const shortid = require('shortid');
const axios = require('axios');


const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");

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

// update advertiser profile after first login
exports.updateAdvertiserProfile = async (req, res) => {
  const paramSchema = { 1: 'profile_pic', 2: 'advertiser_name', 3: 'organization', 4: 'website', 5: 'email', 6: 'mobile', 7: 'im_id', 8: 'address', 9: 'state', 10: 'country', 11: 'zip', 12: 'email_preferences' };
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

  const { profile_pic_name, profile_pic, advertiser_name, organization, website, email, mobile, im_id, address, state, country, zip, email_preferences, billing_detail } = req.body;
  // Validate request
  if (!profile_pic_name || !advertiser_name || !organization || !website || !email || !mobile || !im_id || !address || !state || !country || !zip) {
    var requestVal = "";
    if (!profile_pic_name) {
      var requestVal = "profile_pic_name";
    } else if (!advertiser_name) {
      var requestVal = "advertiser_name";
    } else if (!organization) {
      var requestVal = "organization";
    } else if (!website) {
      var requestVal = "website";
    } else if (!email) {
      var requestVal = "email";
    } else if (!mobile) {
      var requestVal = "mobile";
    } else if (!im_id) {
      var requestVal = "im_id";
    } else if (!address) {
      var requestVal = "address";
    } else if (!state) {
      var requestVal = "state";
    } else if (!country) {
      var requestVal = "country";
    } else if (!zip) {
      var requestVal = "zip";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // Update Advertiser or profile update
  const advUpdateData = {
    profile_pic: profile_pic_name,
    website: website,
    mobile: mobile,
    im_id: im_id,
    address: address,
    state: state,
    country: country,
    zip: zip,
    email_preferences: email_preferences,
    billing_detail: billing_detail
  }

  try {

    Users.findOneAndUpdate({ email: email }, { profile_status: 'complete' }, { new: true }).exec().then((resUser) => {

      if (resUser) {

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

        AdvertiserUpdate.findOneAndUpdate({ email: email.toLowerCase() }, advUpdateData, { new: true }).exec().then((AdvertiserData) => {
          if (AdvertiserData) {
            const response = { 'success': true, 'message': 'Details updated successfully.', 'results': AdvertiserData };
            res.status(200).send(response);
            return;
          } else {
            const reMsg = { "status": false, "message": 'Something went wrong please try again!' };
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
        const reMsg = { "status": false, "message": 'Something went wrong please try again!' };
        res.status(200).send(reMsg);
        return;
      }
    }).catch((error) => {
      console.log('user JKL');
      console.log(error);
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
      return;
    })

  } catch (error) {
    console.log(error);
    const reMsg = { "status": false, "message": error };
    res.status(400).send(reMsg);
    return;
  }
}



// Add a Advertiser by super admin
exports.addAdvertiser = async (req, res) => {

  const signupCountry = "IN";
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);
    signupCountry = lookup(ip).country;
  } catch (error) {
    // console.log("lookup error");
    // console.log(error);
  }


  // process.exit();

  const paramSchema = { 1: 'profile_pic', 2: 'advertiser_name', 3: 'organization', 4: 'website', 5: 'email', 6: 'mobile', 7: 'im_id', 8: 'address', 9: 'state', 10: 'country', 11: 'zip', 12: 'email_preferences', 13: 'profile_pic_name' };
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

  const { profile_pic_name, profile_pic, advertiser_name, organization, website, email, mobile, comment, im_id, address, state, country, zip, email_preferences, assigned_to, billing_detail, added_by } = req.body;
  // Validate request
  if (!profile_pic_name || !profile_pic || !advertiser_name || !organization || !website || !email || !mobile || !comment || !im_id || !address || !state || !country || !zip || !assigned_to || !added_by) {
    var requestVal = "";
    if (!profile_pic_name) {
      var requestVal = "profile_pic_name";
    } else if (!profile_pic) {
      var requestVal = "profile_pic";
    } else if (!advertiser_name) {
      var requestVal = "advertiser_name";
    } else if (!organization) {
      var requestVal = "organization";
    } else if (!website) {
      var requestVal = "website";
    } else if (!email) {
      var requestVal = "email";
    } else if (!mobile) {
      var requestVal = "mobile";
    } else if (!comment) {
      var requestVal = "comment";
    } else if (!im_id) {
      var requestVal = "im_id";
    } else if (!address) {
      var requestVal = "address";
    } else if (!state) {
      var requestVal = "state";
    } else if (!country) {
      var requestVal = "country";
    } else if (!zip) {
      var requestVal = "zip";
    } else if (!assigned_to) {
      var requestVal = "assigned_to";
    } else if (!added_by) {
      var requestVal = "added_by";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // check organization already exist
  const checkCompanyExist = await Users.findOne({ organization: organization.toLowerCase() });
  if (checkCompanyExist) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Advertiser already exist." } };
    res.status(400).send(reMsg);
    return;
  }

  // check email already exist
  const checkEmailExist = await Users.findOne({ email: email.toLowerCase() });
  if (checkEmailExist) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Email id already exist." } };
    res.status(400).send(reMsg);
    return;
  }

  // console.log(lookup(ip)); // location of the user
  // {
  //   1|app      |   range: [ 241336320, 241344511 ],
  //   1|app      |   country: 'IN',
  //   1|app      |   region: '',
  //   1|app      |   eu: '0',
  //   1|app      |   timezone: 'Asia/Kolkata',
  //   1|app      |   city: '',
  //   1|app      |   ll: [ 20, 77 ],
  //   1|app      |   metro: 0,
  //   1|app      |   area: 1000
  //   1|app      | 
  // }
  const user = new Users({
    name: advertiser_name.toLowerCase(),
    email: email.toLowerCase(),
    company_name: organization.toLowerCase(),
    contact: mobile,
    comment: comment,
    user_type: 'advertiser',
    status: true,
    profile_status: 'in_complete',
    signup_country: signupCountry
  });

  // Save advertiser in user collection
  user.save(user).then(DBdata => {
    if (DBdata) {

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

      // Add Advertiser 
      const advertiser = new AdvertiserUpdate({
        profile_pic: profile_pic_name,
        name: advertiser_name.toLowerCase(),
        organization: organization,
        website: website,
        email: email.toLowerCase(),
        mobile: mobile,
        im_id: im_id,
        address: address,
        state: state,
        country: country,
        zip: zip,
        email_preferences: email_preferences,
        billing_detail: billing_detail,
        assigned_to: assigned_to
      });

      advertiser.save(advertiser).then(ADBdata => {
        if (ADBdata) {

          const advEmail = shortid.generate() + "@applabs.ai";
          const advPostData = {
            name: process.env.AL_PREFIX + "-" + organization,
            email: advEmail,
            company: process.env.AL_PREFIX + "-" + organization,
            password: "12345678",
            status: "active"
          };

          // create advertiser on trackier
          const axios_header = {
            headers: {
              'x-api-key': process.env.API_KEY,
              'Content-Type': 'application/json'
            }
          };
          axios.post(process.env.API_BASE_URL + "advertisers", advPostData, axios_header).then((adv_create_res) => {
            if (typeof adv_create_res.data.success !== 'undefined' && adv_create_res.data.success == true) {

              Users.findOneAndUpdate({ email: email.toLowerCase() }, { profile_status: 'complete', 'tid': adv_create_res.data.advertiser.id }, { new: true }).exec().then((resUser) => {
                if (resUser) {

                  AdvertiserUpdate.findOneAndUpdate({ email: email.toLowerCase() }, { 'tid': adv_create_res.data.advertiser.id }, { new: true }).exec().then(async (resAdvertiser) => {
                    if (resAdvertiser) {

                      // INSERT DATA INTO NOTIFICATIONS
                      const notificationData = {
                        advertiser_id: parseInt(adv_create_res.data.advertiser.id),
                        advertiser_name: resAdvertiser.name.toUpperCase(),
                        company_name: resAdvertiser.organization.toUpperCase(),
                        offer_id: 0,
                        offer_name: "",
                        category: "Advertiser",
                        subject_sa: ucwords(added_by) + ' added New Advertiser',
                        subject_adv: 'Welcome to Applabs!',
                        message_sa: "Congratulations! A new advertiser <span class='text_primary'> " + resAdvertiser.organization.toUpperCase() + "</span> has been signed up by Admin <span class='text_primary'> " + ucwords(added_by) + "!</span>",
                        message_adv: "Your advertiser account has been created.",
                        read: 0,
                      }
                      // END INSERT DATA INTO NOTIFICATIONS
                      await addNotificationsData(notificationData);


                      //////////////////////////////////////
                      // EMAIlL SENT START
                      // send Mail to user
                      const bcc_mail = process.env.BCC_EMAILS.split(",");
                      const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/advertiser_account_created.handlebars"), "utf-8");
                      const templateAdv = handlebars.compile(emailAdvertiserTemplate);
                      const messageBodyAdv = (templateAdv({
                        todayDate: dateprint(),
                        name: ucfirst(resAdvertiser.name),
                        adv_name: resAdvertiser.organization.toUpperCase(),
                        url: process.env.APPLABS_URL + 'dashboard',
                        base_url: process.env.APPLABS_URL
                      }))
                      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                      const msg_adv = {
                        to: [resAdvertiser.email],
                        from: {
                          name: process.env.MAIL_FROM_NAME,
                          email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Welcome to Applabs!',
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

                      // Send Mail to Admin
                      const admin_mail = process.env.ADMIN_EMAILS.split(",");
                      const emailTemplateAdmin = fs.readFileSync(path.join("templates/advertiser_account_created_admin.handlebars"), "utf-8");
                      const templateAdmin = handlebars.compile(emailTemplateAdmin);
                      const messageBodyAdmin = (templateAdmin({
                        todayDate: dateprint(),
                        adv_name: resAdvertiser.organization.toUpperCase(),
                        added_by: ucwords(added_by),
                        url: process.env.APPLABS_URL + 'all_advertiser',
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
                        subject: 'Applabs Alert - ' + added_by + ' added New Advertiser',
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

                      ////////////////////////////////////
                      const response = { 'success': true, 'message': 'Profile successfully created.', 'results': resAdvertiser };
                      res.status(200).send(response);
                      return;
                    } else {
                      const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                      res.status(200).send(resMsg);
                      return;
                    }
                  }).catch((error) => {
                    console.log('Advertiser JKL');
                    console.log(error);
                    const reMsg = { "status": false, "message": error };
                    res.status(400).send(reMsg);
                    return;
                  })
                } else {
                  const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                  res.status(200).send(resMsg);
                  return;
                }
              }).catch((error) => {
                console.log('user JKL');
                console.log(error);
                const reMsg = { "status": false, "message": error };
                res.status(400).send(reMsg);
                return;
              })
            } else {
              const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
              res.status(200).send(resMsg);
              return;
            }
          }).catch((error) => {
            console.log('DFG');
            console.log(error);
            const reMsg = { "status": false, "message": error };
            res.status(400).send(reMsg);
          });
        } else {
          const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
          res.status(200).send(resMsg);
          return;
        }
      }).catch(err => {
        res.status(500).send({ message: err.message || "Errors detected, please try again." });
        return;
      });
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch(err => {
    res.status(500).send({ message: err.message || "Errors detected, please try again." });
    return;
  });
};


// Signup a Advertiser
exports.registerAdvertiser = async (req, res) => {
  const signupCountry = "IN";
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    signupCountry = lookup(ip).country;
  } catch (error) {

  }
  // console.log(lookup(ip)); // location of the user
  // {
  //   1|app      |   range: [ 241336320, 241344511 ],
  //   1|app      |   country: 'IN',
  //   1|app      |   region: '',
  //   1|app      |   eu: '0',
  //   1|app      |   timezone: 'Asia/Kolkata',
  //   1|app      |   city: '',
  //   1|app      |   ll: [ 20, 77 ],
  //   1|app      |   metro: 0,
  //   1|app      |   area: 1000
  //   1|app      | 
  // }
  const { name, email, company_name, contact, comment } = req.body;
  // Validate request
  if (!company_name || !name || !email || !contact) {
    var requestVal = "";
    if (!company_name) {
      var requestVal = "company_name";
    } else if (!name) {
      var requestVal = "name";
    } else if (!email) {
      var requestVal = "email";
    } else if (!contact) {
      var requestVal = "contact";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // check company_name already exist
  const checkCompanyExist = await Users.findOne({ company_name: company_name.toLowerCase() });
  if (checkCompanyExist) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Advertiser already exist." } };
    res.status(400).send(reMsg);
    return;
  }

  // check email already exist
  const checkEmailExist = await Users.findOne({ email: email.toLowerCase() });
  if (checkEmailExist) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Email id already exist." } };
    res.status(400).send(reMsg);
    return;
  }

  const user = new Users({
    name: name.toLowerCase(),
    email: email.toLowerCase(),
    company_name: company_name.toLowerCase(),
    contact: contact,
    comment: comment,
    user_type: 'advertiser',
    status: false,
    profile_status: 'in_complete',
    signup_country: signupCountry
  });

  // Save advertiser in user collection
  user.save(user).then(async DBdata => {
    if (DBdata) {


      // INSERT DATA INTO NOTIFICATIONS
      const notificationData = {
        advertiser_id: 0,
        advertiser_name: name,
        company_name: company_name,
        offer_id: 0,
        offer_name: "",
        category: "Advertiser",
        subject_sa: 'A New Advertiser Just Signed up',
        subject_adv: 'Thank You for Signing up with Applabs!',
        message_sa: "Congratulations! A new Advertiser Partner <span class='text_primary'>" + company_name.toLowerCase() + "</span> just onboarded & signed up!",
        message_adv: "Thank You for signing up with Applabs!, Your registration request is currently under review and we will update you on the status soon.",
        read: 0,
      }
      await addNotificationsData(notificationData);


      // EMAIlL SENT START
      const bcc_mail = process.env.BCC_EMAILS.split(",");
      // send Mail to user
      const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/register_advertiser.handlebars"), "utf-8");
      const templateAdv = handlebars.compile(emailAdvertiserTemplate);
      const messageBodyAdv = (templateAdv({
        todayDate: dateprint(),
        name: ucfirst(DBdata.name),
        base_url: process.env.APPLABS_URL
      }))
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg_adv = {
        to: [DBdata.email],
        from: {
          name: process.env.MAIL_FROM_NAME,
          email: process.env.MAIL_FROM_EMAIL,
        },
        bcc: bcc_mail,
        subject: 'Thank You for Signing up with Applabs!',
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

      // Send Mail to Admin
      const admin_mail = process.env.ADMIN_EMAILS.split(",");
      const emailTemplateAdmin = fs.readFileSync(path.join("templates/register_advertiser_admin.handlebars"), "utf-8");
      const templateAdmin = handlebars.compile(emailTemplateAdmin);
      const messageBodyAdmin = (templateAdmin({
        todayDate: dateprint(),
        adv_name: DBdata.company_name.toUpperCase(),
        url: process.env.APPLABS_URL + 'all_advertiser',
        base_url: process.env.APPLABS_URL
      }))
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msgAdmin = {
        to: admin_mail,
        //to:"sudish@applabs.ai",
        from: {
          name: process.env.MAIL_FROM_NAME,
          email: process.env.MAIL_FROM_EMAIL,
        },
        bcc: bcc_mail,
        subject: 'Applabs Alert - A New Advertiser Just Signed up',
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
      const resMsg = { 'success': true, 'message': "Successfully Registered!", 'results': DBdata };
      res.status(200).send(resMsg);
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch(err => {
    res.status(500).send({ message: err.message || "Errors detected, please try again." });
    return;
  });
};



// Get Advertiser Data
exports.getAdvertiserData = async (req, res, next) => {

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const { searchQuery, sorttype, sortdirection, adv_status, assigned } = req.body;

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

  var filter = {};
  filter['user_type'] = 'advertiser';
  if (typeof adv_status !== "undefined" && adv_status !== 'all') {
    if (adv_status == "active") {
      filter['status'] = true;
    } else if (adv_status == "in_active") {
      filter['status'] = false;
      filter['tid'] = { '$exists': true };
    } else if (adv_status == "pending") {
      filter['tid'] = { '$exists': false };
    }
  }


  if (typeof searchQuery !== "undefined" && searchQuery !== "") {

    if (searchQuery && isNumeric(searchQuery)) {
      filter['tid'] = parseInt(searchQuery);
    } else {
      Object.assign(filter, {
        $or: [{ 'name': { '$regex': searchQuery, $options: 'i' } }, { 'email': { '$regex': searchQuery, $options: 'i' } }, { 'company_name': { '$regex': searchQuery, $options: 'i' } }]
      });
    }

  }

  var filters = {};
  if (typeof assigned !== "undefined" && assigned.length > 0) {
    filters['Advertiser.assigned_to.email'] = { '$in': assigned };
  }

  try {
    let result = await Users.aggregate([
      { '$match': filter },
      {
        $lookup:
        {
          from: "campaign_manager",
          localField: "tid",
          foreignField: "trackier_adv_id", as: "offerData"
        }
      }, {
        $addFields: {
          totalOffers: {
            $size: {
              $filter: {
                input: "$offerData",
                as: "offer",
                cond: { $ne: ["$$offer.trackier_camp_id", 0] } // Conditional check on a field from the 'offers' collection
              }
            }
          }
        }
      },
      {
        $project: {
          'offerData': 0
        }
      },
      {
        $lookup:
        {
          from: "funds",
          localField: "tid",
          foreignField: "tid", as: "fundData"
        }
      }, {
        $addFields: { totalTransaction: { $size: "$fundData" } }
      },
      {
        $project: {
          'fundData': 0
        }
      },
      {
        '$lookup': {
          'foreignField': 'tid',
          'localField': 'tid',
          'as': 'Advertiser',
          'from': 'advertiser'
        }
      }, { '$match': filters },
      { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "advertiserBalance": "$Advertiser.balance",
          "advertiserWebsite": "$Advertiser.website",
          "advertiserCountry": "$Advertiser.country",
          "advertiserSalesPartner": "$Advertiser.assigned_to",
          "advertiserImid": "$Advertiser.im_id",
          "advertiserProfilepic": "$Advertiser.profile_pic"
        }
      },
      {
        $project: {
          'Advertiser': 0
        }
      }
    ]).exec();
    var totalAdvertisers = parseInt(result.length);
  } catch (err) {
    console.log(err);
  }

  console.log(JSON.stringify(filter));

  Users.aggregate([
    { '$match': filter },
    {
      $lookup:
      {
        from: "campaign_manager",
        localField: "tid",
        foreignField: "trackier_adv_id", as: "offerData"
      }
    }, {
      $addFields: {
        totalOffers: {
          $size: {
            $filter: {
              input: "$offerData",
              as: "offer",
              cond: { $ne: ["$$offer.trackier_camp_id", 0] } // Conditional check on a field from the 'offers' collection
            }
          }
        }
      }
    },
    {
      $project: {
        'offerData': 0
      }
    },
    {
      $lookup:
      {
        from: "funds",
        localField: "tid",
        foreignField: "tid", as: "fundData"
      }
    }, {
      $addFields: { totalTransaction: { $size: "$fundData" } }
    },
    {
      $project: {
        'fundData': 0
      }
    },
    {
      '$lookup': {
        'foreignField': 'tid',
        'localField': 'tid',
        'as': 'Advertiser',
        'from': 'advertiser'
      }
    }, { '$match': filters },
    { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        "advertiserBalance": "$Advertiser.balance",
        "advertiserWebsite": "$Advertiser.website",
        "advertiserCountry": "$Advertiser.country",
        "advertiserSalesPartner": "$Advertiser.assigned_to",
        "advertiserImid": "$Advertiser.im_id",
        "advertiserProfilepic": "$Advertiser.profile_pic"
      }
    },
    {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort(sortObject).skip(skipIndex).limit(limit).exec().then((advRes) => {

    if (advRes) {
      const response = { 'success': true, 'totoalRecords': totalAdvertisers, 'results': advRes };
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


// Advertiser Status Approved after register by super admin for login
exports.advertiserSatatusApproved = async (req, res) => {

  const paramSchema = { 1: 'advStatus', 2: 'approved_by', 3: 'advertiserId', 4: 'approved_by_email' };
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

  const { advStatus, approved_by, approved_by_email, advertiserId } = req.body;
  const status = (advStatus == 'active') ? true : false;
  // Validate request
  if (!advStatus || !approved_by || !approved_by_email) {
    var requestVal = "";
    if (!advStatus) {
      var requestVal = "advStatus";
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

  if (!Array.isArray(advertiserId)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiserId should be []!!" } };
    res.status(400).send(reMsg);
    return;
  } else if (Array.isArray(advertiserId) && advertiserId.length == 0) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiserId is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  try {
    for (let i = 0; i < advertiserId.length; i++) {
      let adv_id = advertiserId[i];
      if (isNumericVal(adv_id)) {
        Users.findOne({ '$and': [{ 'tid': parseInt(adv_id) }, { 'user_type': 'advertiser' }] }).exec().then((adv_collect) => {
          if (adv_collect && adv_collect.status !== status) {
            Users.findOneAndUpdate({ tid: parseInt(adv_id) }, { 'status': status }).exec().then(async (adv_user_status) => {
              if (adv_user_status) {
                if (advStatus !== 'active') {

                  // INSERT DATA INTO NOTIFICATIONS
                  const notificationData = {
                    advertiser_id: parseInt(adv_id),
                    advertiser_name: ucfirst(adv_collect.name),
                    company_name: ucfirst(adv_collect.company_name),
                    offer_id: 0,
                    offer_name: "",
                    category: "Advertiser",
                    subject_sa: 'Advertiser ' + adv_collect.company_name.toUpperCase() + ' Ad Account is Suspended',
                    subject_adv: "",
                    message_sa: "<span class='text_primary'>" + ucfirst(adv_collect.company_name) + "</span> account has been suspended by Admin <span class='text_primary'>" + ucfirst(approved_by) + "[" + suspended_by_email + "]</span> due to violations of our Terms & Conditions.",
                    message_adv: "",
                    read: 0,
                  }
                  // END INSERT DATA INTO NOTIFICATIONS
                  await addNotificationsData(notificationData);

                  // Send Mail to Admin if status inactive/suspended
                  const bcc_mail = process.env.BCC_EMAILS.split(",");
                  const admin_mail = process.env.ADMIN_EMAILS.split(",");
                  const emailTemplateAdmin = fs.readFileSync(path.join("templates/advertiser_account_suspended.handlebars"), "utf-8");
                  const templateAdmin = handlebars.compile(emailTemplateAdmin);
                  const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    suspended_by: ucfirst(approved_by),
                    suspended_by_email: approved_by_email,
                    adv_name: ucfirst(adv_collect.company_name),
                    url: process.env.APPLABS_URL + 'all_advertiser',
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
                    subject: 'Applabs Alert - Advertiser ' + adv_collect.company_name.toUpperCase() + ' Ad Account is Suspended',
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
                    advertiser_id: parseInt(adv_id),
                    advertiser_name: ucfirst(adv_collect.name),
                    company_name: ucfirst(adv_collect.company_name),
                    offer_id: 0,
                    offer_name: "",
                    category: "Advertiser",
                    subject_sa: 'Advertiser ' + adv_collect.company_name.toUpperCase() + ' has been Approved',
                    subject_adv: '',
                    message_sa: "An Advertiser <span class='text_primary'> " + ucfirst(adv_collect.company_name) + "</span> has been approved by <span class='text_primary'>" + ucfirst(approved_by) + "[" + approved_by_email + "]</span>.",
                    message_adv: "",
                    read: 0,
                  }
                  // END INSERT DATA INTO NOTIFICATIONS
                  await addNotificationsData(notificationData);


                  // Send Mail to Admin if status approved
                  const admin_mail = process.env.ADMIN_EMAILS.split(",");
                  const emailTemplateAdmin = fs.readFileSync(path.join("templates/advertiser_approved_admin.handlebars"), "utf-8");
                  const templateAdmin = handlebars.compile(emailTemplateAdmin);
                  const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    approved_by: ucfirst(approved_by),
                    approved_by_email: approved_by_email,
                    adv_name: ucfirst(adv_collect.company_name),
                    url: process.env.APPLABS_URL + 'all_advertiser',
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
                    subject: 'Applabs Alert - Advertiser ' + adv_collect.company_name.toUpperCase() + ' has been Approved',
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
              } else {
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
        }).catch((error) => {
          console.log('TYR');
          console.log(error);
          const reMsg = { "status": false, "message": error };
          res.status(400).send(reMsg);
          return;
        })
      } else {
        // if advertiser not conatain tid
        Users.findById(adv_id).sort({ _id: -1 }).exec().then((user_data) => {

          if (user_data && user_data.status !== status) {

            const advEmail = shortid.generate() + "@applabs.ai";
            const advPostData = {
              name: process.env.AL_PREFIX + "-" + user_data.company_name,
              email: advEmail,
              company: process.env.AL_PREFIX + "-" + user_data.company_name,
              password: "12345678",
              status: "active"
            };

            // create advertiser on trackier
            const axios_header = {
              headers: {
                'x-api-key': process.env.API_KEY,
                'Content-Type': 'application/json'
              }
            };

            axios.post(process.env.API_BASE_URL + "advertisers", advPostData, axios_header).then((adv_create_res) => {
              if (typeof adv_create_res.data.success !== 'undefined' && adv_create_res.data.success == true) {

                const advertiser = new AdvertiserUpdate({
                  name: user_data.name,
                  email: user_data.email,
                  organization: user_data.company_name,
                  tid: adv_create_res.data.advertiser.id,
                  email_preferences: true
                });
                // Save advertiser in user collection
                advertiser.save(advertiser).then(DBdata => {
                  if (DBdata) {

                    // Update status on local DB
                    const advUserUpdateData = {
                      status: status,
                      tid: adv_create_res.data.advertiser.id
                    }
                    Users.findOneAndUpdate({ email: user_data.email }, advUserUpdateData, { new: true }).exec().then(async (user_adv_update) => {
                      if (user_adv_update) {

                        // INSERT DATA INTO NOTIFICATIONS
                        const notificationData = {
                          advertiser_id: parseInt(adv_create_res.data.advertiser.id),
                          advertiser_name: ucfirst(user_data.name),
                          company_name: ucfirst(user_data.company_name),
                          offer_id: 0,
                          offer_name: "",
                          category: "Advertiser",

                          subject_adv: 'Your Applabs Account has been Approved',
                          message_adv: "Welcome aboard! Your Applabs account has been approved and created.",

                          subject_sa: 'Advertiser ' + user_data.company_name.toUpperCase() + ' has been Approved',
                          message_sa: "An Advertiser <span class='text_primary'> " + ucfirst(user_data.company_name) + "</span> has been approved by <span class='text_primary'>" + ucfirst(approved_by) + "[" + approved_by_email + "]</span>.",

                          read: 0,
                        }
                        // END INSERT DATA INTO NOTIFICATIONS
                        await addNotificationsData(notificationData);

                        // send Mail to user
                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                        const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/advertiser_approved.handlebars"), "utf-8");
                        const templateAdv = handlebars.compile(emailAdvertiserTemplate);
                        const messageBodyAdv = (templateAdv({
                          todayDate: dateprint(),
                          name: ucfirst(user_data.name),
                          adv_name: ucfirst(user_data.company_name),
                          url: process.env.APPLABS_URL + 'signin',
                          base_url: process.env.APPLABS_URL
                        }))
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const msg_adv = {
                          to: [user_data.email],
                          from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                          },
                          bcc: bcc_mail,
                          subject: 'Your Applabs Account has been Approved',
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

                        // Send Mail to Admin if status approved
                        const admin_mail = process.env.ADMIN_EMAILS.split(",");
                        const emailTemplateAdmin = fs.readFileSync(path.join("templates/advertiser_approved_admin.handlebars"), "utf-8");
                        const templateAdmin = handlebars.compile(emailTemplateAdmin);
                        const messageBodyAdmin = (templateAdmin({
                          todayDate: dateprint(),
                          approved_by: ucfirst(approved_by),
                          approved_by_email: approved_by_email,
                          adv_name: ucfirst(user_data.company_name),
                          url: process.env.APPLABS_URL + 'all_advertiser',
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
                          subject: 'Applabs Alert - Advertiser ' + user_data.company_name.toUpperCase() + ' has been Approved',
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
                        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                        res.status(200).send(resMsg);
                        return;
                      }
                    }).catch((error) => {
                      console.log('ABC');
                      console.log(error);
                      const reMsg = { "status": false, "message": error };
                      res.status(400).send(reMsg);
                      return;
                    })
                  } else {
                    const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                    res.status(200).send(resMsg);
                    return;
                  }
                }).catch(err => {
                  res.status(500).send({ message: err.message || "Errors detected, please try again." });
                  return;
                });
              } else {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
              }
            }).catch((error) => {
              console.log('DFG');
              console.log(error);
              const reMsg = { "status": false, "message": error };
              res.status(400).send(reMsg);
            });

          }
        }).catch(error => {
          console.log('LPK');
          console.log(error);
          const response = { 'success': false, 'error': error };
          res.status(400).send(response);
          return;
        });
      }
    }
    const response = { 'success': true, 'message': 'Status successfully updated.' };
    res.status(200).send(response);
    return;
  } catch (error) {
    console.log('LAST');
    console.log(error);
    const response = { "status": false, "message": error };
    res.status(400).send(response);
    return;
  }

}


// Update a Advertiser
exports.updateAdvertiser = async (req, res) => {

  const paramSchema = { 1: 'profile_pic', 2: 'advertiser_name', 3: 'organization', 4: 'website', 5: 'email', 6: 'mobile', 7: 'im_id', 8: 'address', 9: 'state', 10: 'country', 11: 'zip', 12: 'email_preferences', 13: 'profile_pic_name' };
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

  const { profile_pic_name, profile_pic, advertiser_name, organization, website, email, mobile, im_id, address, state, country, zip, email_preferences, assigned_to, billing_detail } = req.body;
  // Validate request
  if (!profile_pic_name || !advertiser_name || !organization || !website || !email || !mobile || !im_id || !address || !state || !country || !zip) {
    var requestVal = "";
    if (!profile_pic_name) {
      var requestVal = "profile_pic_name";
    } else if (!advertiser_name) {
      var requestVal = "advertiser_name";
    } else if (!organization) {
      var requestVal = "organization";
    } else if (!website) {
      var requestVal = "website";
    } else if (!email) {
      var requestVal = "email";
    } else if (!mobile) {
      var requestVal = "mobile";
    } else if (!im_id) {
      var requestVal = "im_id";
    } else if (!address) {
      var requestVal = "address";
    } else if (!state) {
      var requestVal = "state";
    } else if (!country) {
      var requestVal = "country";
    } else if (!zip) {
      var requestVal = "zip";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (profile_pic && profile_pic_name) {


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
    website: website,
    mobile: mobile,
    im_id: im_id,
    address: address,
    state: state,
    country: country,
    zip: zip,
    email_preferences: email_preferences,
    billing_detail: billing_detail,
    assigned_to: assigned_to
  }

  const _id = req.params.id;
  AdvertiserUpdate.findByIdAndUpdate(_id, advUpdateData, { new: true }).exec().then((AdvertiserData) => {
    if (AdvertiserData) {
      const response = { 'success': true, 'message': 'Advertiser updated successfully', 'results': AdvertiserData };
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

// Get current advertiser details by adv id mesn tid
exports.getAdvertiserDetailsByAdvId = (req, res) => {
  const id = req.params.id;
  if (isNumeric(id)) {
    AdvertiserUpdate.findOne({ tid: id }).sort({ _id: -1 }).exec().then((advBalRes) => {
      if (advBalRes) {
        const response = { 'success': true, 'results': advBalRes };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': false, 'results': 'No records found!' };
        res.status(200).send(response);
        return;
      }
    }).catch(error => {
      const response = { 'success': false, 'error': error };
      res.status(400).send(response);
      return;
    });

  } else {

    AdvertiserUpdate.findById(id).sort({ _id: -1 }).exec().then((advBalRes) => {
      if (advBalRes) {
        const response = { 'success': true, 'results': advBalRes };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': false, 'results': 'No records found!' };
        res.status(200).send(response);
        return;
      }
    }).catch(error => {
      const response = { 'success': false, 'error': error };
      res.status(400).send(response);
      return;
    });
  }




};


// Get Advertiser Master Data
exports.getAdvertiserMasterData = (req, res) => {
  var filter_Datas = { '$match': { '$and': [{ status: true }, { user_type: "advertiser" }] } };
  Users.aggregate([
    filter_Datas,
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
        'advertiser.balance': '$Advertiser.balance',
      }
    }, {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort({ company_name: 1 }).exec().then((advRes) => {
    if (advRes) {
      var advDataArr = [];
      for (let i = 0; i < advRes.length; i++) {
        let adv = advRes[i];
        advDataArr.push({
          "tid": adv.tid,
          "company_name": ucwords(adv.company_name),
          "balance": parseInt(adv.advertiser.balance)
        });
      }
      const response = { 'success': true, 'results': advDataArr };
      res.status(200).send(response);
      return;
    } else {
      const response = { 'success': false, 'results': 'No records found!' };
      res.status(200).send(response);
      return;
    }
  }).catch(error => {
    const response = { 'success': false, 'error': error };
    res.status(400).send(response);
    return;
  });
};



// check offer name exist
exports.checkEmailorAdvertiserExist = async (req, res) => {
  const { email, company_name } = req.body;

  if (!email) {
    Users.findOne({ company_name: company_name.toLowerCase() }).exec().then((offerName) => {
      if (offerName) {
        const response = { 'success': true, 'results': { 'advertiserNameExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'advertiserNameExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  } else {
    Users.findOne({ email: email.toLowerCase() }).exec().then((emailRes) => {
      if (emailRes) {
        const response = { 'success': true, 'results': { 'emailExist': true } };
        res.status(200).send(response);
        return;
      } else {
        const response = { 'success': true, 'results': { 'emailExist': false } };
        res.status(200).send(response);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error };
      res.status(400).send(reMsg);
    });
  }
}