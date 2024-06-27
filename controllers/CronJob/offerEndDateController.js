var { Offer } = require("../../models/offerModel");
const { getAllOffersByUpcommingDate, getAdertiseDetailsByAdvId, addNotificationsData } = require("../../common/common");
const { padTo2Digits, dateprint } = require("../../common/helper");
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


exports.getOfferEndDate = async (req, res) => {
  const offerData = await getAllOffersByUpcommingDate();

  if (Array.isArray(offerData) && offerData.length > 0) {

    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      if (offDt.schedule_end_date && offDt.schedule_end_date !== null) {
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = padTo2Digits(date.getUTCMonth() + 1);
        const day = padTo2Digits(date.getUTCDate());
        const todaywithSlashes = [day, month, year].join('/');

        if (offDt.schedule_end_date == todaywithSlashes) {
          console.log("equal to");

          // Send Mail to User
          const advName = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

          // INSERT DATA INTO NOTIFICATIONS
          const notificationData = {
            advertiser_id: parseInt(offDt.trackier_adv_id),
            advertiser_name: ucfirst(advName.advertiserName),
            company_name: ucfirst(advName.advName),
            offer_id: offDt.trackier_camp_id,
            offer_name: ucfirst(offDt.offer_name,),
            category: "Campaign",

            subject_adv: 'Applabs Alert - Your offer ' + offDt.trackier_camp_id + ' is about to end',
            message_adv: "Today is the end date for your offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> and it will be paused. For an uninterrupted delivery please sign in to your account and review the offer.",


            subject_sa: 'Applabs Alert - Offer ' + offDt.offer_name + '[' + offDt.trackier_camp_id + '] is about to end',
            message_sa: "The offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> by the Advertiser <span class='text_primary'> " + ucfirst(advName.advName) + "</span> is about to end and will be paused today.",

            read: 0,
          }

          // END INSERT DATA INTO NOTIFICATIONS
          await addNotificationsData(notificationData);

          if (advName.email_preferences == true) {
            // Send Mail to Admin if status inactive/suspended
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_end_date.handlebars"), "utf-8");

            const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
            const messageBodyAdvetiser = (templateAdvertiser({
              todayDate: dateprint(),
              adv_id: offDt.trackier_adv_id,
              advertiserName: ucwords(advName.advName),
              offer_id: offDt.trackier_camp_id,
              offer_name: offDt.offer_name,
              url: process.env.APPLABS_URL + 'view_offer',
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
              subject: 'Applabs Alert - Your offer ' + offDt.trackier_camp_id + ' is about to end',
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
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_end_date_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            adv_id: offDt.trackier_adv_id,
            advertiserName: ucwords(advName.advName),
            offer_id: offDt.trackier_camp_id,
            offer_name: offDt.offer_name,
            url: process.env.APPLABS_URL + 'view_offer',
            base_url: process.env.APPLABS_URL
          }))
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msgAdmin = {
            to: admin_mail,
            from: {
              name: process.env.MAIL_FROM_NAME,
              email: process.env.MAIL_FROM_EMAIL,
            },
            //bcc: bcc_mail,
            subject: 'Applabs Alert - Offer ' + offDt.offer_name + '[' + offDt.trackier_camp_id + '] is about to end',
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
        }
      }
    }
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}