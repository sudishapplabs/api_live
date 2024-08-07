const Creatives = require("../models/creativeModel");
const CreativeCtrModel = require("../models/creativectrModel");
const { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, getCreativeNameLists, dateprint } = require('../common/helper');
const { getAdvertiserBalByAdvId, getAdvertiserNameByAdvId, getAdertiseDetailsByAdvId, getOfferNameBy_ID, getpublisherPayoutByPubandGeo, getpublisherPayoutArr, getPublisherByPubId, getAdvertiserBasicDetailsByAdvId, getpublisherPayoutByPubId, decodeHtml, addNotificationsData, addTimelineData } = require("../common/common");

const { URL } = require('url');
const querystring = require("querystring");
const axios = require('axios');

const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

const { parse } = require('csv-parse');
const { Readable } = require('stream');


const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
// create offer on trackier
const axios_header = {
  headers: {
    'x-api-key': process.env.API_KEY,
    'Content-Type': 'application/json'
  }
};

// Add a Offer by super admin
exports.addCreative = async (req, res) => {
  const { campaign_id, trackier_adv_id, trackier_camp_id, creative, creative_type, concept_name, image_dimension, ads_end_date, ads, user, expired } = req.body;

  // Validate request
  if (!campaign_id || !trackier_adv_id || !trackier_camp_id || !creative || !creative_type || !concept_name || !image_dimension || !ads || !user) {
    var requestVal = "";
    if (!campaign_id) {
      var requestVal = "campaign_id";
    } else if (!trackier_adv_id) {
      var requestVal = "trackier_adv_id";
    } else if (!trackier_camp_id) {
      var requestVal = "trackier_camp_id";
    } else if (!creative) {
      var requestVal = "creative";
    } else if (!creative_type) {
      var requestVal = "creative_type";
    } else if (!concept_name) {
      var requestVal = "concept_name";
    } else if (!image_dimension) {
      var requestVal = "image_dimension";
    } else if (!ads) {
      var requestVal = "ads";
    } else if (!user) {
      var requestVal = "user";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // Add Creative
  //process.exit();
  const creative_data = new Creatives({
    campaign_id: campaign_id,
    trackier_adv_id: trackier_adv_id,
    trackier_camp_id: trackier_camp_id,
    creative: creative,
    creative_type: creative_type,
    concept_name: concept_name,
    image_dimension: image_dimension,
    ads_end_date: ads_end_date,
    ads: ads,
    user: user,
    expired: "No"
  });

  // Save Offer in the database
  creative_data.save(creative_data).then(data => {
    const resMsg = { "success": true, "message": "Creative Added Successfully!", "offer": data };
    res.status(200).send(resMsg);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while adding the creative."
    });
  });

};


exports.getAllCreativeByOfferId = (req, res) => {
  const campaign_id = req.params.id;
  Creatives.find({ campaign_id: campaign_id }).sort({ _id: -1 }).exec().then((offCrRes) => {
    if (offCrRes) {
      const response = { 'success': true, 'results': offCrRes };
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

exports.deleteCreativeById = async (req, res) => {

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const { trackier_adv_id, trackier_camp_id, campaign_id, ids, isViewIcon } = req.body;
  var oldCreativeName = [];
  if (typeof campaign_id !== 'undefined' && campaign_id !== "") {
    const creatives = await Creatives.find({ campaign_id: campaign_id }).sort({ _id: -1 }).exec();
    for (let i = 0; i < creatives.length; i++) {
      oldCreativeName.push(creatives[i].creative);
    }
  }
  // DELETE CREATIVE BY ID
  Creatives.deleteMany({ _id: { $in: ids } }).exec().then(async (resCreative) => {
    console.log('Delete craetive from collection Request');
    if (resCreative) {
      console.log('Delete craetive from collection Response');

      if (typeof campaign_id !== 'undefined' && campaign_id !== "") {
        const creatives = await Creatives.find({ campaign_id: campaign_id }).sort({ _id: -1 }).exec();
        var creativeName = [];
        var creative_dimension = [];
        for (let i = 0; i < creatives.length; i++) {
          creativeName.push(creatives[i].creative);
          creative_dimension.push(creatives[i].image_dimension);
        }

        const final_creative_list = getCreativeNameLists(creativeName, creative_dimension);
        // START INSERT DATA INTO DB WITH CREATIVE CTR
        const banner_ctr = {
          "300x250": "1.1348-1.4514",
          "320x480": "1.3514-1.7373",
          "480x320": "1.303-1.8345",
          "84x84": "1.1348-1.4514",
          "720x1280": "1.3514-1.7373",
          "540x960": "1.3514-1.7373",
          "1080x1920": "1.3514-1.7373",
          "640x640": "1.3514-1.7373",
          "1280x720": "1.3514-1.7373",
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
          let creative = value;
          for (const [size, val] of Object.entries(creativeArr)) {
            if (key.indexOf(size) !== -1) {
              const aData = new CreativeCtrModel({
                trackier_adv_id: trackier_adv_id,
                trackier_camp_id: trackier_camp_id,
                creative_name: creative,
                creative_ctr: val,
              });
              let creative_ctr_exist = await CreativeCtrModel.find({ 'creative_name': creative });
              var creative_ctr_exist_arr = [];
              for (let n = 0; n < creative_ctr_exist.length; n++) {
                let creative_c = creative_ctr_exist[n];
                creative_ctr_exist_arr.push(creative_c.creative_name);
              }
              if (Array.isArray(creative_ctr_exist_arr) && creative_ctr_exist_arr.length == 0) {
                await aData.save(aData).then(ctr_data => {
                  console.log('Creative ctr ok');
                }).catch(err => {
                  console.error(err);
                });
              }
            }
          }
        }

        // Incase of isViewIcon exist We can push icon on a creative
        if (typeof isViewIcon !== 'undefined' && isViewIcon !== "") {
          final_creative_list_mod.push(isViewIcon);
          const aData = new CreativeCtrModel({
            trackier_adv_id: trackier_adv_id,
            trackier_camp_id: trackier_camp_id,
            creative_name: isViewIcon,
            creative_ctr: 1.4514,
          });
          await aData.save(aData).then(ctr_data => {
            console.log('Creative icon ctr ok');
          }).catch(err => {
            console.error(err);
          });

        }
        // END INSERT DATA INTO DB WITH CREATIVE CTR              
        const creativeData = { "creativeNames": final_creative_list_mod };
        // // STEP-11 push app lists on trackier
        console.log('API push Cretive Push on trackier Request');
        await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then(async (creativeUpload) => {
          if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
            // Send Mail to User
            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));
            const offerName = await getOfferNameBy_ID(campaign_id);
            const offer_name = offerName.name;

            // INSERT DATA INTO NOTIFICATIONS
            const notificationData = {
              advertiser_id: parseInt(trackier_adv_id),
              advertiser_name: ucfirst(advName.advertiserName),
              company_name: ucfirst(advName.advName),
              offer_id: trackier_camp_id,
              offer_name: ucfirst(offer_name),
              category: "Campaign",

              subject_adv: 'Campaign ' + offer_name + ' has been edited',
              message_adv: "<span class='text_primary'>Ads</span>,  Changes have successfully been made to campaign <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

              subject_sa: 'Campaign ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
              message_sa: "<span class='text_primary'>Ads</span>,  Changes have been made to campaign <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

              read: 0,
            }
            // END INSERT DATA INTO NOTIFICATIONS
            await addNotificationsData(notificationData);

            const creativeNameNewString = creativeName.join(', ');
            const creativeNameOldString = oldCreativeName.join(', ');


            // INSERT DATA INTO Tileline
            const timelineData = {
              advertiser_id: parseInt(trackier_adv_id),
              advertiser_name: ucfirst(advName.advertiserName),
              offer_id: trackier_camp_id,
              offer_name: ucfirst(offer_name),
              type: "Ads",
              old_value: creativeNameOldString,
              new_value: creativeNameNewString,
              edited_by: ucfirst(advName.advertiserName)
            }
            // END INSERT DATA INTO Tileline
            await addTimelineData(timelineData);

            if (advName.email_preferences == true) {
              // Send Mail to Admin if status inactive/suspended
              const bcc_mail = process.env.BCC_EMAILS.split(",");
              var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");


              const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
              const messageBodyAdvetiser = (templateAdvertiser({
                todayDate: dateprint(),
                adv_id: trackier_adv_id,
                offer_id: trackier_camp_id,
                offer_name: offer_name,
                adv_name: ucwords(advName.advName),
                advertiserName: ucwords(advName.advertiserName),
                edit_filed: "Ads",
                old_value: creativeNameOldString,
                new_value: creativeNameNewString,
                edited_by: ucfirst(advName.advertiserName),
                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
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
                subject: 'Applabs Alert - Camapign ' + offer_name + ' has been edited',
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
            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
            const templateAdmin = handlebars.compile(emailTemplateAdmin);
            const messageBodyAdmin = (templateAdmin({
              todayDate: dateprint(),
              adv_id: trackier_adv_id,
              offer_id: trackier_camp_id,
              offer_name: offer_name,
              adv_name: ucwords(advName.advName),
              advertiserName: ucwords(advName.advertiserName),
              edit_filed: "Ads",
              old_value: creativeNameOldString,
              new_value: creativeNameNewString,
              edited_by: ucfirst(advName.advertiserName),
              url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
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
              subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
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
            console.log('API push Cretive Push on trackier Response');
            const response = { 'success': true, 'message': 'Creative deleted successfully' };
            res.status(200).send(response);
            return;
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

// get creative from trackier
exports.downloadCreative = async (req, res) => {
  const trackier_camp_id = req.params.id;
  // Get all goals
  await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", axios_header).then(async (offerCreative) => {
    if (typeof offerCreative.statusText !== 'undefined' && offerCreative.statusText == "OK") {
      const response = { 'success': true, 'results': offerCreative.data.creativeNames };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!! 22" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch(err => {
    console.error(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });
}


exports.uploadCreativeByOfferId = async (req, res) => {
  if (req.file) {
    const buffer = req.file.buffer.toString();
    const readable = Readable.from(buffer);
    const results = [];

    readable
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', row => {
        results.push(row);
      })
      .on('end', async () => {
        try {
          const valuesArray = results.flatMap(item => Object.values(item));
          const creativeData = { "creativeNames": valuesArray };
          // STEP-11 push app lists on trackier
          await axios.put(process.env.API_BASE_URL + "campaigns/" + req.body.trackier_camp_id + "/creative-names", creativeData, axios_header).then((creativeUpload) => {
            console.log('Trackier Creative icon Request');
            if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
              console.log('Trackier Creative icon Response');
              const resData = { 'success': true, 'message': "File processed successfully" };
              res.status(200).send(resData);
              return;
            } else {
              const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
              res.status(200).send(resMsg);
              return;
            }
          }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(200).send(errMsg);
            return;
          });
        } catch (error) {
          const resData = { 'success': false, 'message': error.message };
          res.status(500).send(resData);
          return;
        }
      })
      .on('error', err => {
        const resData = { 'success': false, 'message': err.message };
        res.status(200).send(resData);
        return;
      });
  } else {
    const resData = { 'success': false, 'message': "File not found!" };
    res.status(200).send(resData);
    return;
  }


};


exports.updateCreativeName = async (req, res) => {
  const { creatives, campaign_id, trackier_adv_id, trackier_camp_id } = req.body;
  for (let i = 0; i < creatives.length; i++) {
    let ctDt = creatives[i]

    await Creatives.findOneAndUpdate({ _id: ctDt.creativeId }, { creative: ctDt.creative_name }, { new: true }).exec().then(async (updateCrName) => {
      if (!updateCrName) {
        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
        res.status(200).send(resMsg);
        return;
      }
    }).catch((error) => {
      const reMsg = { "status": false, "message": error.message };
      res.status(400).send(reMsg);
      return;
    });
  }

  if (typeof campaign_id !== 'undefined' && campaign_id !== "") {

    const creatives = await Creatives.find({ campaign_id: campaign_id }).sort({ _id: -1 }).exec();
    var creativeName = [];
    var creative_dimension = [];
    for (let i = 0; i < creatives.length; i++) {
      creativeName.push(creatives[i].creative);
      creative_dimension.push(creatives[i].image_dimension);
    }

    const final_creative_list = getCreativeNameLists(creativeName, creative_dimension);
    // START INSERT DATA INTO DB WITH CREATIVE CTR
    const banner_ctr = {
      "300x250": "1.1348-1.4514",
      "320x480": "1.3514-1.7373",
      "480x320": "1.303-1.8345",
      "84x84": "1.1348-1.4514",
      "720x1280": "1.3514-1.7373",
      "540x960": "1.3514-1.7373",
      "1080x1920": "1.3514-1.7373",
      "640x640": "1.3514-1.7373",
      "1280x720": "1.3514-1.7373",
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
      let creative = value;
      for (const [size, val] of Object.entries(creativeArr)) {
        if (key.indexOf(size) !== -1) {
          const aData = new CreativeCtrModel({
            trackier_adv_id: trackier_adv_id,
            trackier_camp_id: trackier_camp_id,
            creative_name: creative,
            creative_ctr: val,
          });
          let creative_ctr_exist = await CreativeCtrModel.find({ 'creative_name': creative });
          var creative_ctr_exist_arr = [];
          for (let n = 0; n < creative_ctr_exist.length; n++) {
            let creative_c = creative_ctr_exist[n];
            creative_ctr_exist_arr.push(creative_c.creative_name);
          }
          if (Array.isArray(creative_ctr_exist_arr) && creative_ctr_exist_arr.length == 0) {
            await aData.save(aData).then(ctr_data => {
              console.log('Creative ctr ok');
            }).catch(err => {
              console.error(err);
            });
          }
        }
      }
    }
    // END INSERT DATA INTO DB WITH CREATIVE CTR              
    const creativeData = { "creativeNames": final_creative_list_mod };
    // // STEP-11 push app lists on trackier
    console.log('API push Cretive Push on trackier Request');
    await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then((creativeUpload) => {
      if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
        console.log('API push Cretive Push on trackier Response');
        const response = { 'success': true, 'message': 'Creative name updated successfully' };
        res.status(200).send(response);
        return;
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
  } else {
    const reMsg = { "status": false, "message": "campaign_id not found!" };
    res.status(400).send(reMsg);
    return;
  }

}