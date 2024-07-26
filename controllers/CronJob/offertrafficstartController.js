const Offer = require("../../models/offerModel");
const { getAllOffersByTrafficStart, getAdertiseDetailsByAdvId } = require("../../common/common");
const { padTo2Digits, dateprint } = require("../../common/helper");

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");


exports.getOfferTrafficStart = async (req, res) => {
  const offerData = await getAllOffersByTrafficStart();

  if (Array.isArray(offerData) && offerData.length > 0) {
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      await Offer.findOneAndUpdate({ trackier_camp_id: offDt.trackier_camp_id }, { traffic_start: "Yes" }, { new: true }).exec().then(async (resOffer) => {
        console.log('traffic_start Update Request');
        if (resOffer) {
          console.log('traffic_start Update Response');

          // Send Mail to User
          const advName = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

          //if (advName.email_preferences == true) {
          // Send Mail to Admin if status inactive/suspended
          const bcc_mail = process.env.BCC_EMAILS.split(",");
          var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_traffic_start.handlebars"), "utf-8");

          const date = new Date();
          const year = date.getUTCFullYear();
          const month = padTo2Digits(date.getUTCMonth() + 1);
          const day = padTo2Digits(date.getUTCDate());
          const todayYearMonth = [year, month].join('-');

          const todaywithSlashes = [year, month, day].join('-');


          const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
          const messageBodyAdvetiser = (templateAdvertiser({
            todayDate: dateprint(),
            adv_id: offDt.trackier_adv_id,
            advertiserName: ucwords(advName.advertiserName),
            offer_id: offDt.trackier_camp_id,
            offer_name: ucwords(offDt.offer_name),
            url: process.env.APPLABS_URL + "StatisticsListPage",
            base_url: process.env.APPLABS_URL
          }))
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msgAdvertiser = {
            to: advName.email,
            //to: 'sudish@applabs.ai',
            from: {
              name: process.env.MAIL_FROM_NAME,
              email: process.env.MAIL_FROM_EMAIL,
            },
            bcc: bcc_mail,
            subject: 'Applabs Alert - Campaign is live',
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
          // }

          // Send Mail to Admin
          const admin_mail = process.env.ADMIN_EMAILS.split(",");
          const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_traffic_start_admin.handlebars"), "utf-8");
          const templateAdmin = handlebars.compile(emailTemplateAdmin);
          const messageBodyAdmin = (templateAdmin({
            todayDate: dateprint(),
            adv_id: offDt.trackier_adv_id,
            advertiserName: ucwords(advName.advName),
            offer_id: offDt.trackier_camp_id,
            offer_name: ucwords(offDt.offer_name),
            url: process.env.APPLABS_URL + 'campaignList',
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
            subject: 'Applabs Alert - Campaign ' + offDt.offer_name + ' is live',
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

          const response = { 'success': true, 'message': 'Offer live successfully' };
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
      });
    }
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}