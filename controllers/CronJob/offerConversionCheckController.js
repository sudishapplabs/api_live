var { Offer } = require("../../models/offerModel");
const { getAllOffersByUpcommingDates, getAdertiseDetailsByAdvId, getAllCreativeByUpcommingDate, getAllCreativeByUpcommingDates, addNotificationsData } = require("../../common/common");
const { padTo2Digits, dateprint, getCreativeLists } = require("../../common/helper");
const { URL, parse } = require('url');
const querystring = require("querystring");
const axios = require('axios');


const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");


exports.getOfferConversionData = async (req, res) => {

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const offerData = await getAllOffersByUpcommingDates();

  if (Array.isArray(offerData) && offerData.length > 0) {
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      // Send Mail to User
      const advName = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

      const dataArr = { "status": "paused" }
      // UPDATE DB Offer status
      // await Offer.updateOne({ trackier_camp_id: offDt.trackier_camp_id }, dataArr, { new: true }).exec().then((recordRes) => {
      //   console.log('Offer status Update Request');
      //   if (!recordRes) {
      //     console.log('Offer status  Update Response');
      //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      //     res.status(200).send(resMsg);
      //     return;
      //   }
      // }).catch((error) => {
      //   const reMsg = { "status": false, "message": error.message };
      //   res.status(400).send(reMsg);
      // });


      // UPDATE PAUSED STATUS ON TRACKIER             
      // const campaignStatus = { "status": paused };
      // console.log('Campaign status paused on trackier Request');
      // await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignStatus, axios_header).then((resStatus) => {
      //   if (typeof resStatus.data.success !== 'undefined' && resStatus.data.success == true) {
      //     console.log('Campaign status paused on trackier Response');
      //   } else {
      //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      //     res.status(200).send(resMsg);
      //     return;
      //   }
      // }).catch(err => {
      //   console.log(err);
      //   const errMsg = { "success": false, "errors": err.response.data.errors };
      //   res.status(400).send(errMsg);
      //   return;
      // });

      // INSERT DATA INTO NOTIFICATIONS
      const notificationData = {
        advertiser_id: parseInt(offDt.trackier_adv_id),
        advertiser_name: ucfirst(advName.advertiserName),
        company_name: ucfirst(advName.advName),
        offer_id: offDt.trackier_camp_id,
        offer_name: ucfirst(offDt.offer_name),
        category: "Campaign",

        subject_adv: 'Applabs Alert - Your offer ' + ucfirst(offDt.offer_name) + ' is Paused',
        message_adv: "During an automated content screening the system has found a few violations of our Terms & Conditions. As a preventive measure your Offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> is paused.",

        subject_sa: 'Applabs Alert - Offer ' + ucfirst(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Paused',
        message_sa: "Account <span class='text_primary'> " + ucfirst(advName.advName) + "</span> offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has been paused during the screening process.",

        read: 0,
      }
      // END INSERT DATA INTO NOTIFICATIONS
      await addNotificationsData(notificationData);

      if (advName.email_preferences == true) {
        // Send Mail to Admin if status inactive/suspended
        const bcc_mail = process.env.BCC_EMAILS.split(",");
        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_conversions_check.handlebars"), "utf-8");

        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
        const messageBodyAdvetiser = (templateAdvertiser({
          todayDate: dateprint(),
          adv_id: offDt.trackier_adv_id,
          adv_name: ucwords(advName.advName),
          advertiserName: ucwords(advName.advertiserName),
          offer_id: offDt.trackier_camp_id,
          offer_name: offDt.offer_name,
          url: process.env.APPLABS_URL + 'CampaignListPage',
          base_url: process.env.APPLABS_URL
        }))
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msgAdvertiser = {
          // to: advName.email,
          to: 'sudish@applabs.ai',
          from: {
            name: process.env.MAIL_FROM_NAME,
            email: process.env.MAIL_FROM_EMAIL,
          },
          bcc: bcc_mail,
          subject: 'Applabs Alert - Your offer ' + ucfirst(offDt.offer_name) + ' is Paused',
          html: messageBodyAdvetiser
        };
        //ES6
        sgMail.send(msgAdvertiser).then(() => { }, error => {
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

      // Send Mail to Admin
      const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
      const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_conversions_check_admin.handlebars"), "utf-8");
      const templateAdmin = handlebars.compile(emailTemplateAdmin);
      const messageBodyAdmin = (templateAdmin({
        todayDate: dateprint(),
        adv_id: offDt.trackier_adv_id,
        adv_name: ucwords(advName.advName),
        advertiserName: ucwords(advName.advertiserName),
        offer_id: offDt.trackier_camp_id,
        offer_name: offDt.offer_name,
        url: process.env.APPLABS_URL + 'CampaignListPage',
        base_url: process.env.APPLABS_URL
      }))
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msgAdmin = {
        //to: admin_mail,
        to: "sudish@applabs.ai",
        from: {
          name: process.env.MAIL_FROM_NAME,
          email: process.env.MAIL_FROM_EMAIL,
        },
        //bcc: bcc_mail,
        subject: 'Applabs Alert - Offer ' + ucfirst(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Paused',
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
        console.error(response);
      });
      // End Send Mail to Admin

      // const dataArr = { expired: "Yes" }
      // // UPDATE DB CREATIVE EXPIRED
      // await Offer.findOneAndUpdate({ _id: crDt._id }, dataArr, { new: true }).exec().then((recordRes) => {
      //   console.log('Creative expired Update Request');
      //   if (!recordRes) {
      //     console.log('Creative expired Update Response');
      //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      //     res.status(200).send(resMsg);
      //     return;
      //   }
      // }).catch((error) => {
      //   const reMsg = { "status": false, "message": error.message };
      //   res.status(400).send(reMsg);
      // });
    }
    const response = { 'success': true, 'message': 'Checked 500 clicks but no conversion campaign paused mail sent' };
    res.status(200).send(response);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}