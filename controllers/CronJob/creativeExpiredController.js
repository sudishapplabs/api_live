var { Offer } = require("../../models/offerModel");
const Creative = require("../../models/creativeModel");
const CreativeCtrModel = require("../../models/creativectrModel");
const { getAllOffersByStatus, getAdertiseDetailsByAdvId, getAllCreativeByUpcommingDate, getAllCreativeByUpcommingDates, addNotificationsData } = require("../../common/common");
const { padTo2Digits, dateprint, getCreativeLists, getCreativeNameLists, generateRandomNumber } = require("../../common/helper");
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


exports.getCreativeEndDate = async (req, res) => {

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };


  const offerData = await getAllOffersByStatus();

  if (Array.isArray(offerData) && offerData.length > 0) {
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      const creatives = await getAllCreativeByUpcommingDate(offDt._id);

      if (Array.isArray(creatives) && creatives.length > 0) {
        for (let j = 0; j < creatives.length; j++) {
          let crDt = creatives[j];

          if (crDt.ads_end_date && crDt.ads_end_date !== null) {
            const date = new Date();
            const year = date.getUTCFullYear();
            const month = padTo2Digits(date.getUTCMonth() + 1);
            const day = padTo2Digits(date.getUTCDate());
            const todaywithSlashes = [day, month, year].join('/');

            if (crDt.ads_end_date == todaywithSlashes) {

              // Send Mail to User
              const advName = await getAdertiseDetailsByAdvId(parseInt(crDt.trackier_adv_id));


              // INSERT DATA INTO NOTIFICATIONS
              const notificationData = {
                advertiser_id: parseInt(offDt.trackier_adv_id),
                advertiser_name: ucfirst(advName.advertiserName),
                company_name: ucfirst(advName.advName),
                offer_id: offDt.trackier_camp_id,
                offer_name: ucfirst(offDt.offer_name),
                category: "Campaign",

                subject_adv: 'Applabs Alert - All ads are end',
                message_adv: "The Offer <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span> has no valid ads",

                subject_sa: 'Applabs Alert - Offer ' + offDt.offer_name + '[' + offDt.trackier_camp_id + '] has no valid ads',
                message_sa: "All Ads by offer  <span class='text_primary'> " + offDt.offer_name + "[" + offDt.trackier_camp_id + "]</span>  from the Advertiser <span class='text_primary'> " + ucfirst(advName.advName) + "</span> is end and paused.",

                read: 0,
              }
              // END INSERT DATA INTO NOTIFICATIONS
              await addNotificationsData(notificationData);


              if (advName.email_preferences == true) {
                // Send Mail to Admin if status inactive/suspended
                const bcc_mail = process.env.BCC_EMAILS.split(",");
                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/creative_end_date.handlebars"), "utf-8");

                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                const messageBodyAdvetiser = (templateAdvertiser({
                  todayDate: dateprint(),
                  adv_id: offDt.trackier_adv_id,
                  adv_name: ucwords(advName.advName),
                  advertiserName: ucwords(advName.advertiserName),
                  offer_id: offDt.trackier_camp_id,
                  offer_name: offDt.offer_name,
                  ad_name: crDt.creative,
                  url: process.env.APPLABS_URL + 'CampaignListPage',
                  base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdvertiser = {
                  to: advName.email,
                  // to: 'sudish@applabs.ai',
                  from: {
                    name: process.env.MAIL_FROM_NAME,
                    email: process.env.MAIL_FROM_EMAIL,
                  },
                  bcc: bcc_mail,
                  subject: 'Applabs Alert - All ads are end',
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
              const admin_mail = process.env.ADMIN_EMAILS.split(",");
              const emailTemplateAdmin = fs.readFileSync(path.join("templates/creative_end_date_admin.handlebars"), "utf-8");
              const templateAdmin = handlebars.compile(emailTemplateAdmin);
              const messageBodyAdmin = (templateAdmin({
                todayDate: dateprint(),
                adv_id: offDt.trackier_adv_id,
                adv_name: ucwords(advName.advName),
                advertiserName: ucwords(advName.advertiserName),
                offer_id: offDt.trackier_camp_id,
                offer_name: offDt.offer_name,
                ad_name: crDt.creative,
                url: process.env.APPLABS_URL + 'CampaignListPage',
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
                //bcc: bcc_mail,
                subject: 'Applabs Alert - Offer ' + offDt.offer_name + '[' + offDt.trackier_camp_id + '] has no valid ads',
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

              const dataArr = { expired: "Yes" }
              // UPDATE DB CREATIVE EXPIRED
              await Creative.findOneAndUpdate({ _id: crDt._id }, dataArr, { new: true }).exec().then((recordRes) => {
                console.log('Creative expired Update Request');
                if (!recordRes) {
                  console.log('Creative expired Update Response');
                  const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                  res.status(200).send(resMsg);
                  return;
                }
              }).catch((error) => {
                const reMsg = { "status": false, "message": error.message };
                res.status(400).send(reMsg);
              });


              const creativeData = await getAllCreativeByUpcommingDates(offDt._id);

              if (Array.isArray(creativeData) && creativeData.length > 0) {
                var creativeName = [];
                var creative_dimension = [];
                for (let k = 0; k < creativeData.length; k++) {
                  creativeName.push(creativeData[k].creative);
                  creative_dimension.push(creativeData[i].image_dimension);
                }
              }


              const final_creative_list = getCreativeNameLists(creativeName, creative_dimension);
              // START INSERT DATA INTO DB WITH CREATIVE CTR
              const banner_ctr = {
                "300x250": "1.1348-1.4514",
                "320x50": "1.1348-1.4514",
                "320x480": "1.3514-1.7373",
                "480x320": "1.303-1.8345",
                "84x84": "1.1348-1.4514",
                "default": "1.1348-1.4514",
                "720x1280": "1.3514-1.7373",
                "540x960": "1.3514-1.7373",
                "1080x1920": "1.3514-1.7373",
                "640x640": "1.3514-1.7373",
                "1280x720": "1.3514-1.7373",
                "1200x628": "1.3514-1.7373",
                "960x540": "1.3514-1.7373"
              }
              var creativeArr = [];
              for (const [key, val] of Object.entries(banner_ctr)) {
                let ctrArr = val.split('-');
                let randCTR = generateRandomNumber(parseFloat(ctrArr[0]), parseFloat(ctrArr[1]));
                creativeArr[key] = parseFloat(randCTR);
              }

              var final_creative_list_mod = [];
              for (let i = 0; i < final_creative_list.length; i++) {
                let key = Object.keys(final_creative_list[i])[0];
                let value = final_creative_list[i][key];

                final_creative_list_mod.push(value);
              }

              // END INSERT DATA INTO DB WITH CREATIVE CTR              
              const creativeTData = { "creativeNames": final_creative_list_mod };
              // // STEP-11 push app lists on trackier
              console.log('API push Cretive Push on trackier Request');
              await axios.put(process.env.API_BASE_URL + "campaigns/" + offDt.trackier_camp_id + "/creative-names", creativeTData, axios_header).then((creativeUpload) => {
                if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                  console.log('API push Cretive Push on trackier Response');
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
            }
          }

        }
      }
    }
    const errMsg = { "success": true, "message": "Creative cron run" };
    res.status(200).send(errMsg);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}