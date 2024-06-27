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


exports.getAllOffersDailyLowBalance = async (req, res) => {

  const offerData = await getAllOffersByStatus();

  if (Array.isArray(offerData) && offerData.length > 0) {

    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      let dailyBalance = offDt.daily_budget;
      let todaySpent = offDt.today_spent;

      let percentage = Math.round(parseFloat(todaySpent) / parseInt(dailyBalance) * 100);
      if (percentage > 90) {
        let balance = (parseInt(dailyBalance) - parseFloat(todaySpent));
        let avBalance = Math.round(balance * 100) / 100;
        const advDt = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

        if (offDt.multi == false) {

          // INSERT DATA INTO NOTIFICATIONS
          const notificationData = {
            advertiser_id: parseInt(offDt.trackier_adv_id),
            advertiser_name: ucfirst(advDt.advertiserName),
            company_name: ucfirst(advDt.advName),
            offer_id: offDt.trackier_camp_id,
            offer_name: ucfirst(offDt.offer_name),
            category: "Campaign",

            subject_adv: 'Applabs Alert - Offer ' + offDt.offer_name + ' Limit Reached',
            message_adv: "Your Offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has reached its current daily cap limit. For an uninterrupted delivery please sign in to your account and review the offer.",

            subject_sa: 'Applabs Alert - Offer ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Daily Limit Reached',
            message_sa: "Account <span class='text_primary'> " + ucfirst(advName.advName) + "</span> offer <span class='text_primary'> " + ucfirst(offDt.offer_name) + "[" + offDt.trackier_camp_id + "]</span> has reached its current daily cap limit and the current balance is USD <span class='text_primary'> " + avBalance + "</span>",

            read: 0,
          }
          // END INSERT DATA INTO NOTIFICATIONS
          await addNotificationsData(notificationData);

          if (advDt.email_preferences == true) {

            // send Mail to user
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/offer_daily_limit_reach.handlebars"), "utf-8");
            const templateAdv = handlebars.compile(emailAdvertiserTemplate);
            const messageBodyAdv = (templateAdv({
              todayDate: dateprint(),
              balance: avBalance,
              adv_id: offDt.trackier_adv_id,
              offer_id: offDt.trackier_camp_id,
              offer_name: offDt.offer_name,
              adv_name: advDt.advName,
              advertiserName: ucwords(advDt.advertiserName),
              url: process.env.APPLABS_URL + 'view_offer',
              base_url: process.env.APPLABS_URL
            }))
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg_adv = {
              //to: [user_data.email],
              to: ["sudish@applabs.ai"],
              from: {
                name: process.env.MAIL_FROM_NAME,
                email: process.env.MAIL_FROM_EMAIL,
              },
              bcc: bcc_mail,
              subject: 'Applabs Alert - Offer ' + offDt.offer_name + ' Limit Reached',
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
          const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_daily_limit_reach_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            balance: avBalance,
            adv_id: offDt.trackier_adv_id,
            offer_id: offDt.trackier_camp_id,
            offer_name: offDt.offer_name,
            adv_name: advDt.advName,
            advertiserName: ucwords(advDt.advertiserName),
            url: process.env.APPLABS_URL + 'view_offer',
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
            bcc: bcc_mail,
            subject: 'Applabs Alert - Offer ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Daily Limit Reached',
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

          const dataTotArr = { multi: true }
          // UPDATE DB TOTAL SPENT
          // await Offer.updateOne({ trackier_camp_id: offDt.trackier_camp_id }, dataTotArr, { new: true }).exec().then((recRes) => {
          //   console.log('multi Update Request');
          //   if (!recRes) {
          //     console.log('multi Update Response');
          //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
          //     res.status(200).send(resMsg);
          //     return;
          //   }
          // }).catch((error) => {
          //   const reMsg = { "status": false, "message": error.message };
          //   res.status(400).send(reMsg);
          // });

        }
      }
    }

    const response = { 'success': true, 'message': 'All offer daily cap limit reached mail sent' };
    res.status(200).send(response);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}