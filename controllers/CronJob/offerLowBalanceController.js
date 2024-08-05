const Offer = require("../../models/offerModel");
const { getAllOffersByTrafficStart, getAdertiseDetailsByAdvId, getAllOffersByStatus, addNotificationsData } = require("../../common/common");
const { padTo2Digits, number_format, isEmpty, dateprint } = require("../../common/helper");

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");
const { isArray } = require("util");


exports.getOffersLowBalance = async (req, res) => {
  const offerData = await getAllOffersByStatus();

  if (Array.isArray(offerData) && offerData.length > 0) {
    var dataArr = [];
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      let totalBalance = offDt.total_budget;
      let totalSpent = offDt.total_spent;

      let percentage = Math.round(parseFloat(totalSpent) / parseFloat(totalBalance) * 100);
      if (percentage > 80) {
        let balance = (parseInt(totalBalance) - parseFloat(totalSpent));
        let avBalance = Math.round(balance * 100) / 100;

        const advDt = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

        // INSERT DATA INTO NOTIFICATIONS
        const notificationData = {
          advertiser_id: parseInt(offDt.trackier_adv_id),
          advertiser_name: ucfirst(advDt.advertiserName),
          company_name: ucfirst(advDt.advName),
          offer_id: offDt.trackier_camp_id,
          offer_name: ucfirst(offDt.offer_name,),
          category: "Campaign",

          subject_adv: 'Applabs Alert - Campaign ' + offDt.offer_name + ' Limit Utilized 80%',
          message_adv: "Your Campaign <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> reached 80% of total caps. For an uninterrupted delivery please sign in to your account and review the campaign.",

          subject_sa: 'Applabs Alert - Campaign ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Balance',
          message_sa: "Campaign <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has reached to 80% of total caps. The current balance is USD <span class='text_primary'> " + avBalance + "</span>",

          read: 0,
        }
        // END INSERT DATA INTO NOTIFICATIONS
        await addNotificationsData(notificationData);


        if (advDt.email_preferences == true) {

          // send Mail to user
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/offer_low_balance.handlebars"), "utf-8");
          const templateAdv = handlebars.compile(emailAdvertiserTemplate);
          const messageBodyAdv = (templateAdv({
            todayDate: dateprint(),
            balance: avBalance,
            adv_id: offDt.trackier_adv_id,
            offer_id: offDt.trackier_camp_id,
            offer_name: offDt.offer_name,
            adv_name: advDt.advName,
            advertiserName: ucwords(advDt.advertiserName),
            url: process.env.APPLABS_URL + 'campaignList',
            base_url: process.env.APPLABS_URL
          }))
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg_adv = {
            to: [advDt.email],
            // to: ["sudish@applabs.ai"],
            from: {
              name: process.env.MAIL_FROM_NAME,
              email: process.env.MAIL_FROM_EMAIL,
            },
            bcc: bcc_mail,
            subject: 'Applabs Alert - Campaign ' + offDt.offer_name + ' Limit Utilized 80%',
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
          // EMAIlL SENT END
        }


        // Send Mail to Admin
        const admin_mail = process.env.ADMIN_EMAILS.split(",");
        const bcc_mail = process.env.BCC_EMAILS.split(",");
        const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_low_balance_admin.handlebars"), "utf-8");
        const templateAdmin = handlebars.compile(emailTemplateAdmin);
        const messageBodyAdmin = (templateAdmin({
          todayDate: dateprint(),
          balance: avBalance,
          adv_id: offDt.trackier_adv_id,
          offer_id: offDt.trackier_camp_id,
          offer_name: offDt.offer_name,
          adv_name: advDt.advName,
          advertiserName: ucwords(advDt.advertiserName),
          url: process.env.APPLABS_URL + 'campaignList',
          base_url: process.env.APPLABS_URL
        }))
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msgAdmin = {
          to: admin_mail,
          // to: "sudish@applabs.ai",
          from: {
            name: process.env.MAIL_FROM_NAME,
            email: process.env.MAIL_FROM_EMAIL,
          },
          bcc: bcc_mail,
          subject: 'Applabs Alert - Campaign ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Balance',
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
      }
    }
    const response = { 'success': true, 'message': 'Offer Low balance mail sent' };
    res.status(200).send(response);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}