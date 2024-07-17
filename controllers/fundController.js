const paypal = require('paypal-rest-sdk');
const Fund = require("../models/fundModel");
const { getAdvertiserBalByAdvId, addNotificationsData } = require("../common/common");
const { dateprint, isNumeric } = require('../common/helper');
const Advertiser = require("../models/advertiserModel");

var ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');

const { PAYPAL_MODE, PAYPAL_CLIENT_KEY, PAYPAL_SECRET_KEY } = process.env;


// sb-imivl489782@personal.example.com
// Z)Tm5vWA

// URL: http://localhost:7000/api/fund/add?apiKey=62c6ac1406beddc3835cdf4cf1362c6ac1406c16

paypal.configure({
  'mode': PAYPAL_MODE,
  'client_id': PAYPAL_CLIENT_KEY,
  'client_secret': PAYPAL_SECRET_KEY
});

exports.renderBuyPage = async (req, res) => {
  try {
    res.render('index');
  } catch (error) {
    const reMsg = { "status": false, "message": error.message };
    res.status(400).send(reMsg);
    return;
  }

}

exports.addFund = async (req, res) => {

  //console.log(req.body);

  // check boy key
  const paramSchema = { 1: 'tid', 2: 'email', 3: 'amount', 4: 'comment', 5: 'description', 6: 'payment_id', 7: 'paypal_payment_id', 8: 'action', 9: 'payment_status', 10: 'mode' };

  var new_array = [];
  for (const key in paramSchema) {
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

  const { tid, email, amount, comment, description, payment_id, paypal_payment_id, action, payment_status, mode, added_by_name, added_by_email } = req.body;
  // Validate request
  if (!tid || !email || !amount || !action || !mode || !added_by_name || !added_by_email) {
    var requestVal = "";
    if (!tid) {
      var requestVal = "tid";
    } else if (!email) {
      var requestVal = "email";
    } else if (!amount) {
      var requestVal = "amount";
    } else if (!action) {
      var requestVal = "action";
    } else if (!mode) {
      var requestVal = "mode";
    }
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  try {
    const create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": "http://43.204.202.161:5003/v2/fund/success?tid=" + tid + "&amount=" + amount + "&added_by_name=" + encodeURI(added_by_name) + "&added_by_email=" + added_by_email,
        "cancel_url": "http://43.204.202.161:5003/v2/fund/cancel?tid=" + tid + "&amount=" + amount + "&added_by_name=" + encodeURI(added_by_name) + "&added_by_email=" + added_by_email
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": "Item 1",
            "price": amount,
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
          "currency": "USD",
          "total": amount
        }
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        const reMsg = { "status": false, "message": error };
        res.status(400).send(reMsg);
        return;
      } else {
        const fund = new Fund({
          tid: tid,
          email: email,
          amount: parseFloat(amount),
          comment: comment,
          description: description,
          payment_id: payment_id,
          paypal_payment_id: payment.id,
          action: action,
          payment_status: "pending",
          mode: mode
        });

        // Save fund in funds collection
        fund.save(fund).then(DBdata => {
          if (DBdata) {

          } else {
            const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
            res.status(200).send(resMsg);
            return;
          }

        }).catch(err => {
          res.status(500).send({ message: err.message || "Errors detected, please try again." });
          return;
        });

        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            //res.redirect(payment.links[i].href);
            res.json({ forwardLink: payment.links[i].href });
          }
        }
      }
    });
  } catch (error) {
    const reMsg = { "status": false, "message": error.message };
    res.status(400).send(reMsg);
    return;
  }
}

exports.successPage = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const tid = req.query.tid;
    const amount = req.query.amount;
    const added_by_name = decodeURI(req.query.added_by_name);
    const added_by_email = req.query.added_by_email;

    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": amount
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
        //console.log(error.response);
        const reMsg = { "status": false, "message": error.response };
        res.status(400).send(reMsg);
        return;
      } else {


        Fund.findOneAndUpdate({ tid: parseInt(tid), paypal_payment_id: paymentId }, { payment_status: "success" }, { new: true }).exec().then(async (updateFund) => {
          if (updateFund) {

            const currBalance = await getAdvertiserBalByAdvId(parseInt(tid));
            if (currBalance) {
              var curr_bal = parseFloat(currBalance) + parseFloat(amount);
            } else {
              var curr_bal = parseFloat(amount);
            }

            Advertiser.findOneAndUpdate({ tid: parseInt(tid) }, { balance: parseFloat(curr_bal) }, { new: true }).exec().then(async (updateBalance) => {

              if (updateBalance) {

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                  advertiser_id: parseInt(tid),
                  advertiser_name: ucfirst(updateBalance.name),
                  company_name: ucfirst(updateBalance.organization),
                  offer_id: 0,
                  offer_name: "",
                  category: "Fund",

                  subject_adv: 'Successful Addition of Funds',
                  message_adv: "Your account   <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span>  has been successfully credited with funds and the total balance is <span class='text_primary'> " + parseFloat(curr_bal) + "</span>",

                  subject_sa: 'Funds Added',
                  message_sa: "USD <span class='text_primary'> " + parseFloat(amount) + "</span> Funds have been added to <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span> by " + added_by_name + "[" + added_by_email + "] </span> and the total balance is USD. <span class='text_primary'> " + parseFloat(curr_bal) + "</span>",

                  read: 0,
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                // Check mail preference is on or not
                const bcc_mail = process.env.BCC_EMAILS.split(",");
                if (updateBalance.email_preferences == true) {

                  ///////////////// Send Mail to User /////////////////
                  const emailUserTemplate = fs.readFileSync(path.join("templates/funds_added.handlebars"), "utf-8");
                  const templateUser = handlebars.compile(emailUserTemplate);
                  const messageBodyUser = (templateUser({
                    todayDate: dateprint(),
                    amt: parseFloat(amount),
                    balance: parseFloat(curr_bal),
                    added_by_name: added_by_name,
                    added_by_email: added_by_email,
                    adv_name: updateBalance.organization.toUpperCase(),
                    adv_id: tid,
                    name: ucwords(updateBalance.name),
                    url: process.env.APPLABS_URL,
                    base_url: process.env.APPLABS_URL
                  }))
                  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                  const msg_user = {
                    to: [updateBalance.email],
                    from: {
                      name: process.env.MAIL_FROM_NAME,
                      email: process.env.MAIL_FROM_EMAIL,
                    },
                    bcc: bcc_mail,
                    subject: 'Applabs Alert - Successful Addition of Funds',
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
                }

                ///////////////// Send Mail to Admin /////////////////
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/funds_added_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                  todayDate: dateprint(),
                  amt: parseFloat(amount),
                  balance: parseFloat(curr_bal),
                  added_by_name: added_by_name,
                  added_by_email: added_by_email,
                  adv_name: updateBalance.organization.toUpperCase(),
                  adv_id: tid,
                  name: ucwords(updateBalance.name),
                  url: process.env.APPLABS_URL + '/fundList/' + tid,
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
                  subject: 'Applabs Alert - Funds Added',
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
                const resMsg = { 'success': true, 'message': 'Fund Updated!' };
                //res.status(200).send(response);
                //return;
                // console.log(JSON.stringify(payment));
                // res.render('success');


                res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
              } else {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                //res.status(200).send(resMsg);
                //return;
                res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
              }
            }).catch((error) => {
              const resMsg = { "status": false, "message": error.message };
              /*res.status(400).send(resMsg);
              return;*/
              res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
            });
          } else {
            const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
            /*res.status(200).send(resMsg);
            return;*/
            res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
          }

        }).catch((error) => {
          const resMsg = { "status": false, "message": error.message };
          /*res.status(400).send(resMsg);
          return;*/
          res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
        });
      }
    });

  } catch (error) {
    console.log(error);
    const reMsg = { "status": false, "message": error.message };
    res.status(400).send(reMsg);
    return;
  }
}

exports.cancelPage = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const tid = req.query.tid;
    const amount = req.query.amount;
    const added_by_name = decodeURI(req.query.added_by_name);
    const added_by_email = req.query.added_by_email;

    Fund.findOneAndUpdate({ tid: parseInt(tid), paypal_payment_id: paymentId }, { payment_status: "failed" }, { new: true }).exec().then(async (updateFund) => {
      if (updateFund) {
        const resMsg = { 'success': true, 'message': 'Payment failed' };
        //res.status(200).send(resMsg);
        //return;
        res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
      } else {
        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
        //res.status(200).send(resMsg);
        //return;
        res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
      }
    }).catch((error) => {
      const resMsg = { "status": false, "message": error.message };
      //res.status(400).send(resMsg);
      //return;
      res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
    });
    // res.render('cancel');
  } catch (error) {
    console.log(error);
    const resMsg = { "status": false, "message": error.message };
    //res.status(400).send(resMsg);
    //return;
    res.status(200).redirect("https://beta.applabs.ai/FundList?data=" + encodeURIComponent(JSON.stringify(resMsg)));
  }
}

// module.exports = {
//   renderBuyPage,
//   payProduct,
//   successPage,
//   cancelPage
// }



exports.funds = async (req, res) => {

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  // check body key
  const paramSchema = { 1: 'advId', 2: 'mode', 3: 'date_from', 4: 'date_to', 5: 'status' };
  var new_array = [];
  for (const key in paramSchema) {
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

  const advertiserId = req.query.advertiserId;
  const { searchQuery, sorttype, sortdirection, advId, mode, date_from, date_to, status } = req.body;


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

  if (advertiserId) {
    var filters = {};
    filters['tid'] = parseInt(advertiserId);

    if (typeof mode !== "undefined" && mode !== "") {
      filters['mode'] = mode;
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      if (isNumeric(searchQuery)) {
        Object.assign(filters, {
          $expr: {
            "$or": [
              {
                $regexMatch: {
                  input: { $toString: "$payment_id" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$amount" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$tid" },
                  regex: `${parseInt(searchQuery)}`
                }
              }]
          }
        });
      } else {
        filters['$text'] = { '$search': searchQuery };
      }
    }
    if (typeof status !== "undefined" && status !== "") {
      filters['payment_status'] = status;
    }
    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {


      const currentDate10Start = new Date(date_from + "T01:59:59.053Z");
      const currentDate10End = new Date(date_to + "T23:59:59.053Z");

      var date_from_10_timestamp = parseInt(currentDate10Start.getTime() / 1000);
      var date_to_10_timestamp = parseInt(currentDate10End.getTime() / 1000);



      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");


      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();


      Object.assign(filters, {
        $or: [{ 'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp } }, { 'created_on': { '$gte': date_from_10_timestamp, '$lte': date_to_10_timestamp } }]
      });
    }



    var filter = {};
    filter['tid'] = parseInt(advertiserId);

    if (typeof mode !== "undefined" && mode !== "") {
      filter['mode'] = mode;
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      if (isNumeric(searchQuery)) {
        Object.assign(filter, {
          $expr: {
            "$or": [
              {
                $regexMatch: {
                  input: { $toString: "$payment_id" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$amount" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$tid" },
                  regex: `${parseInt(searchQuery)}`
                }
              }]
          }
        });
      } else {
        filter['$text'] = { '$search': searchQuery };
      }
    }
    if (typeof status !== "undefined" && status !== "") {
      filter['payment_status'] = status;
    }
    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {


      const currentDate10Start = new Date(date_from + "T01:59:59.053Z");
      const currentDate10End = new Date(date_to + "T23:59:59.053Z");

      var date_from_10_timestamp = parseInt(currentDate10Start.getTime() / 1000);
      var date_to_10_timestamp = parseInt(currentDate10End.getTime() / 1000);



      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");


      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();


      Object.assign(filter, {
        $or: [{ 'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp } }, { 'created_on': { '$gte': date_from_10_timestamp, '$lte': date_to_10_timestamp } }]
      });
    }

  } else {

    var filters = {};
    if (typeof advId !== "undefined" && advId !== "") {
      filters['tid'] = parseInt(advId);
    }

    if (typeof mode !== "undefined" && mode !== "") {
      filters['mode'] = mode;
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      if (isNumeric(searchQuery)) {
        Object.assign(filters, {
          $expr: {
            "$or": [
              {
                $regexMatch: {
                  input: { $toString: "$payment_id" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$amount" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$tid" },
                  regex: `${parseInt(searchQuery)}`
                }
              }]
          }
        });
      } else {
        filters['$text'] = { '$search': searchQuery };
      }
    }
    if (typeof status !== "undefined" && status !== "") {
      filters['payment_status'] = status;
    }
    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {


      const currentDate10Start = new Date(date_from + "T01:59:59.053Z");
      const currentDate10End = new Date(date_to + "T23:59:59.053Z");

      var date_from_10_timestamp = parseInt(currentDate10Start.getTime() / 1000);
      var date_to_10_timestamp = parseInt(currentDate10End.getTime() / 1000);



      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");


      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();


      Object.assign(filters, {
        $or: [{ 'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp } }, { 'created_on': { '$gte': date_from_10_timestamp, '$lte': date_to_10_timestamp } }]
      });
    }

    /////////////////////////// FILTER ///////////////////////////
    var filter = {};
    if (typeof advId !== "undefined" && advId !== "") {
      filter['tid'] = parseInt(advId);
    }

    if (typeof mode !== "undefined" && mode !== "") {
      filter['mode'] = mode;
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      if (isNumeric(searchQuery)) {
        Object.assign(filter, {
          $expr: {
            "$or": [
              {
                $regexMatch: {
                  input: { $toString: "$payment_id" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$amount" },
                  regex: `${parseInt(searchQuery)}`
                }
              },
              {
                $regexMatch: {
                  input: { $toString: "$tid" },
                  regex: `${parseInt(searchQuery)}`
                }
              }]
          }
        });
      } else {
        filter['$text'] = { '$search': searchQuery };
      }
    }
    if (typeof status !== "undefined" && status !== "") {
      filter['payment_status'] = status;
    }
    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {


      const currentDate10Start = new Date(date_from + "T01:59:59.053Z");
      const currentDate10End = new Date(date_to + "T23:59:59.053Z");

      var date_from_10_timestamp = parseInt(currentDate10Start.getTime() / 1000);
      var date_to_10_timestamp = parseInt(currentDate10End.getTime() / 1000);



      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");


      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();


      Object.assign(filter, {
        $or: [{ 'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp } }, { 'created_on': { '$gte': date_from_10_timestamp, '$lte': date_to_10_timestamp } }]
      });
    }
  }

  //console.log(JSON.stringify(filter))
  //console.log(JSON.stringify(filters))


  let result = await Fund.aggregate([
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
        'advertiser.profile_pic': '$Advertiser.profile_pic',
        'advertiser.organization': '$Advertiser.organization'
      }
    }, {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort(sortObject).exec();
  var totalFund = parseInt(result.length);

  await Fund.aggregate([
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
        'advertiser.profile_pic': '$Advertiser.profile_pic',
        'advertiser.organization': '$Advertiser.organization'
      }
    }, {
      $project: {
        'Advertiser': 0
      }
    }
  ]).sort(sortObject).skip(skipIndex).limit(limit).exec().then((funds) => {
    if (funds) {
      const response = { 'success': true, 'totoalRecords': totalFund, 'results': funds };
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
}




exports.addAdminFund = async (req, res) => {

  // check boy key
  const paramSchema = { 1: 'tid', 2: 'email', 3: 'amount', 4: 'comment', 5: 'description', 6: 'payment_id', 7: 'paypal_payment_id', 8: 'action', 9: 'payment_status', 10: 'mode' };

  var new_array = [];
  for (const key in paramSchema) {
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

  const { tid, email, amount, comment, description, payment_id, paypal_payment_id, action, payment_status, mode, added_by_name, added_by_email } = req.body;
  // Validate request
  if (!tid || !email || !amount || !payment_id || !action || !payment_status || !mode || !added_by_name || !added_by_email) {
    var requestVal = "";
    if (!tid) {
      var requestVal = "tid";
    } else if (!email) {
      var requestVal = "email";
    } else if (!amount) {
      var requestVal = "amount";
    } else if (!payment_id) {
      var requestVal = "payment_id";
    } else if (!action) {
      var requestVal = "action";
    } else if (!payment_status) {
      var requestVal = "payment_status";
    } else if (!mode) {
      var requestVal = "mode";
    }
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  const currBalance = await getAdvertiserBalByAdvId(tid);

  if (currBalance) {
    if (typeof action !== 'undefined' && action == 'credited') {
      var curr_bal = parseFloat(currBalance) + parseFloat(amount);
    }

    if (typeof action !== 'undefined' && action == 'debited') {
      if (typeof amount !== 'undefined' && amount > currBalance) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Refund amount cannot exceed current balance." } };
        res.status(400).send(reMsg);
        return;
      } else {
        var curr_bal = parseFloat(currBalance) - parseFloat(amount);
      }
    }
  } else {
    var curr_bal = parseFloat(amount);
  }

  const fund = new Fund({
    tid: tid,
    email: email,
    amount: parseFloat(amount),
    comment: comment,
    description: description,
    payment_id: payment_id,
    paypal_payment_id: paypal_payment_id,
    action: action,
    payment_status: payment_status,
    mode: mode
  });

  // Save fund in funds collection
  fund.save(fund).then(DBdata => {
    if (DBdata) {
      Advertiser.findOneAndUpdate({ tid: tid }, { balance: curr_bal }, { new: true }).exec().then(async (updateBalance) => {
        if (updateBalance) {

          if (typeof action !== 'undefined' && action == 'credited') {

            // INSERT DATA INTO NOTIFICATIONS
            const notificationData = {
              advertiser_id: parseInt(tid),
              advertiser_name: ucfirst(updateBalance.name),
              company_name: ucfirst(updateBalance.organization),
              offer_id: 0,
              offer_name: "",
              category: "Fund",

              subject_adv: 'Successful Addition of Funds',
              message_adv: "Your account   <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span>  has been successfully credited with funds and the total balance is <span class='text_primary'> " + parseFloat(curr_bal) + "</span>",

              subject_sa: 'Funds Added',
              message_sa: "USD <span class='text_primary'> " + parseFloat(amount) + "</span> Funds have been added to <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span> by " + added_by_name + "[" + added_by_email + "] </span> and the total balance is USD. <span class='text_primary'> " + parseFloat(curr_bal) + "</span>",

              read: 0,
            }
            // END INSERT DATA INTO NOTIFICATIONS
            await addNotificationsData(notificationData);


            // Check mail preference is on or not
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            if (updateBalance.email_preferences == true) {

              ///////////////// Send Mail to User /////////////////
              const emailUserTemplate = fs.readFileSync(path.join("templates/funds_added.handlebars"), "utf-8");
              const templateUser = handlebars.compile(emailUserTemplate);
              const messageBodyUser = (templateUser({
                todayDate: dateprint(),
                amt: parseFloat(amount),
                balance: parseFloat(curr_bal),
                added_by_name: added_by_name,
                added_by_email: added_by_email,
                adv_name: updateBalance.organization.toUpperCase(),
                adv_id: tid,
                name: ucwords(updateBalance.name),
                url: process.env.APPLABS_URL,
                base_url: process.env.APPLABS_URL
              }))
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              const msg_user = {
                to: [updateBalance.email],
                from: {
                  name: process.env.MAIL_FROM_NAME,
                  email: process.env.MAIL_FROM_EMAIL,
                },
                bcc: bcc_mail,
                subject: 'Applabs Alert - Successful Addition of Funds',
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
            }

            ///////////////// Send Mail to Admin /////////////////
            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
            const emailTemplateAdmin = fs.readFileSync(path.join("templates/funds_added_admin.handlebars"), "utf-8");
            const templateAdmin = handlebars.compile(emailTemplateAdmin);
            const messageBodyAdmin = (templateAdmin({
              todayDate: dateprint(),
              amt: parseFloat(amount),
              balance: parseFloat(curr_bal),
              added_by_name: added_by_name,
              added_by_email: added_by_email,
              adv_name: updateBalance.organization.toUpperCase(),
              adv_id: tid,
              name: ucwords(updateBalance.name),
              url: process.env.APPLABS_URL + '/fundList/' + tid,
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
              subject: 'Applabs Alert - Funds Added',
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

          if (typeof action !== 'undefined' && action == 'debited') {

            // INSERT DATA INTO NOTIFICATIONS
            const notificationData = {
              advertiser_id: parseInt(tid),
              advertiser_name: ucfirst(updateBalance.name),
              company_name: ucfirst(updateBalance.organization),
              offer_id: 0,
              offer_name: "",
              category: "Fund",

              subject_adv: 'Account ' + ucwords(updateBalance.organization) + ' Balance Low to run Offer',
              message_adv: "Low Balance Alert! The current balance USD  <span class='text_primary'> " + parseFloat(curr_bal) + "</span>  in your Account  <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span>  is lower than the minimum funds required to run your offers.",

              subject_sa: 'Account ' + ucwords(updateBalance.organization) + ' Balance Low',
              message_sa: "USD <span class='text_primary'> " + parseFloat(amount) + "</span> Funds have been added to <span class='text_primary'> " + ucwords(updateBalance.organization) + "</span> by " + added_by_name + "[" + added_by_email + "] </span> and the total balance is USD. <span class='text_primary'> " + parseFloat(curr_bal) + "</span>",

              read: 0,
            }
            // END INSERT DATA INTO NOTIFICATIONS
            await addNotificationsData(notificationData);


            // Check mail preference is on or not
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            if (updateBalance.email_preferences == true) {

              ///////////////// Send Mail to User /////////////////
              const emailUserTemplate = fs.readFileSync(path.join("templates/fund_short.handlebars"), "utf-8");
              const templateUser = handlebars.compile(emailUserTemplate);
              const messageBodyUser = (templateUser({
                todayDate: dateprint(),
                amt: parseFloat(amount),
                balance: parseFloat(curr_bal),
                added_by_name: added_by_name,
                added_by_email: added_by_email,
                adv_name: updateBalance.organization.toUpperCase(),
                adv_id: tid,
                name: ucwords(updateBalance.name),
                url: process.env.APPLABS_URL,
                base_url: process.env.APPLABS_URL
              }))
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              const msg_user = {
                to: [updateBalance.email],
                from: {
                  name: process.env.MAIL_FROM_NAME,
                  email: process.env.MAIL_FROM_EMAIL,
                },
                bcc: bcc_mail,
                subject: 'Applabs Alert - Account ' + ucwords(updateBalance.organization) + ' Balance Low to run Offer',
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
            }

            ///////////////// Send Mail to Admin /////////////////
            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
            const emailTemplateAdmin = fs.readFileSync(path.join("templates/fund_short_admin.handlebars"), "utf-8");
            const templateAdmin = handlebars.compile(emailTemplateAdmin);
            const messageBodyAdmin = (templateAdmin({
              todayDate: dateprint(),
              amt: parseFloat(amount),
              balance: parseFloat(curr_bal),
              added_by_name: added_by_name,
              added_by_email: added_by_email,
              adv_name: updateBalance.organization.toUpperCase(),
              adv_id: tid,
              name: ucwords(updateBalance.name),
              url: process.env.APPLABS_URL + '/fundList/' + tid,
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
              subject: 'Applabs Alert - Account ' + ucwords(updateBalance.organization) + ' Balance Low',
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
          const response = { 'success': true, 'message': 'Fund Updated!' };
          res.status(200).send(response);
          return;
        } else {
          const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
          res.status(200).send(resMsg);
          return;
        }
      }).catch((error) => {
        const reMsg = { "status": false, "message": error.message };
        res.status(400).send(reMsg);
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
}