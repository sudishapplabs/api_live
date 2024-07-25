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


exports.getTotalCapOffers = async (req, res) => {
  const offerData = await getAllOffersByStatus();

  if (Array.isArray(offerData) && offerData.length > 0) {
    var dataArr = [];
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      let totalBalance = offDt.total_budget;
      let totalSpent = offDt.total_spent;

      let percentage = Math.round(parseFloat(totalSpent) / parseFloat(totalBalance) * 100);
      if (percentage > 90) {
        let balance = (parseInt(totalBalance) - parseFloat(totalSpent));
        let avBalance = Math.round(balance * 100) / 100;

        if (avBalance <= 1) {
          if (offDt.status == 'active' || offDt.status == 'paused') {

            const dataTotArr = { status: 'disabled' }
            // UPDATE DB TOTAL SPENT
            await Offer.updateOne({ trackier_camp_id: offDt.trackier_camp_id }, dataTotArr, { new: true }).exec().then((recRes) => {
              console.log('Status Update Request');
              if (!recRes) {
                console.log('Status Update Response');
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
              }
            }).catch((error) => {
              const reMsg = { "status": false, "message": error.message };
              res.status(400).send(reMsg);
            });


            // STATUS DISABLED ON TRACKIER WHEN TOTAL BALANCE IS 1
            const campaignStatus = { "status": 'disabled' };
            console.log('API Update Status  on trackier Request');
            await axios.put(process.env.API_BASE_URL + "campaigns/" + offDt.trackier_camp_id, campaignStatus, axios_header).then((creativeUpload) => {
              if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                console.log('API Update Status on trackier Response');
              } else {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
              }
            }).catch(err => {
              console.log(err);
              const errMsg = { "success": false, "errors": err.response.data.errors };
              res.status(400).send(errMsg);
              return;
            });

            const advDt = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));

            // INSERT DATA INTO NOTIFICATIONS
            const notificationData = {
              advertiser_id: parseInt(offDt.trackier_adv_id),
              advertiser_name: ucfirst(advDt.advertiserName),
              company_name: ucfirst(advDt.advName),
              offer_id: offDt.trackier_camp_id,
              offer_name: ucfirst(offDt.offer_name,),
              category: "Campaign",

              subject_adv: 'Applabs Alert - New Campaign Disabled',
              message_adv: "This is to inform you that your campaign <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has been  <span class='text_primary'> disabled </span>",

              subject_sa: 'Applabs Alert - Campaign  ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Disabled',
              message_sa: "Account <span class='text_primary'> " + ucfirst(advDt.advName) + "</span> campaign <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has been <span class='text_primary'> disabled </span> By <span class='text_primary'> Admin </span>",

              read: 0,
            }
            // END INSERT DATA INTO NOTIFICATIONS
            await addNotificationsData(notificationData);

            if (advDt.email_preferences == true) {

              // send Mail to user
              const bcc_mail = process.env.BCC_EMAILS.split(",");
              const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/offer_status_disabled.handlebars"), "utf-8");
              const templateAdv = handlebars.compile(emailAdvertiserTemplate);
              const messageBodyAdv = (templateAdv({
                todayDate: dateprint(),
                status: 'disabled',
                adv_id: offDt.trackier_adv_id,
                offer_id: offDt.trackier_camp_id,
                offer_name: offDt.offer_name,
                adv_name: advDt.advName,
                advertiserName: ucwords(advDt.advertiserName),
                url: process.env.APPLABS_URL + 'CampaignList',
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
                subject: 'Applabs Alert - New Offer Disabled',
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

            //Send Mail to Admin
            const admin_mail = process.env.ADMIN_EMAILS.split(",");
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_status_disabled_admin.handlebars"), "utf-8");
            const templateAdmin = handlebars.compile(emailTemplateAdmin);
            const messageBodyAdmin = (templateAdmin({
              todayDate: dateprint(),
              status: 'disabled',
              status_by_user: 'Admin',
              adv_id: offDt.trackier_adv_id,
              offer_id: offDt.trackier_camp_id,
              offer_name: offDt.offer_name,
              adv_name: advDt.advName,
              advertiserName: ucwords(advDt.advertiserName),
              url: process.env.APPLABS_URL + 'CampaignList',
              base_url: process.env.APPLABS_URL
            }))
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msgAdmin = {
              to: admin_mail,
              //to: "sudish@applabs.ai",
              from: {
                name: process.env.MAIL_FROM_NAME,
                email: process.env.MAIL_FROM_EMAIL,
              },
              bcc: bcc_mail,
              subject: 'Applabs Alert - Campaign  ' + ucwords(offDt.offer_name) + '[' + offDt.trackier_camp_id + '] Disabled',
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
      }
    }
    const response = { 'success': true, 'message': 'Offer total cap mail sent' };
    res.status(200).send(response);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}