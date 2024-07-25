const Advertiser = require("../models/advertiserModel");
const { URL, parse } = require('url');
const axios = require('axios');
const querystring = require("querystring");
const Publishers = require("../models/publisherModel");
const Applist = require("../models/applistModel");
const CreativeCtrModel = require("../models/creativectrModel");
const Offer = require("../models/offerModel");
const Preset = require("../models/presetModel");
const Placement = require("../models/placementModel");
const ucfirst = require("ucfirst");

const { convertCampaignData } = require("../common/common");

// Get Statics Data
exports.staticsData = async (req, res) => {


  // check body key
  const paramSchema = { 1: 'group', 2: 'start', 3: 'end', 4: 'camp_ids', 5: 'adv_ids' };
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
  const { group, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(group)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "group should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }


  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };
  const advertiserId = parseInt(req.query.advertiserId);
  let newQueryString = querystring.stringify(req.body);


  let checqueryString = newQueryString.replace("&", " ");

  if ((checqueryString.indexOf("city") !== -1) || (checqueryString.indexOf("region") !== -1) || (checqueryString.indexOf("app_name") !== -1) || (checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("cr_name") !== -1) || (checqueryString.indexOf("audienc_int") !== -1)) {
    var endpoint = "reports/subid"
  } else {
    var endpoint = "reports/custom"
  }
  newQueryString = newQueryString.replaceAll("group", "group[]");
  newQueryString = newQueryString.replaceAll("camp_ids", "camp_ids[]");
  newQueryString = newQueryString.replace("app_id", "app_name");
  newQueryString = newQueryString.replace("audienc_int", "app_name");
  newQueryString = newQueryString.replace("placement", "source");

  var adv_str = "";
  var adv_array = {};
  var adv_icons_arr = {};
  var pub_array = {};
  var off_geo_array = {};
  var off_total_budget_array = {};
  var off_icon_array = {};
  var app_array = {};
  var CTR_array = {};
  var SDK_array = {};
  var DIRECT_array = {};
  var placement_array = {};
  if (advertiserId) {
    var adv_str = "adv_ids[]=" + advertiserId + "&";
  } else {
    if (Array.isArray(req.body.adv_ids) && req.body.adv_ids.length > 0) {
      newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
    } else {
      if (Array.isArray(req.body.camp_ids) && req.body.camp_ids.length == 0) {
        await Advertiser.find({}).sort({ _id: 1 }).exec().then((advertisers) => {
          if (advertisers) {
            for (let i = 0; i < advertisers.length; i++) {
              let adv = advertisers[i];
              if (adv.tid > 0) {
                adv_str += ("adv_ids[]=" + adv.tid + "&");
              }
            }
          }

        }).catch(error => {
          console.error(error);
        });
      }
    }

  }

  // get all Offer GEO with offer id
  await Offer.find({ trackier_camp_id: { '$ne': 0 } }).sort({ _id: 1 }).exec().then((all_off_geo) => {
    if (all_off_geo) {
      for (let k = 0; k < all_off_geo.length; k++) {
        let off_geo = all_off_geo[k];
        off_geo_array[off_geo.trackier_camp_id] = ucfirst(off_geo.country);
        off_total_budget_array[off_geo.trackier_camp_id] = off_geo.total_budget;
        off_icon_array[off_geo.trackier_camp_id] = off_geo.icon;
      }
    }
  }).catch(error => {
    console.error(error);
  });
  // get all advertisers
  await Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
        adv_icons_arr[adv.tid] = adv.profile_pic;
      }
    }
  }).catch(error => {
    console.error(error);
  });


  // get all publishers
  await Publishers.find({}).sort({ _id: 1 }).exec().then((all_pub) => {
    if (all_pub) {
      for (let k = 0; k < all_pub.length; k++) {
        let pub = all_pub[k];
        pub_array[pub.pub_id] = ucfirst(pub.pub_name);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all app name
  await Applist.find({}).sort({ _id: 1 }).exec().then((all_Applist) => {
    if (all_Applist) {
      for (let m = 0; m < all_Applist.length; m++) {
        let app = all_Applist[m];
        app_array[app.AppBundle] = app.App_Name + "||" + app.Category + "||" + app.CTR;
      }
    }
  }).catch(error => {
    console.error(error);
  })

  // get creative CTR
  await CreativeCtrModel.find({}).sort({ _id: 1 }).exec().then((all_CreativeCTR) => {
    if (all_CreativeCTR) {
      for (let n = 0; n < all_CreativeCTR.length; n++) {
        let CTR = all_CreativeCTR[n];
        CTR_array[CTR.creative_name] = CTR.creative_ctr;
      }
    }
  }).catch(error => {
    console.error(error);
  })

  // Get all placements
  await Placement.find({}).sort({ _id: 1 }).exec().then((all_Placement) => {
    if (all_Placement) {
      for (let q = 0; q < all_Placement.length; q++) {
        let plaDat = all_Placement[q];
        placement_array[plaDat.placement_id] = plaDat.name;
      }
    }
  }).catch(error => {
    console.error(error);
  })

  // get SDK Offer
  try {
    const all_SDK = await Offer.find({ '$and': [{ 'source_type': "SDK" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
    if (all_SDK) {
      for (let p = 0; p < all_SDK.length; p++) {
        let SDK = all_SDK[p];
        SDK_array[SDK.trackier_camp_id] = SDK.trackier_camp_id;
      }
    }
  } catch (error) {
    console.error(error);
  }

  // get DIRECT Offer
  try {
    const all_DIRECT = await Offer.find({ '$and': [{ 'source_type': "DIRECT" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
    if (all_DIRECT) {
      for (let p = 0; p < all_DIRECT.length; p++) {
        let DIRECT = all_DIRECT[p];
        DIRECT_array[DIRECT.trackier_camp_id] = DIRECT.trackier_camp_id;
      }
    }
  } catch (error) {
    console.error(error);
  }

  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

  await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then(async (staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var reportData = [];
      var reportDatas = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;

        var uniqGoalNames = [];
        var n_uniqGoalNames = [];
        if ((checqueryString.indexOf("goal_name") !== -1)) {
          for (let i = 0; i < advArrData.length; i++) {
            var r = advArrData[i];
            if ((uniqGoalNames.indexOf(r.goal_name) == -1)) {
              uniqGoalNames.push(r.goal_name);
            }
          }
        }
        if ((checqueryString.indexOf("goal_name") !== -1)) {
          uniqGoalNames.unshift('install');
          for (var i = 0; i < uniqGoalNames.length; i++) {
            if (n_uniqGoalNames.indexOf(uniqGoalNames[i]) == -1) n_uniqGoalNames.push(uniqGoalNames[i]);
          }
        }

        const repData = await convertCampaignData(advArrData, checqueryString, SDK_array, DIRECT_array, off_geo_array, off_total_budget_array, off_icon_array, adv_icons_arr);
        var m = 0;
        for (const [key, val] of Object.entries(repData)) {

          var golsData = {};
          for (let s = 0; s < n_uniqGoalNames.length; s++) {
            let gname = n_uniqGoalNames[s];
            golsData[gname] = val[gname];
          }

          //console.log(golsData);

          if (val.grossClicks == 0) {
            var grossPayableConversionsCR = 0;
            var converionRateCR = 0;
            var converionCR = 0;
          } else {
            let converionDataVal = (val.custInstall * 100) / val.grossClicks;
            converionCR = Math.round(converionDataVal * 100) / 100;

            let converionDataVals = (val.grossPayableConversions / val.grossClicks) * 100;
            grossPayableConversionsCR = Math.round(converionDataVals * 100) / 100;

            let converionDataValss = (val.grossConversions / val.grossClicks) * 100;
            converionRateCR = Math.round(converionDataValss * 100) / 100;
          }


          var impression = 0;
          if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
            impression = 0;
            if (app_array.hasOwnProperty(val.app_name)) {
              let appNameSplit = app_array[val.app_name].split("||");
              let clickImpC = (val.grossClicks / parseFloat(appNameSplit[2])) * 100;
              impression = Math.round(clickImpC);
            } else {
              impression = 0;
            }
          }

          if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
            impression = 0;
            if (CTR_array.hasOwnProperty(val.cr_name)) {
              let cretiveImpC = (val.grossClicks / parseFloat(CTR_array[val.cr_name])) * 100;
              impression = Math.round(cretiveImpC);
            } else {
              impression = 0;
            }
          }


          if (SDK_array.hasOwnProperty(val.campaign_id)) {
            var campaign_type = "SDK";
          } else {
            var campaign_type = "DIRECT";
          }

          if (off_geo_array.hasOwnProperty(val.campaign_id)) {
            var campaign_geo = off_geo_array[val.campaign_id];
          } else {
            var campaign_geo = "";
          }

          if (off_total_budget_array.hasOwnProperty(val.campaign_id)) {
            var total_budget = off_total_budget_array[val.campaign_id];
          } else {
            var total_budget = "";
          }

          if (off_icon_array.hasOwnProperty(val.campaign_id)) {
            var camp_icon = off_icon_array[val.campaign_id];
          } else {
            var camp_icon = "";
          }

          if (adv_icons_arr.hasOwnProperty(val.advertiser_id)) {
            var adv_profile_pic = adv_icons_arr[val.advertiser_id];
          } else {
            var adv_profile_pic = "";
          }

          if (adv_array.hasOwnProperty(val.advertiser_id)) {
            var advertiser_name = adv_array[val.advertiser_id];
          } else {
            var advertiser_name = val.advertiser;
          }

          if ((checqueryString.indexOf("app_id") !== -1)) {
            var app_id = val.app_name;
          } else {
            var app_id = "NA";
          }


          if ((checqueryString.indexOf("placement") !== -1)) {
            if (placement_array.hasOwnProperty(val.source)) {
              var source = placement_array[val.source];
            } else {
              var source = val.source;
            }
          } else {
            var source = "NA";
          }

          if ((checqueryString.indexOf("publisher_id") !== -1)) {
            if (pub_array.hasOwnProperty(val.publisher_id)) {
              var publisher_name = pub_array[val.publisher_id];
            } else {
              var publisher_name = "NA";
            }
          } else {
            var publisher_name = "NA";
          }

          var audienc_interest = "";
          if ((checqueryString.indexOf("audienc_int") !== -1)) {
            if (app_array.hasOwnProperty(val.app_name)) {
              let appNameSplit = app_array[val.app_name].split("||");
              audienc_interest = appNameSplit[1];
            } else {
              audienc_interest = "NA";
            }
          }

          var app_name = "";
          if ((checqueryString.indexOf("app_name") !== -1)) {
            if (app_array.hasOwnProperty(val.app_name)) {
              let appNameSplit = app_array[val.app_name].split("||");
              app_name = appNameSplit[0];
            } else {
              app_name = val.app_name;
            }
          }


          let offer_name = val.campaign_name.replace("AL-", "");
          reportData.push({
            "campaign_name": offer_name,
            "campaign_id": val.campaign_id,
            "advertiser": advertiser_name,
            "advertiser_id": val.advertiser_id,
            "campaign_status": (typeof val.campaign_status !== 'undefined') ? val.campaign_status : '',
            "grossClicks": val.grossClicks,
            "grossConversions": val.grossConversions,
            "grossRevenue": Math.round(val.grossRevenue * 100) / 100,
            "grossPayableConversions": val.grossPayableConversions,
            "converionCR": converionCR,
            "grossPayableConversionsCR": grossPayableConversionsCR,
            "converionRateCR": converionRateCR,
            "custInstall": val.custInstall,
            "impression": impression,
            "campaign_type": campaign_type,
            "campaign_geo": campaign_geo,
            "total_budget": total_budget,
            "camp_icon": camp_icon,
            "adv_profile_pic": adv_profile_pic,
            "campaign_os": "Android",
            "goal_name": val.goal_name,
            "app_id": app_id,
            "app_name": app_name,
            "source": source,
            "publisher_id": (typeof val.publisher_id !== 'undefined') ? val.publisher_id : '',
            "cr_name": (typeof val.cr_name !== 'undefined') ? val.cr_name : '',
            "publisher_name": publisher_name,
            "audienc_interest": audienc_interest,
            "country": (typeof val.country !== 'undefined') ? val.country : '',
            "region": (typeof val.region !== 'undefined') ? val.region : '',
            "city": (typeof val.city !== 'undefined') ? val.city : '',
            "month": (typeof val.month !== 'undefined') ? val.month : '',
            "created": (typeof val.created !== 'undefined') ? val.created : '',
            "hour": (typeof val.hour !== 'undefined') ? val.hour : '',
            "currency": "USD",
            "campaign_payout": (typeof val.campaign_payout !== 'undefined') ? val.campaign_payout : ''

          });

          let reportMapdData = {
            ...reportData[m],
            ...golsData
          }
          reportDatas.push(reportMapdData);
          m++;
        }

        //const data_obj_to_arr = Object.values(reportData);
        const newArrDataByClick = reportDatas.sort((a, b) => b.grossClicks - a.grossClicks).slice();

        const response = { 'success': true, 'records': newArrDataByClick };
        res.status(200).send(response);
        return
      } else {
        const resMsg = { "success": false, "message": "No records found" };
        res.status(200).send(resMsg);
        return;
      }
    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });

};

/*exports.staticsData = async (req, res) => {


  // check body key
  const paramSchema = { 1: 'group', 2: 'start', 3: 'end', 4: 'camp_ids', 5: 'adv_ids' };
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
  const { group, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  if (!Array.isArray(group)) {
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "group should be []!!" } };
    res.status(400).send(reMsg);
    return;
  }


  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };
  const advertiserId = parseInt(req.query.advertiserId);
  let newQueryString = querystring.stringify(req.body);


  let checqueryString = newQueryString.replace("&", " ");

  if ((checqueryString.indexOf("city") !== -1) || (checqueryString.indexOf("region") !== -1) || (checqueryString.indexOf("app_name") !== -1) || (checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("cr_name") !== -1) || (checqueryString.indexOf("audienc_int") !== -1)) {
    var endpoint = "reports/subid"
  } else {
    var endpoint = "reports/custom"
  }
  newQueryString = newQueryString.replaceAll("group", "group[]");
  newQueryString = newQueryString.replaceAll("camp_ids", "camp_ids[]");
  newQueryString = newQueryString.replace("app_id", "app_name");
  newQueryString = newQueryString.replace("audienc_int", "app_name");
  newQueryString = newQueryString.replace("placement", "source");

  var adv_str = "";
  var adv_array = {};
  var adv_icons_arr = {};
  var pub_array = {};
  var off_geo_array = {};
  var off_total_budget_array = {};
  var off_icon_array = {};
  var app_array = {};
  var CTR_array = {};
  var SDK_array = {};
  var DIRECT_array = {};
  if (advertiserId) {
    var adv_str = "adv_ids[]=" + advertiserId + "&";
  } else {
    if (Array.isArray(req.body.adv_ids) && req.body.adv_ids.length > 0) {
      newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
    } else {
      if (Array.isArray(req.body.camp_ids) && req.body.camp_ids.length == 0) {
        await Advertiser.find({}).sort({ _id: 1 }).exec().then((advertisers) => {
          if (advertisers) {
            for (let i = 0; i < advertisers.length; i++) {
              let adv = advertisers[i];
              if (adv.tid > 0) {
                adv_str += ("adv_ids[]=" + adv.tid + "&");
              }
            }
          }

        }).catch(error => {
          console.error(error);
        });
      }
    }

  }

  // get all Offer GEO with offer id
  await Offer.find({ trackier_camp_id: { '$ne': 0 } }).sort({ _id: 1 }).exec().then((all_off_geo) => {
    if (all_off_geo) {
      for (let k = 0; k < all_off_geo.length; k++) {
        let off_geo = all_off_geo[k];
        off_geo_array[off_geo.trackier_camp_id] = ucfirst(off_geo.country);
        off_total_budget_array[off_geo.trackier_camp_id] = off_geo.total_budget;
        off_icon_array[off_geo.trackier_camp_id] = off_geo.icon;
      }
    }
  }).catch(error => {
    console.error(error);
  });
  // get all advertisers
  await Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
        adv_icons_arr[adv.tid] = adv.profile_pic;
      }
    }
  }).catch(error => {
    console.error(error);
  });


  // get all publishers
  await Publishers.find({}).sort({ _id: 1 }).exec().then((all_pub) => {
    if (all_pub) {
      for (let k = 0; k < all_pub.length; k++) {
        let pub = all_pub[k];
        pub_array[pub.pub_id] = ucfirst(pub.pub_name);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all app name
  await Applist.find({}).sort({ _id: 1 }).exec().then((all_Applist) => {
    if (all_Applist) {
      for (let m = 0; m < all_Applist.length; m++) {
        let app = all_Applist[m];
        app_array[app.AppBundle] = app.App_Name + "||" + app.Category + "||" + app.CTR;
      }
    }
  }).catch(error => {
    console.error(error);
  })

  // get creative CTR
  await CreativeCtrModel.find({}).sort({ _id: 1 }).exec().then((all_CreativeCTR) => {
    if (all_CreativeCTR) {
      for (let n = 0; n < all_CreativeCTR.length; n++) {
        let CTR = all_CreativeCTR[n];
        CTR_array[CTR.creative_name] = CTR.creative_ctr;
      }
    }
  }).catch(error => {
    console.error(error);
  })

  // get SDK Offer
  try {
    const all_SDK = await Offer.find({ '$and': [{ 'source_type': "SDK" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
    if (all_SDK) {
      for (let p = 0; p < all_SDK.length; p++) {
        let SDK = all_SDK[p];
        SDK_array[SDK.trackier_camp_id] = SDK.trackier_camp_id;
      }
    }
  } catch (error) {
    console.error(error);
  }

  // get DIRECT Offer
  try {
    const all_DIRECT = await Offer.find({ '$and': [{ 'source_type': "DIRECT" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
    if (all_DIRECT) {
      for (let p = 0; p < all_DIRECT.length; p++) {
        let DIRECT = all_DIRECT[p];
        DIRECT_array[DIRECT.trackier_camp_id] = DIRECT.trackier_camp_id;
      }
    }
  } catch (error) {
    console.error(error);
  }


  //newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
  // console.log(newQueryString);



  // process.exit();

  console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=campaign_status&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

  await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=campaign_status&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var reportData = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;

        //console.log(advArrData);
        for (let j = 0; j < advArrData.length; j++) {
          let advTrkData = advArrData[j];


          let offer_name = advTrkData.campaign_name.replace("AL-", "");

          //console.log(adv_array[advTrkData.advertiser_id]);
          // console.log(adv_array);

          if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkData.advertiser_id];
          } else {
            var advertiser_name = advTrkData.advertiser;
          }

          if ((checqueryString.indexOf("app_id") !== -1)) {
            var app_id = advTrkData.app_name;
          } else {
            var app_id = "";
          }


          if ((checqueryString.indexOf("placement") !== -1)) {
            var source = advTrkData.source;
          } else {
            var source = "";
          }

          if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
            var publisher_name = pub_array[advTrkData.publisher_id];
          } else {
            var publisher_name = "";
          }


          var app_name = "";
          if ((checqueryString.indexOf("app_name") !== -1)) {
            if (app_array.hasOwnProperty(advTrkData.app_name)) {
              let appNameSplit = app_array[advTrkData.app_name].split("||");
              app_name = appNameSplit[0];
            } else {
              app_name = advTrkData.app_name;
            }
          }


          var audienc_interest = "";
          if ((checqueryString.indexOf("audienc_int") !== -1)) {
            if (app_array.hasOwnProperty(advTrkData.app_name)) {
              let appNameSplit = app_array[advTrkData.app_name].split("||");
              audienc_interest = appNameSplit[1];
              app_name = advTrkData.app_name;
            } else {
              audienc_interest = "";
            }
          }

          var impression = '';
          if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
            impression = 0;
            if (app_array.hasOwnProperty(advTrkData.app_name)) {
              let appNameSplit = app_array[advTrkData.app_name].split("||");
              let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
              impression = Math.round(clickImpC);
            } else {
              impression = 0;
            }
          }

          if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
            impression = 0;
            if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
              let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
              impression = Math.round(cretiveImpC);
            } else {
              impression = 0;
            }
          }

          reportData.push({
            "campaign_name": offer_name,
            "campaign_id": advTrkData.campaign_id,
            "campaign_status": advTrkData.campaign_status,
            "campaign_type": "",
            "campaign_geo": "",
            "camp_icon": "",
            "campaign_os": "Android",
            "advertiser": advertiser_name,
            "advertiser_id": advTrkData.advertiser_id,
            "adv_profile_pic": "",
            "goal_name": advTrkData.goal_name,
            app_id,
            source,
            "publisher_id": advTrkData.publisher_id,
            publisher_name,
            app_name,
            "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
            impression,
            audienc_interest,
            "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
            "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
            "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
            "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
            "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
            "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
            "currency": advTrkData.currency,
            "campaign_payout": advTrkData.campaign_payout,
            "grossClicks": advTrkData.grossClicks,
            "grossConversions": advTrkData.grossConversions,
            "grossRevenue": advTrkData.grossRevenue,
            "grossPayableConversions": 0,
            "grossPayableConversionsCR": 0,
            "converionRateCR": 0,
            "converionCR": 0,
            "custInstall": 0,
            "total_budget": 0
          });
        }
      }

      var newData = {};
      var uniqGoalNames = [];
      var n_uniqGoalNames = [];
      if ((checqueryString.indexOf("goal_name") !== -1)) {
        for (let i = 0; i < reportData.length; i++) {
          var r = reportData[i];
          if ((uniqGoalNames.indexOf(r.goal_name) == -1)) {
            uniqGoalNames.push(r.goal_name);
          }
        }
      }

      if ((checqueryString.indexOf("goal_name") !== -1)) {
        uniqGoalNames.unshift('install');
        //uniqGoalNames = array_unique($uniqGoalNames);
        for (var i = 0; i < uniqGoalNames.length; i++) {
          if (n_uniqGoalNames.indexOf(uniqGoalNames[i]) == -1) n_uniqGoalNames.push(uniqGoalNames[i]);
        }
      }


      for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];

        if (SDK_array.hasOwnProperty(r.campaign_id)) {
          r.source = 'NA';
        }
        if (SDK_array.hasOwnProperty(r.campaign_id)) {
          r.publisher_id = 'NA';
        }

        if (DIRECT_array.hasOwnProperty(r.campaign_id)) {
          r.app_name = 'NA';
        }

        if ((checqueryString.indexOf("goal_name") !== -1)) {

          for (let q = 0; q < n_uniqGoalNames.length; q++) {
            let gname = n_uniqGoalNames[q];
            if (r.goal_name != gname) {
              r[gname] = 0;
            } else {
              r[gname] = r.grossConversions;
            }
          }
        }

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.publisher_id !== 'undefined' && r.publisher_id !== "") {
          superKey += r.publisher_id;
        }
        if (typeof r.source !== 'undefined' && r.source !== "") {
          superKey += r.source;
        }
        if (typeof r.app_name !== 'undefined' && r.app_name !== "") {
          superKey += r.app_name;
        }
        if (typeof r.cr_name !== 'undefined' && r.cr_name !== "") {
          superKey += r.cr_name;
        }
        if (typeof r.goal_id !== 'undefined' && r.goal_id !== "") {
          superKey += r.goal_id;
        }
        if (typeof r.country !== 'undefined' && r.country !== "") {
          superKey += r.country;
        }
        if (typeof r.region !== 'undefined' && r.region !== "") {
          superKey += r.region;
        }
        if (typeof r.city !== 'undefined' && r.city !== "") {
          superKey += r.city;
        }
        if (typeof r.month !== 'undefined' && r.month !== "") {
          superKey += r.month;
        }
        if (typeof r.created !== 'undefined' && r.created !== "") {
          superKey += r.created;
        }
        if (typeof r.hour !== 'undefined' && r.hour !== "") {
          superKey += r.hour;
        }

        if (newData[superKey]) {
          newData[superKey]['grossClicks'] += r.grossClicks;
          newData[superKey]['grossConversions'] += r.grossConversions;
          newData[superKey]['grossRevenue'] += r.grossRevenue;

          for (let s = 0; s < n_uniqGoalNames.length; s++) {
            let gname = n_uniqGoalNames[s];
            if (r.goal_name === gname) {
              if (r.grossConversions > 0) {
                newData[superKey][gname] += r.grossConversions;
              } else {
                newData[superKey][gname] += 0;
              }
            }
          }
        } else {
          newData[superKey] = r;
          // if (checqueryString.indexOf("audienc_int") !== -1) {
          //   newData[superKey]['audienc_int'] = r.audienc_int;
          // }
        }
        if (r.grossRevenue > 0) {
          newData[superKey]['grossPayableConversions'] += r.grossConversions;
        }
        if (r.goal_name == 'install') {
          newData[superKey]['custInstall'] += r.grossConversions;
        } else {
          newData[superKey]['custInstall'] += 0;
        }

        if (SDK_array.hasOwnProperty(r.campaign_id)) {
          newData[superKey]['campaign_type'] = "SDK";
        } else {
          newData[superKey]['campaign_type'] = "DIRECT";
        }

        if (off_geo_array.hasOwnProperty(r.campaign_id)) {
          newData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
        } else {
          newData[superKey]['campaign_geo'] = "";
        }

        if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
          newData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
        } else {
          newData[superKey]['total_budget'] = "";
        }

        if (off_icon_array.hasOwnProperty(r.campaign_id)) {
          newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
        } else {
          newData[superKey]['camp_icon'] = "";
        }

        if (adv_icons_arr.hasOwnProperty(r.advertiser_id)) {
          newData[superKey]['adv_profile_pic'] = adv_icons_arr[r.advertiser_id];
        } else {
          newData[superKey]['adv_profile_pic'] = "";
        }

        if (r.grossClicks == 0) {
          newData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }


        if (r.grossClicks == 0) {
          newData[superKey]['grossPayableConversionsCR'] += 0;
        } else {
          let converionDataVals = (newData[superKey]['grossPayableConversions'] / r.grossClicks) * 100;
          newData[superKey]['grossPayableConversionsCR'] += Math.round(converionDataVals * 100) / 100;
        }

        if (r.grossClicks == 0) {
          newData[superKey]['converionRateCR'] += 0;
        } else {
          let converionDataVals = (newData[superKey]['grossConversions'] / r.grossClicks) * 100;
          newData[superKey]['converionRateCR'] += Math.round(converionDataVals * 100) / 100;
        }
      }

      const data_obj_to_arr = Object.values(newData);
      const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();

      const response = { 'success': true, 'records': newArrDataByClick };
      res.status(200).send(response);
      return
    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });

};
*/


// Get Statics Data Quick View

exports.quickViewData = async (req, res) => {

  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'start', 3: 'end' };
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
  const { offer_id, start, end } = req.body;

  // Validate request
  if (!offer_id || !start || !end) {
    var requestVal = "";
    if (!offer_id) {
      var requestVal = "offer_id";
    } else if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  let newQueryString = querystring.stringify(req.body);

  var endpoint = "reports/custom"


  newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");

  var adv_array = {};
  var pub_array = {};
  var off_geo_array = {};
  var app_array = {};

  // get all advertisers
  Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all publishers
  Publishers.find({}).sort({ _id: 1 }).exec().then((all_pub) => {
    if (all_pub) {
      for (let k = 0; k < all_pub.length; k++) {
        let pub = all_pub[k];
        pub_array[pub.pub_id] = ucfirst(pub.pub_name);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all Offer GEO with offer id
  Offer.find({}).sort({ _id: 1 }).exec().then((all_off_geo) => {
    if (all_off_geo) {
      for (let k = 0; k < all_off_geo.length; k++) {
        let off_geo = all_off_geo[k];
        off_geo_array[off_geo.trackier_camp_id] = ucfirst(off_geo.country);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all app name
  await Applist.find({}).sort({ _id: 1 }).exec().then((all_Applist) => {
    if (all_Applist) {
      for (let m = 0; m < all_Applist.length; m++) {
        let app = all_Applist[m];
        app_array[app.AppBundle] = app.App_Name + "||" + app.Category + "||" + app.CTR;
      }
    }
  }).catch(error => {
    console.error(error);
  })


  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryString + "&zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryString + "&zone=Asia/Kolkata", axios_header).then((staticsAppRes) => {
    if (typeof staticsAppRes.statusText !== 'undefined' && staticsAppRes.statusText == "OK") {

      var reportAppData = [];
      if (Array.isArray(staticsAppRes.data.records) && staticsAppRes.data.records.length > 0) {
        const advArrAppData = staticsAppRes.data.records;
        for (let j = 0; j < advArrAppData.length; j++) {
          let advTrkAppData = advArrAppData[j];

          let offer_name = advTrkAppData.campaign_name.replace("AL-", "");
          if (adv_array.hasOwnProperty(advTrkAppData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkAppData.advertiser_id];
          } else {
            var advertiser_name = advTrkAppData.advertiser;
          }

          var publisher_name = "";
          if (app_array.hasOwnProperty(advTrkAppData.app_name)) {
            let appNameSplit = app_array[advTrkAppData.app_name].split("||");
            publisher_name = appNameSplit[0];
          } else {
            publisher_name = advTrkAppData.app_name;
          }

          if (publisher_name) {
            reportAppData.push({
              "campaign_name": offer_name,
              "campaign_id": advTrkAppData.campaign_id,
              "advertiser": advertiser_name,
              "advertiser_id": advTrkAppData.advertiser_id,
              "publisher_id": advTrkAppData.app_name,
              publisher_name,
              "grossClicks": advTrkAppData.grossClicks,
              "grossConversions": advTrkAppData.grossConversions,
              "grossRevenue": advTrkAppData.grossRevenue,
              "converionCR": 0,
              "grossInstall": 0
            });
          }
        }
      }

      var newAppData = {};
      for (let i = 0; i < reportAppData.length; i++) {
        let r = reportAppData[i];

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.publisher_id !== 'undefined' && r.publisher_id !== "") {
          superKey += r.publisher_id;
        }
        superKey += i + 1;

        if (newAppData[superKey]) {
          newAppData[superKey]['grossClicks'] += r.grossClicks;
          newAppData[superKey]['grossConversions'] += r.grossConversions;
          newAppData[superKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newAppData[superKey] = r;
        }
        if (r.grossClicks == 0) {
          newAppData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newAppData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }
        newAppData[superKey]['grossInstall'] += r.grossConversions;
      }

      const data_obj_to_app_arr = Object.values(newAppData);
      const newArrDataByAppClick = data_obj_to_app_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 5);
      const objFilterDataTopAppsource = newArrDataByAppClick;

      // START GET DATA BY GEO
      //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryString + "&zone=Asia/Kolkata");

      axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryString + "&zone=Asia/Kolkata", axios_header).then((staticsResByGeo) => {
        if (typeof staticsResByGeo.statusText !== 'undefined' && staticsResByGeo.statusText == "OK") {

          var reportDataGeo = [];
          if (Array.isArray(staticsResByGeo.data.records) && staticsResByGeo.data.records.length > 0) {
            const advArrDataGeo = staticsResByGeo.data.records;

            for (let j = 0; j < advArrDataGeo.length; j++) {
              let advTrkDataGeo = advArrDataGeo[j];


              let offer_name = advTrkDataGeo.campaign_name.replace("AL-", "");

              //console.log(adv_array[advTrkDataGeo.advertiser_id]);

              //console.log(adv_array);

              if (adv_array.hasOwnProperty(advTrkDataGeo.advertiser_id)) {
                var advertiser_name = adv_array[advTrkDataGeo.advertiser_id];
              } else {
                var advertiser_name = advTrkDataGeo.advertiser;
              }

              if (off_geo_array.hasOwnProperty(advTrkDataGeo.campaign_id)) {
                var country_name = off_geo_array[advTrkDataGeo.campaign_id];
              } else {
                var country_name = "";
              }
              const geoArr = country_name.split(",");
              if (geoArr.includes(advTrkDataGeo.country)) {
                reportDataGeo.push({
                  "campaign_name": offer_name,
                  "campaign_id": advTrkDataGeo.campaign_id,
                  "advertiser": advertiser_name,
                  "advertiser_id": advTrkDataGeo.advertiser_id,
                  "country": advTrkDataGeo.country,
                  "grossClicks": advTrkDataGeo.grossClicks,
                  "grossConversions": advTrkDataGeo.grossConversions,
                  "grossRevenue": advTrkDataGeo.grossRevenue,
                  "converionCR": 0,
                  "grossInstall": 0
                });
              }
            }
          }

          var newDataGeo = {};



          for (let i = 0; i < reportDataGeo.length; i++) {
            let r = reportDataGeo[i];


            var superKey = "";
            if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
              superKey += r.campaign_name;
            }
            if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
              superKey += r.advertiser;
            }
            if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
              superKey += r.advertiser_id;
            }
            if (typeof r.country !== 'undefined' && r.country !== "") {
              superKey += r.country;
            }
            superKey += i + 1;


            if (newDataGeo[superKey]) {
              newDataGeo[superKey]['grossClicks'] += r.grossClicks;
              newDataGeo[superKey]['grossConversions'] += r.grossConversions;
              newDataGeo[superKey]['grossRevenue'] += r.grossRevenue;


            } else {
              newDataGeo[superKey] = r;
            }
            if (r.grossClicks == 0) {
              newDataGeo[superKey]['converionCR'] += 0;
            } else {
              let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
              newDataGeo[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
            }
            newDataGeo[superKey]['grossInstall'] += r.grossConversions;
          }
          const data_obj_to_arr_geo = Object.values(newDataGeo);
          // const newArrDataByInstallGeo = data_obj_to_arr_geo.sort((a, b) => b.grossInstall - a.grossInstall).slice(0, 4);
          const newArrDataByClickGeo = data_obj_to_arr_geo.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 5);
          // const newArrDataByConversionCRGeo = data_obj_to_arr_geo.sort((a, b) => b.converionCR - a.converionCR).slice(0, 4);
          // const newArrDataBySpentGeo = data_obj_to_arr_geo.sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 4);

          // const objFilterDataTopGeo = { "install": newArrDataByInstallGeo, "click": newArrDataByClickGeo, "conversionCR": newArrDataByConversionCRGeo, "spent": newArrDataBySpentGeo };

          const objFilterDataTopGeo = newArrDataByClickGeo

          // const response = { 'success': true, 'topsource': objFilterDataTopsource, 'topgeo': objFilterDataTopGeo };
          // res.status(200).send(response);
          // return

          // console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryString + "&zone=Asia/Kolkata");

          axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryString + "&zone=Asia/Kolkata", axios_header).then((staticsRes) => {
            if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

              var reportData = [];
              if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
                const advArrData = staticsRes.data.records;
                for (let j = 0; j < advArrData.length; j++) {
                  let advTrkData = advArrData[j];


                  let offer_name = advTrkData.campaign_name.replace("AL-", "");

                  //console.log(adv_array[advTrkData.advertiser_id]);

                  // console.log(adv_array);

                  if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                    var advertiser_name = adv_array[advTrkData.advertiser_id];
                  } else {
                    var advertiser_name = advTrkData.advertiser;
                  }

                  if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                    var publisher_name = pub_array[advTrkData.publisher_id];
                  } else {
                    var publisher_name = "";
                  }

                  if (publisher_name) {
                    reportData.push({
                      "campaign_name": offer_name,
                      "campaign_id": advTrkData.campaign_id,
                      "advertiser": advertiser_name,
                      "advertiser_id": advTrkData.advertiser_id,
                      "publisher_id": advTrkData.publisher_id,
                      publisher_name,
                      "grossClicks": advTrkData.grossClicks,
                      "grossConversions": advTrkData.grossConversions,
                      "grossRevenue": advTrkData.grossRevenue,
                      "converionCR": 0,
                      "grossInstall": 0
                    });
                  }
                }
              }

              var newData = {};
              for (let i = 0; i < reportData.length; i++) {
                let r = reportData[i];

                var superKey = "";
                if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
                  superKey += r.campaign_name;
                }
                if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
                  superKey += r.advertiser;
                }
                if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
                  superKey += r.advertiser_id;
                }
                if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
                  superKey += r.campaign_status;
                }
                if (typeof r.publisher_id !== 'undefined' && r.publisher_id !== "") {
                  superKey += r.publisher_id;
                }
                superKey += i + 1;

                if (newData[superKey]) {
                  newData[superKey]['grossClicks'] += r.grossClicks;
                  newData[superKey]['grossConversions'] += r.grossConversions;
                  newData[superKey]['grossRevenue'] += r.grossRevenue;
                } else {
                  newData[superKey] = r;
                }
                if (r.grossClicks == 0) {
                  newData[superKey]['converionCR'] += 0;
                } else {
                  let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
                  newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
                }
                newData[superKey]['grossInstall'] += r.grossConversions;
              }

              const data_obj_to_arr = Object.values(newData);
              // const newArrDataByInstall = data_obj_to_arr.sort((a, b) => b.grossInstall - a.grossInstall).slice(0, 4);
              const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 5);
              // const newArrDataByConversionCR = data_obj_to_arr.sort((a, b) => b.converionCR - a.converionCR).slice(0, 4);
              // const newArrDataBySpent = data_obj_to_arr.sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 4);

              //const objFilterDataTopsource = { "install": newArrDataByInstall, "click": newArrDataByClick, "conversionCR": newArrDataByConversionCR, "spent": newArrDataBySpent };

              //console.log(objFilterDataTopAppsource);
              if (Array.isArray(objFilterDataTopAppsource) && objFilterDataTopAppsource.length > 0) {
                var objFilterDataTopsource = objFilterDataTopAppsource;
              } else {
                var objFilterDataTopsource = newArrDataByClick;
              }
              // const response = { 'success': true, 'topsource': objFilterDataTopsource, 'topgeo': objFilterDataTopGeo };
              // res.status(200).send(response);
              // return;

              // START GET DATA BY GEO
              axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&zone=Asia/Kolkata", axios_header).then((staticsResByEvent) => {
                if (typeof staticsResByEvent.statusText !== 'undefined' && staticsResByEvent.statusText == "OK") {

                  var reportDataEvent = [];
                  if (Array.isArray(staticsResByEvent.data.records) && staticsResByEvent.data.records.length > 0) {
                    const advArrDataEvent = staticsResByEvent.data.records;

                    for (let j = 0; j < advArrDataEvent.length; j++) {
                      let advTrkDataEvent = advArrDataEvent[j];


                      let offer_name = advTrkDataEvent.campaign_name.replace("AL-", "");

                      //console.log(adv_array[advTrkDataEvent.advertiser_id]);

                      // console.log(adv_array);

                      if (adv_array.hasOwnProperty(advTrkDataEvent.advertiser_id)) {
                        var advertiser_name = adv_array[advTrkDataEvent.advertiser_id];
                      } else {
                        var advertiser_name = advTrkDataEvent.advertiser;
                      }

                      reportDataEvent.push({
                        "campaign_name": offer_name,
                        "campaign_id": advTrkDataEvent.campaign_id,
                        "advertiser": advertiser_name,
                        "advertiser_id": advTrkDataEvent.advertiser_id,
                        "goal_name": advTrkDataEvent.goal_name,
                        "grossClicks": advTrkDataEvent.grossClicks,
                        "grossConversions": advTrkDataEvent.grossConversions,
                        "grossRevenue": advTrkDataEvent.grossRevenue,
                        "converionCR": 0,
                        "grossInstall": 0
                      });
                    }
                  }


                  var newDataEvent = {};

                  for (let i = 0; i < reportDataEvent.length; i++) {
                    let r = reportDataEvent[i];

                    var superKey = "";
                    if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
                      superKey += r.campaign_name;
                    }
                    if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
                      superKey += r.advertiser;
                    }
                    if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
                      superKey += r.advertiser_id;
                    }
                    if (typeof r.goal_name !== 'undefined' && r.goal_name !== "") {
                      superKey += r.goal_name;
                    }
                    superKey += i + 1;


                    if (newDataEvent[superKey]) {
                      newDataEvent[superKey]['grossClicks'] += r.grossClicks;
                      newDataEvent[superKey]['grossConversions'] += r.grossConversions;
                      newDataEvent[superKey]['grossRevenue'] += r.grossRevenue;
                    } else {
                      newDataEvent[superKey] = r;
                    }
                    if (r.grossClicks == 0) {
                      newDataEvent[superKey]['converionCR'] += 0;
                    } else {
                      let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
                      newDataEvent[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
                    }
                    newDataEvent[superKey]['grossInstall'] += r.grossConversions;
                  }

                  const data_obj_to_arr_event = Object.values(newDataEvent);
                  // const newArrDataByInstallEvent = data_obj_to_arr_event.sort((a, b) => b.grossInstall - a.grossInstall).slice(0, 100);
                  const newArrDataByClickEvent = data_obj_to_arr_event.sort((a, b) => b.grossClicks - a.grossClicks).slice();
                  // const newArrDataByConversionCREvent = data_obj_to_arr_event.sort((a, b) => b.converionCR - a.converionCR).slice(0, 100);
                  // const newArrDataBySpentEvent = data_obj_to_arr_event.sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 100);
                  // const objFilterDataTopEvent = { "install": newArrDataByInstallEvent, "click": newArrDataByClickEvent, "conversionCR": newArrDataByConversionCREvent, "spent": newArrDataBySpentEvent };

                  const objFilterDataTopEvent = newArrDataByClickEvent;

                  const response = { 'success': true, 'topsource': objFilterDataTopsource, 'topgeo': objFilterDataTopGeo, 'offerevent': objFilterDataTopEvent };
                  res.status(200).send(response);
                  return;
                } else {
                  const resMsg = { "success": false, "message": "No records found" };
                  res.status(200).send(resMsg);
                  return;
                }

              }).catch(err => {
                console.log(err);
                const errMsg = { "success": false, "errors": err.response.data.errors };
                res.status(400).send(errMsg);
                return;
              });
              // END GET DATA BY GEO

            } else {
              const resMsg = { "success": false, "message": "No records found" };
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
          const resMsg = { "success": false, "message": "No records found" };
          res.status(200).send(resMsg);
          return;
        }

      }).catch(err => {
        console.log(err);
        const errMsg = { "success": false, "errors": err.response.data.errors };
        res.status(400).send(errMsg);
        return;
      });
      // END GET DATA BY GEO

    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });

};



// Get Statics Data
exports.quickViewDataPerandEvent = async (req, res) => {

  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'start', 3: 'end' };
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
  const { offer_id, start, end } = req.body;

  // Validate request
  if (!offer_id || !start || !end) {
    var requestVal = "";
    if (!offer_id) {
      var requestVal = "offer_id";
    } else if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  let newQueryString = querystring.stringify(req.body);

  var endpoint = "reports/custom"


  newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");

  var adv_array = {};
  var SDK_array = {};
  var DIRECT_array = {};

  // get all advertisers
  Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryString + "&zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryString + "&zone=Asia/Kolkata", axios_header).then((staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var reportData = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;
        for (let j = 0; j < advArrData.length; j++) {
          let advTrkData = advArrData[j];


          let offer_name = advTrkData.campaign_name.replace("AL-", "");

          //console.log(adv_array[advTrkData.advertiser_id]);

          // console.log(adv_array);

          if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkData.advertiser_id];
          } else {
            var advertiser_name = advTrkData.advertiser;
          }

          reportData.push({
            "campaign_name": offer_name,
            "campaign_id": advTrkData.campaign_id,
            "advertiser": advertiser_name,
            "advertiser_id": advTrkData.advertiser_id,
            "date": advTrkData.created,
            "grossClicks": advTrkData.grossClicks,
            "grossConversions": advTrkData.grossConversions,
            "grossRevenue": advTrkData.grossRevenue,
            "converionCR": 0,
            "grossInstall": 0
          });
        }
      }

      var newData = {};

      for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];


        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.date !== 'undefined' && r.date !== "") {
          superKey += r.date;
        }
        superKey += i + 1;

        if (newData[superKey]) {
          newData[superKey]['grossClicks'] += r.grossClicks;
          newData[superKey]['grossConversions'] += r.grossConversions;
          newData[superKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newData[superKey] = r;
        }
        if (r.grossClicks == 0) {
          newData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }
        newData[superKey]['grossInstall'] += r.grossConversions;
      }

      const data_obj_to_arr = Object.values(newData);
      // const newArrDataByInstall = data_obj_to_arr.sort((a, b) => b.grossInstall - a.grossInstall).slice(0, 5000);
      const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();
      // const newArrDataByConversionCR = data_obj_to_arr.sort((a, b) => b.converionCR - a.converionCR).slice(0, 5000);
      // const newArrDataBySpent = data_obj_to_arr.sort((a, b) => b.grossRevenue - a.grossRevenue).slice(0, 5000);

      // const objFilterDataTopsource = { "install": newArrDataByInstall, "click": newArrDataByClick, "conversionCR": newArrDataByConversionCR, "spent": newArrDataBySpent };
      const objFilterDataTopsource = newArrDataByClick;


      const response = { 'success': true, 'performance': objFilterDataTopsource };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err.response.data.errors };
    res.status(400).send(errMsg);
    return;
  });

};


exports.dashboardSourceGeo = async (req, res) => {

  var adv_array = {};
  var pub_array = {};
  var off_geo_array = {};
  var SDK_array = {};
  var DIRECT_array = {};
  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'adv_id', 3: 'start', 4: 'end' };
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
  const { offer_id, adv_id, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  var direct_str = "";
  // get DIRECT Offer
  try {
    const all_DIRECT = await Offer.find({ '$and': [{ 'source_type': "DIRECT" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
    if (all_DIRECT) {
      for (let p = 0; p < all_DIRECT.length; p++) {
        let DIRECT = all_DIRECT[p];
        DIRECT_array[DIRECT.trackier_camp_id] = DIRECT.trackier_camp_id;
        direct_str += ("camp_ids[]=" + DIRECT.trackier_camp_id + "&");
      }
    }
  } catch (error) {
    console.error(error);
  }
  var newQueryStrings = querystring.stringify(req.body);
  delete req.body.offer_id;
  var newQueryString = querystring.stringify(req.body);

  const endpoint = "reports/custom";



  var adv_str = "";
  if (Array.isArray(offer_id) && offer_id.length > 0) {
    newQueryString = newQueryString.replace("adv_id=&", "");
    for (let m = 0; m < offer_id.length; m++) {
      if (DIRECT_array.hasOwnProperty(offer_id[m])) {
        newQueryString += ("&camp_ids[]=" + offer_id[m] + "&");
      }
    }
    //newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
  } else {
    newQueryString = newQueryString + "&" + direct_str;
    if (adv_id) {
      newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
    }
  }

  // console.log(adv_str);
  // console.log(newQueryString);
  // process.exit();


  // get all advertisers
  Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all publishers
  Publishers.find({}).sort({ _id: 1 }).exec().then((all_pub) => {
    if (all_pub) {
      for (let k = 0; k < all_pub.length; k++) {
        let pub = all_pub[k];
        pub_array[pub.pub_id] = ucfirst(pub.pub_name);
      }
    }
  }).catch(error => {
    console.error(error);
  });


  // get all Offer GEO with offer id
  Offer.find({}).sort({ _id: 1 }).exec().then((all_off_geo) => {
    if (all_off_geo) {
      for (let k = 0; k < all_off_geo.length; k++) {
        let off_geo = all_off_geo[k];
        off_geo_array[off_geo.trackier_camp_id] = ucfirst(off_geo.country);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then(async (staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var adv_str = "";
      if (Array.isArray(offer_id) && offer_id.length > 0) {
        newQueryStrings = newQueryStrings.replace("adv_id=&", "");
        newQueryStrings = newQueryStrings.replaceAll("offer_id", "camp_ids[]");
      } else {
        if (adv_id) {
          newQueryStrings = newQueryStrings.replaceAll("adv_id", "adv_ids[]");
        } else {
          newQueryStrings = newQueryStrings.replace("adv_id=&", "");
          await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
            if (advertisers) {
              for (let i = 0; i < advertisers.length; i++) {
                let adv = advertisers[i];
                if (adv.tid > 0) {
                  adv_str += ("adv_ids[]=" + adv.tid + "&");
                }
              }
            }
          }).catch(error => {
            console.error(error);
          });
        }
      }

      var reportData = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;
        for (let j = 0; j < advArrData.length; j++) {
          let advTrkData = advArrData[j];


          let offer_name = advTrkData.campaign_name.replace("AL-", "");

          if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkData.advertiser_id];
          } else {
            var advertiser_name = advTrkData.advertiser;
          }

          if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
            var publisher_name = pub_array[advTrkData.publisher_id];
          } else {
            var publisher_name = "";
          }

          if (publisher_name) {
            reportData.push({
              "campaign_name": offer_name,
              "campaign_id": advTrkData.campaign_id,
              "advertiser": advertiser_name,
              "advertiser_id": advTrkData.advertiser_id,
              "publisher_id": advTrkData.publisher_id,
              publisher_name,
              "grossClicks": advTrkData.grossClicks,
              "grossConversions": advTrkData.grossConversions,
              "grossRevenue": advTrkData.grossRevenue,
              "converionCR": 0,
              "grossInstall": 0
            });
          }

        }
      }

      var newData = {};
      for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.publisher_id !== 'undefined' && r.publisher_id !== "") {
          superKey += r.publisher_id;
        }
        superKey += i + 1;

        if (newData[superKey]) {
          newData[superKey]['grossClicks'] += r.grossClicks;
          newData[superKey]['grossConversions'] += r.grossConversions;
          newData[superKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newData[superKey] = r;
        }
        if (r.grossClicks == 0) {
          newData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }
        newData[superKey]['grossInstall'] += r.grossConversions;
      }

      const data_obj_to_arr = Object.values(newData);
      const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 10);
      const objFilterDataTopsource = newArrDataByClick;

      // START GET DATA BY GEO
      //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryStrings + "&" + adv_str + "zone=Asia/Kolkata");

      axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryStrings + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsResByGeo) => {
        if (typeof staticsResByGeo.statusText !== 'undefined' && staticsResByGeo.statusText == "OK") {

          var reportDataGeo = [];
          if (Array.isArray(staticsResByGeo.data.records) && staticsResByGeo.data.records.length > 0) {
            const advArrDataGeo = staticsResByGeo.data.records;

            for (let j = 0; j < advArrDataGeo.length; j++) {
              let advTrkDataGeo = advArrDataGeo[j];


              let offer_name = advTrkDataGeo.campaign_name.replace("AL-", "");

              //console.log(adv_array[advTrkDataGeo.advertiser_id]);

              //console.log(adv_array);

              if (adv_array.hasOwnProperty(advTrkDataGeo.advertiser_id)) {
                var advertiser_name = adv_array[advTrkDataGeo.advertiser_id];
              } else {
                var advertiser_name = advTrkDataGeo.advertiser;
              }

              if (off_geo_array.hasOwnProperty(advTrkDataGeo.campaign_id)) {
                var country_name = off_geo_array[advTrkDataGeo.campaign_id];
              } else {
                var country_name = "";
              }
              const geoArr = country_name.split(",");
              if (geoArr.includes(advTrkDataGeo.country)) {
                reportDataGeo.push({
                  "campaign_name": offer_name,
                  "campaign_id": advTrkDataGeo.campaign_id,
                  "advertiser": advertiser_name,
                  "advertiser_id": advTrkDataGeo.advertiser_id,
                  "country": advTrkDataGeo.country,
                  "grossClicks": advTrkDataGeo.grossClicks,
                  "grossConversions": advTrkDataGeo.grossConversions,
                  "grossRevenue": advTrkDataGeo.grossRevenue,
                  "converionCR": 0,
                  "grossInstall": 0
                });
              }
            }
          }

          var newDataGeo = {};


          for (let i = 0; i < reportDataGeo.length; i++) {
            let r = reportDataGeo[i];


            var superKey = "";
            if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
              superKey += r.campaign_name;
            }
            if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
              superKey += r.advertiser;
            }
            if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
              superKey += r.advertiser_id;
            }
            if (typeof r.country !== 'undefined' && r.country !== "") {
              superKey += r.country;
            }
            superKey += i + 1;


            if (newDataGeo[superKey]) {
              newDataGeo[superKey]['grossClicks'] += r.grossClicks;
              newDataGeo[superKey]['grossConversions'] += r.grossConversions;
              newDataGeo[superKey]['grossRevenue'] += r.grossRevenue;


            } else {
              newDataGeo[superKey] = r;
            }
            if (r.grossClicks == 0) {
              newDataGeo[superKey]['converionCR'] += 0;
            } else {
              let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
              newDataGeo[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
            }
            newDataGeo[superKey]['grossInstall'] += r.grossConversions;
          }
          const data_obj_to_arr_geo = Object.values(newDataGeo);
          const newArrDataByClickGeo = data_obj_to_arr_geo.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 10);
          const objFilterDataTopGeo = newArrDataByClickGeo

          const response = { 'success': true, 'topsource': objFilterDataTopsource, 'topgeo': objFilterDataTopGeo };
          res.status(200).send(response);
          return
        } else {
          const resMsg = { "success": false, "message": "No records found" };
          res.status(200).send(resMsg);
          return;
        }
      }).catch(err => {
        console.log(err);
        const errMsg = { "success": false, "errors": err.response.data.errors };
        res.status(400).send(errMsg);
        return;
      });
      // END GET DATA BY GEO

    } else {
      const resMsg = { "success": false, "message": "No records found" };
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

exports.dashboardSourceAppList = async (req, res) => {
  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'adv_id', 3: 'start', 4: 'end' };
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
  const { offer_id, adv_id, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };
  var newQueryString = querystring.stringify(req.body);
  const endpoint = "reports/custom";


  var adv_str = "";
  if (Array.isArray(offer_id) && offer_id.length > 0) {
    newQueryString = newQueryString.replace("adv_id=&", "");
    newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
  } else {
    if (adv_id) {
      newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
    } else {
      newQueryString = newQueryString.replace("adv_id=&", "");
      await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
        if (advertisers) {
          for (let i = 0; i < advertisers.length; i++) {
            let adv = advertisers[i];
            if (adv.tid > 0) {
              adv_str += ("adv_ids[]=" + adv.tid + "&");
            }
          }
        }
      }).catch(error => {
        console.error(error);
      });
    }
  }

  // console.log(adv_str);
  // console.log(newQueryString);
  // process.exit();

  var adv_array = {};
  var app_array = {};

  // get all advertisers
  Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  // get all app name
  await Applist.find({}).sort({ _id: 1 }).exec().then((all_Applist) => {
    if (all_Applist) {
      for (let m = 0; m < all_Applist.length; m++) {
        let app = all_Applist[m];
        app_array[app.AppBundle] = app.App_Name + "||" + app.Category + "||" + app.CTR;
      }
    }
  }).catch(error => {
    console.error(error);
  })


  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var reportData = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;
        for (let j = 0; j < advArrData.length; j++) {
          let advTrkData = advArrData[j];


          let offer_name = advTrkData.campaign_name.replace("AL-", "");

          if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkData.advertiser_id];
          } else {
            var advertiser_name = advTrkData.advertiser;
          }

          var app_name = "";
          if (app_array.hasOwnProperty(advTrkData.app_name)) {
            let appNameSplit = app_array[advTrkData.app_name].split("||");
            app_name = appNameSplit[0];
          } else {
            app_name = advTrkData.app_name;
          }


          if (app_name) {
            reportData.push({
              "campaign_name": offer_name,
              "campaign_id": advTrkData.campaign_id,
              "advertiser": advertiser_name,
              "advertiser_id": advTrkData.advertiser_id,
              "publisher_id": advTrkData.publisher_id,
              app_name,
              "grossClicks": advTrkData.grossClicks,
              "grossConversions": advTrkData.grossConversions,
              "grossRevenue": advTrkData.grossRevenue,
              "converionCR": 0,
              "grossInstall": 0
            });
          }

        }
      }

      var newData = {};
      for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.app_name !== 'undefined' && r.app_name !== "") {
          superKey += r.app_name;
        }
        superKey += i + 1;

        if (newData[superKey]) {
          newData[superKey]['grossClicks'] += r.grossClicks;
          newData[superKey]['grossConversions'] += r.grossConversions;
          newData[superKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newData[superKey] = r;
        }
        if (r.grossClicks == 0) {
          newData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }
        newData[superKey]['grossInstall'] += r.grossConversions;
      }

      const data_obj_to_arr = Object.values(newData);
      const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 10);
      const objFilterDataTopsourceApp = newArrDataByClick;

      const response = { 'success': true, 'topsourceapp': objFilterDataTopsourceApp };
      res.status(200).send(response);
      return

    } else {
      const resMsg = { "success": false, "message": "No records found" };
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
function groupBy(objectArray, property) {
  return objectArray.reduce(function (acc, obj) {
    var key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}


exports.dashboardPerformanceEvent = async (req, res) => {
  var adv_array = {};


  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'adv_id', 3: 'start', 4: 'end' };
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
  const { offer_id, adv_id, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const advertiserId = parseInt(req.query.advertiserId);
  var newQueryString = querystring.stringify(req.body);


  var dt_start = start;
  var dateSarray = dt_start.split("-");
  var startDate = `${dateSarray[2]}/${dateSarray[1]}/${dateSarray[0]}`;

  var dt_end = end;
  var dateEarray = dt_end.split("-");
  var endDate = `${dateEarray[2]}/${dateEarray[1]}/${dateEarray[0]}`;

  var one_day = 1000 * 60 * 60 * 24;
  var x = startDate.split("/");
  var y = endDate.split("/");
  var date1 = new Date(x[2], (x[1] - 1), x[0]);
  var date2 = new Date(y[2], (y[1] - 1), y[0])

  var _Diff = Math.ceil((date2.getTime() - date1.getTime()) / (one_day));

  recentPreviousDate = new Array(parseInt(_Diff + 2)).fill().map((_, index) => {
    return new Date(new Date(start).setDate(new Date(start).getDate() - index))
      .toISOString()
  });
  let endPreviousDate = recentPreviousDate[1];
  let endPreviousDateR = endPreviousDate.replace("T00:00:00.000Z", "");

  let startPreviousDate = recentPreviousDate.pop();
  let startPreviousDateR = startPreviousDate.replace("T00:00:00.000Z", "");

  const datePData = `start=${startPreviousDateR}&end=${endPreviousDateR}&`

  delete req.body.start;
  delete req.body.end;
  var newQueryStrings = querystring.stringify(req.body);


  const endpoint = "reports/custom";

  var adv_str = "";
  if (advertiserId) {
    adv_str += "adv_ids[]=" + advertiserId + "&";
    if (Array.isArray(offer_id) && offer_id.length > 0) {
      newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
      newQueryStrings = newQueryStrings.replaceAll("offer_id", "camp_ids[]");
    }
  } else {
    if (Array.isArray(offer_id) && offer_id.length > 0) {
      newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
      newQueryStrings = newQueryStrings.replaceAll("offer_id", "camp_ids[]");
      if (Array.isArray(adv_id) && adv_id.length > 0) {
        newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
        newQueryStrings = newQueryStrings.replaceAll("adv_id", "adv_ids[]");
      }
    } else {
      if (Array.isArray(adv_id) && adv_id.length > 0) {
        newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
        newQueryStrings = newQueryStrings.replaceAll("adv_id", "adv_ids[]");
      } else {
        await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
          if (advertisers) {
            for (let i = 0; i < advertisers.length; i++) {
              let adv = advertisers[i];
              if (adv.tid > 0) {
                adv_str += ("adv_ids[]=" + adv.tid + "&");
              }
            }
          }
        }).catch(error => {
          console.error(error);
        });
      }
    }
  }

  // get all advertisers
  await Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryStrings + "&" + adv_str + datePData + "zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryStrings + "&" + adv_str + "&" + datePData + "zone=Asia/Kolkata", axios_header).then((staticsPRes) => {
    if (typeof staticsPRes.statusText !== 'undefined' && staticsPRes.statusText == "OK") {

      var reportPData = [];
      if (Array.isArray(staticsPRes.data.records) && staticsPRes.data.records.length > 0) {
        const arrPData = staticsPRes.data.records;
        for (let j = 0; j < arrPData.length; j++) {
          let advTrkPData = arrPData[j];

          reportPData.push({
            "date": advTrkPData.created,
            "goal_name": advTrkPData.goal_name,
            "grossClicks": advTrkPData.grossClicks,
            "grossConversions": advTrkPData.grossConversions,
            "grossRevenue": advTrkPData.grossRevenue,
            "converionCR": 0,
            "grossInstall": 0
          });
        }
      }

      var newpData = {};

      for (let i = 0; i < reportPData.length; i++) {
        let r = reportPData[i];


        var superPKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superPKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superPKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superPKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superPKey += r.campaign_status;
        }
        if (typeof r.date !== 'undefined' && r.date !== "") {
          superPKey += r.date;
        }
        superPKey += i + 1;

        if (newpData[superPKey]) {
          newpData[superPKey]['grossClicks'] += r.grossClicks;
          newpData[superPKey]['grossConversions'] += r.grossConversions;
          newpData[superPKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newpData[superPKey] = r;
        }
        if (r.grossClicks == 0) {
          newpData[superPKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newpData[superPKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }

        if (r.goal_name == 'install') {
          newpData[superPKey]['grossInstall'] += r.grossConversions;
        } else {
          newpData[superPKey]['grossInstall'] += 0;
        }
      }

      const data_obj_p_to_arr = Object.values(newpData);
      const newArrPDataByClick = data_obj_p_to_arr.sort((a, b) => new Date(a.date) - new Date(b.date));
      const objFilterPData = newArrPDataByClick;

      //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

      axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=created&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsRes) => {
        if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

          var reportData = [];
          if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
            const advArrData = staticsRes.data.records;
            for (let j = 0; j < advArrData.length; j++) {
              let advTrkData = advArrData[j];
              reportData.push({
                "date": advTrkData.created,
                "goal_name": advTrkData.goal_name,
                "grossClicks": advTrkData.grossClicks,
                "grossConversions": advTrkData.grossConversions,
                "grossRevenue": advTrkData.grossRevenue,
                "converionCR": 0,
                "grossInstall": 0
              });
            }
          }

          var newData = {};

          for (let i = 0; i < reportData.length; i++) {
            let r = reportData[i];


            var superKey = "";
            if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
              superKey += r.campaign_name;
            }
            if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
              superKey += r.advertiser;
            }
            if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
              superKey += r.advertiser_id;
            }
            if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
              superKey += r.campaign_status;
            }
            if (typeof r.date !== 'undefined' && r.date !== "") {
              superKey += r.date;
            }
            superKey += i + 1;

            if (newData[superKey]) {
              newData[superKey]['grossClicks'] += r.grossClicks;
              newData[superKey]['grossConversions'] += r.grossConversions;
              newData[superKey]['grossRevenue'] += r.grossRevenue;
            } else {
              newData[superKey] = r;
            }
            if (r.grossClicks == 0) {
              newData[superKey]['converionCR'] += 0;
            } else {
              let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
              newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
            }
            if (r.goal_name == 'install') {
              newData[superKey]['grossInstall'] += r.grossConversions;
            } else {
              newData[superKey]['grossInstall'] += 0;
            }
          }

          const data_obj_to_arr = Object.values(newData);
          const newArrDataByClick = data_obj_to_arr.sort((a, b) => new Date(a.date) - new Date(b.date));
          const objFilterDataPerformance = newArrDataByClick;


          //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");


          axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsResByEvent) => {
            if (typeof staticsResByEvent.statusText !== 'undefined' && staticsResByEvent.statusText == "OK") {

              var reportDataEvent = [];
              if (Array.isArray(staticsResByEvent.data.records) && staticsResByEvent.data.records.length > 0) {
                const advArrDataEvent = staticsResByEvent.data.records;

                for (let j = 0; j < advArrDataEvent.length; j++) {
                  let advTrkDataEvent = advArrDataEvent[j];

                  let offer_name = advTrkDataEvent.campaign_name.replace("AL-", "");

                  if (adv_array.hasOwnProperty(advTrkDataEvent.advertiser_id)) {
                    var advertiser_name = adv_array[advTrkDataEvent.advertiser_id];
                  } else {
                    var advertiser_name = advTrkDataEvent.advertiser;
                  }

                  reportDataEvent.push({
                    "campaign_name": offer_name,
                    "campaign_id": advTrkDataEvent.campaign_id,
                    "advertiser": advertiser_name,
                    "advertiser_id": advTrkDataEvent.advertiser_id,
                    "goal_name": advTrkDataEvent.goal_name,
                    "grossClicks": advTrkDataEvent.grossClicks,
                    "grossConversions": advTrkDataEvent.grossConversions,
                    "grossRevenue": advTrkDataEvent.grossRevenue,
                    "converionCR": 0,
                    "grossInstall": 0
                  });
                }
              }

              var newDataEvent = {};

              for (let i = 0; i < reportDataEvent.length; i++) {
                let r = reportDataEvent[i];

                var superKey = "";
                if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
                  superKey += r.campaign_name;
                }
                if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
                  superKey += r.advertiser;
                }
                if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
                  superKey += r.advertiser_id;
                }
                if (typeof r.goal_name !== 'undefined' && r.goal_name !== "") {
                  superKey += r.goal_name;
                }
                superKey += i + 1;


                if (newDataEvent[superKey]) {
                  newDataEvent[superKey]['grossClicks'] += r.grossClicks;
                  newDataEvent[superKey]['grossConversions'] += r.grossConversions;
                  newDataEvent[superKey]['grossRevenue'] += r.grossRevenue;
                } else {
                  newDataEvent[superKey] = r;
                }
                if (r.grossClicks == 0) {
                  newDataEvent[superKey]['converionCR'] += 0;
                } else {
                  let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
                  newDataEvent[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
                }
                if (r.goal_name == 'install') {
                  newDataEvent[superKey]['grossInstall'] += r.grossConversions;
                } else {
                  newDataEvent[superKey]['grossInstall'] += 0;
                }
              }

              const data_obj_to_arr_event = Object.values(newDataEvent);
              const newArrDataByClickEvent = data_obj_to_arr_event.sort((a, b) => b.grossConversions - a.grossConversions).slice();
              const objFilterDataTopEvent = newArrDataByClickEvent;

              const groupedGolaName = groupBy(objFilterDataTopEvent, 'goal_name');

              let array1 = objFilterPData,
                result1 = Object.values(array1.reduce((a, { date, grossClicks, grossConversions, grossRevenue, converionCR, grossInstall }) => {
                  a[date] = (a[date] || { date, grossClicks: 0, grossConversions: 0, grossRevenue: 0, converionCR: 0, grossInstall: 0 });
                  a[date].grossClicks = Number(a[date].grossClicks) + Number(grossClicks);
                  a[date].grossConversions = Number(a[date].grossConversions) + Number(grossConversions);
                  a[date].grossRevenue = Number(a[date].grossRevenue) + Number(grossRevenue);
                  a[date].converionCR = Number(a[date].converionCR) + Number(converionCR);
                  a[date].grossInstall = Number(a[date].grossInstall) + Number(grossInstall);
                  return a;
                }, {}));


              let array2 = objFilterDataPerformance,
                result2 = Object.values(array2.reduce((a, { date, grossClicks, grossConversions, grossRevenue, converionCR, grossInstall }) => {
                  a[date] = (a[date] || { date, grossClicks: 0, grossConversions: 0, grossRevenue: 0, converionCR: 0, grossInstall: 0 });
                  a[date].grossClicks = Number(a[date].grossClicks) + Number(grossClicks);
                  a[date].grossConversions = Number(a[date].grossConversions) + Number(grossConversions);
                  a[date].grossRevenue = Number(a[date].grossRevenue) + Number(grossRevenue);
                  a[date].converionCR = Number(a[date].converionCR) + Number(converionCR);
                  a[date].grossInstall = Number(a[date].grossInstall) + Number(grossInstall);
                  return a;
                }, {}));



              const response = { 'success': true, 'performancePast': result1, 'performance': result2.sort(), 'offerevent': objFilterDataTopEvent, 'goalWithOffers': groupedGolaName };
              res.status(200).send(response);
              return;

            } else {
              const resMsg = { "success": false, "message": "No records found" };
              res.status(200).send(resMsg);
              return;
            }

          }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
          });
          // END GET DATA BY GEO
        } else {
          const resMsg = { "success": false, "message": "No records found" };
          res.status(200).send(resMsg);
          return;
        }

      }).catch(err => {
        console.log(err);
        const errMsg = { "success": false, "errors": err };
        res.status(400).send(errMsg);
        return;
      });
      // End PERFOMANCE FIRST

    } else {
      const resMsg = { "success": false, "message": "No records found" };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err };
    res.status(400).send(errMsg);
    return;
  });
}


exports.dashboardTopHeader = async (req, res) => {
  var adv_array = {};


  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'adv_id', 3: 'start', 4: 'end' };
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
  const { offer_id, adv_id, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const advertiserId = parseInt(req.query.advertiserId);
  var newQueryString = querystring.stringify(req.body);



  var dt_start = start;
  var dateSarray = dt_start.split("-");
  var startDate = `${dateSarray[2]}/${dateSarray[1]}/${dateSarray[0]}`;

  var dt_end = end;
  var dateEarray = dt_end.split("-");
  var endDate = `${dateEarray[2]}/${dateEarray[1]}/${dateEarray[0]}`;

  var one_day = 1000 * 60 * 60 * 24;
  var x = startDate.split("/");
  var y = endDate.split("/");
  var date1 = new Date(x[2], (x[1] - 1), x[0]);
  var date2 = new Date(y[2], (y[1] - 1), y[0])

  var _Diff = Math.ceil((date2.getTime() - date1.getTime()) / (one_day));

  recentPreviousDate = new Array(parseInt(_Diff + 2)).fill().map((_, index) => {
    return new Date(new Date(start).setDate(new Date(start).getDate() - index))
      .toISOString()
  });
  let endPreviousDate = recentPreviousDate[1];
  let endPreviousDateR = endPreviousDate.replace("T00:00:00.000Z", "");

  let startPreviousDate = recentPreviousDate.pop();
  let startPreviousDateR = startPreviousDate.replace("T00:00:00.000Z", "");

  const datePData = `start=${startPreviousDateR}&end=${endPreviousDateR}&`

  delete req.body.start;
  delete req.body.end;
  var newQueryStrings = querystring.stringify(req.body);


  const endpoint = "reports/custom";

  var adv_str = "";
  if (advertiserId) {
    adv_str += "adv_ids[]=" + advertiserId + "&";
    if (Array.isArray(offer_id) && offer_id.length > 0) {
      newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
      newQueryStrings = newQueryStrings.replaceAll("offer_id", "camp_ids[]");
    }
  } else {
    if (Array.isArray(offer_id) && offer_id.length > 0) {
      newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
      newQueryStrings = newQueryStrings.replaceAll("offer_id", "camp_ids[]");
      if (Array.isArray(adv_id) && adv_id.length > 0) {
        newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
        newQueryStrings = newQueryStrings.replaceAll("adv_id", "adv_ids[]");
      }
    } else {
      if (Array.isArray(adv_id) && adv_id.length > 0) {
        newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
        newQueryStrings = newQueryStrings.replaceAll("adv_id", "adv_ids[]");
      } else {
        await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
          if (advertisers) {
            for (let i = 0; i < advertisers.length; i++) {
              let adv = advertisers[i];
              if (adv.tid > 0) {
                adv_str += ("adv_ids[]=" + adv.tid + "&");
              }
            }
          }
        }).catch(error => {
          console.error(error);
        });
      }
    }
  }

  // get all advertisers
  await Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });


  // GET DATA BY TOP OFFER STATUS TOTAL ACTIVE PENDING ETC

  if (process.env.TIMESTAMP_DIGITS == 10) {
    const currentDateStart = new Date(start + "T23:59:59.053Z");
    const currentDateEnd = new Date(end + "T23:59:59.053Z");

    var currentDateStartVal = parseInt(currentDateStart.getTime() / 1000);
    var currentDateEndVal = parseInt(currentDateEnd.getTime() / 1000);


    const newDatesPrevStart = new Date(startPreviousDateR + "T23:59:59.053Z");
    const newDatesPrevPEnd = new Date(endPreviousDateR + "T23:59:59.053Z");


    var newDatesPrevStartVal = parseInt(newDatesPrevStart.getTime() / 1000);
    var newDatesPrevPEndVal = parseInt(newDatesPrevPEnd.getTime() / 1000);
  } else {

    const currentDateStart = new Date(start + "T23:59:59.053Z");
    const currentDateEnd = new Date(end + "T23:59:59.053Z");


    var currentDateStartVal = currentDateStart.getTime();
    var currentDateEndVal = currentDateEnd.getTime();


    const newDatesPrevStart = new Date(startPreviousDateR + "T23:59:59.053Z");
    const newDatesPrevPEnd = new Date(endPreviousDateR + "T23:59:59.053Z");


    var newDatesPrevStartVal = newDatesPrevStart.getTime();
    var newDatesPrevPEndVal = newDatesPrevPEnd.getTime();
  }




  var totalOffers = 0;
  if (advertiserId) {

    // var filterCurretDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatas2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }] } };


    // var filterPreviousDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let result = await Offer.find({ '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }] }).exec();
      totalOffers = parseInt(result.length);
    } catch (err) {
      console.log(err);
    }

  } else if (Array.isArray(adv_id) && adv_id.length > 0) {

    // var filterCurretDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { trackier_adv_id: { $in: adv_id } }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatas2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { trackier_adv_id: { $in: adv_id } }] } };

    // var filterPreviousDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { trackier_adv_id: { $in: adv_id } }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let result = await Offer.find({ '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { trackier_adv_id: { $in: adv_id } }] }).exec();
      totalOffers = parseInt(result.length);
    } catch (err) {
      console.log(err);
    }
  } else {
    // var filterCurretDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatas2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }] } };


    // var filterPreviousDatas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let result = await Offer.find({ 'trackier_camp_id': { '$ne': 0 } }).exec();
      //console.log(result);
      totalOffers = parseInt(result.length);
    } catch (err) {
      console.log(err);
    }
  }


  const totalActiveCurrentOffer = 0;

  // const offStatusCurrentData = await Offer.aggregate([
  //   filterCurretDatas,
  //   {
  //     '$group': {
  //       '_id': '$status',
  //       'sum': { '$sum': 1 }
  //     }
  //   }
  // ]).sort({ status: -1 }).exec();
  // var totalActiveCurrentOffer = 0;
  // if (Array.isArray(offStatusCurrentData) && offStatusCurrentData.length > 0) {
  //   for (let i = 0; i < offStatusCurrentData.length; i++) {
  //     if (offStatusCurrentData[i]._id == "active") {
  //       var totalActiveCurrentOffer = offStatusCurrentData[i].sum;
  //     }
  //   }
  // }

  // COUNT ALL ACTIVE OFFER
  const offStatusCurrentData2 = await Offer.aggregate([
    filterCurretDatas2,
    {
      '$group': {
        '_id': '$status',
        'sum': { '$sum': 1 }
      }
    }
  ]).sort({ status: -1 }).exec();
  var totalActiveCurrentOffer2 = 0;
  if (Array.isArray(offStatusCurrentData2) && offStatusCurrentData2.length > 0) {
    for (let i = 0; i < offStatusCurrentData2.length; i++) {
      if (offStatusCurrentData2[i]._id == "active") {
        var totalActiveCurrentOffer2 = offStatusCurrentData2[i].sum;
      }
    }
  }

  const totalActivePreviousOffer = 0;
  // const offStatusPreviousData = await Offer.aggregate([
  //   filterPreviousDatas,
  //   {
  //     '$group': {
  //       '_id': '$status',
  //       'sum': { '$sum': 1 }
  //     }
  //   }
  // ]).sort({ status: -1 }).exec();
  // var totalActivePreviousOffer = 0;
  // if (Array.isArray(offStatusPreviousData) && offStatusPreviousData.length > 0) {
  //   for (let i = 0; i < offStatusPreviousData.length; i++) {
  //     if (offStatusPreviousData[i]._id == "active") {
  //       var totalActivePreviousOffer = offStatusPreviousData[i].sum;
  //     }
  //   }
  // }

  // RETARGETING CAMPAING START
  var totalOffersRT = 0;
  if (advertiserId) {

    // var filterCurretDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { 'trackier_adv_id': advertiserId }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatasRT2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { 'trackier_adv_id': advertiserId }] } };

    // var filterPreviousDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { 'trackier_adv_id': advertiserId }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let resultRT = Offer.find({ '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { 'trackier_adv_id': advertiserId }] }).exec();
      totalOffersRT = parseInt(resultRT.length);
    } catch (err) {
      console.log(err);
    }

  } else if (Array.isArray(adv_id) && adv_id.length > 0) {

    // var filterCurretDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { trackier_adv_id: { $in: adv_id } }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatasRT2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { trackier_adv_id: { $in: adv_id } }] } };

    // var filterPreviousDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { trackier_adv_id: { $in: adv_id } }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let resultRT = await Offer.find({ '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { trackier_adv_id: { $in: adv_id } }] }).exec();
      totalOffersRT = parseInt(resultRT.length);
    } catch (err) {
      console.log(err);
    }
  } else {
    // var filterCurretDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { "created_on": { $gte: currentDateStartVal, $lte: currentDateEndVal } }] } };

    var filterCurretDatasRT2 = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }] } };

    // var filterPreviousDatasRT = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'campaign_type': 'RETARGETING' }, { "created_on": { $gte: newDatesPrevStartVal, $lte: newDatesPrevPEndVal } }] } };
    try {
      let resultRT = await Offer.find({ '$and': [{ 'trackier_camp_id': { '$ne': 0 } }, { 'campaign_type': 'RETARGETING' }] }).exec();
      //console.log(resultRT);
      totalOffersRT = parseInt(resultRT.length);
    } catch (err) {
      console.log(err);
    }
  }

  const totalActiveCurrentOfferRT = 0;
  // const offStatusCurrentDataRT = await Offer.aggregate([
  //   filterCurretDatasRT,
  //   {
  //     '$group': {
  //       '_id': '$status',
  //       'sum': { '$sum': 1 }
  //     }
  //   }
  // ]).sort({ status: -1 }).exec();
  // var totalActiveCurrentOfferRT = 0;
  // if (Array.isArray(offStatusCurrentDataRT) && offStatusCurrentDataRT.length > 0) {
  //   for (let i = 0; i < offStatusCurrentDataRT.length; i++) {
  //     if (offStatusCurrentDataRT[i]._id == "active") {
  //       var totalActiveCurrentOfferRT = offStatusCurrentDataRT[i].sum;
  //     }
  //   }
  // }

  // COUNT ALL TOTAL RE-TARGETING ACTIVE OFFER
  const offStatusCurrentDataRT2 = await Offer.aggregate([
    filterCurretDatasRT2,
    {
      '$group': {
        '_id': '$status',
        'sum': { '$sum': 1 }
      }
    }
  ]).sort({ status: -1 }).exec();
  var totalActiveCurrentOfferRT2 = 0;
  if (Array.isArray(offStatusCurrentDataRT2) && offStatusCurrentDataRT2.length > 0) {
    for (let i = 0; i < offStatusCurrentDataRT2.length; i++) {
      if (offStatusCurrentDataRT2[i]._id == "active") {
        var totalActiveCurrentOfferRT2 = offStatusCurrentDataRT2[i].sum;
      }
    }
  }

  const totalActivePreviousOfferRT = 0;

  // const offStatusPreviousDataRT = await Offer.aggregate([
  //   filterPreviousDatasRT,
  //   {
  //     '$group': {
  //       '_id': '$status',
  //       'sum': { '$sum': 1 }
  //     }
  //   }
  // ]).sort({ status: -1 }).exec();
  // var totalActivePreviousOfferRT = 0;
  // if (Array.isArray(offStatusPreviousDataRT) && offStatusPreviousDataRT.length > 0) {
  //   for (let i = 0; i < offStatusPreviousDataRT.length; i++) {
  //     if (offStatusPreviousDataRT[i]._id == "active") {
  //       var totalActivePreviousOfferRT = offStatusPreviousDataRT[i].sum;
  //     }
  //   }
  // }
  // RETARGETING END

  // console.log(JSON.stringify(filterCurretDatas));
  // console.log(JSON.stringify(filterPreviousDatas));
  //process.exit();


  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryStrings + "&" + adv_str + datePData + "zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryStrings + "&" + adv_str + "&" + datePData + "zone=Asia/Kolkata", axios_header).then((staticsPRes) => {
    if (typeof staticsPRes.statusText !== 'undefined' && staticsPRes.statusText == "OK") {

      var reportPData = [];
      if (Array.isArray(staticsPRes.data.records) && staticsPRes.data.records.length > 0) {
        const arrPData = staticsPRes.data.records;
        for (let j = 0; j < arrPData.length; j++) {
          let advTrkPData = arrPData[j];

          reportPData.push({
            "goal_name": advTrkPData.goal_name,
            "grossClicks": advTrkPData.grossClicks,
            "grossConversions": advTrkPData.grossConversions,
            "grossRevenue": advTrkPData.grossRevenue,
            "converionCR": 0,
            "grossInstall": 0
          });
        }
      }

      var newpData = {};

      for (let i = 0; i < reportPData.length; i++) {
        let r = reportPData[i];


        var superPKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superPKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superPKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superPKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superPKey += r.campaign_status;
        }
        if (typeof r.date !== 'undefined' && r.date !== "") {
          superPKey += r.date;
        }
        superPKey += i + 1;

        if (newpData[superPKey]) {
          newpData[superPKey]['grossClicks'] += r.grossClicks;
          newpData[superPKey]['grossConversions'] += r.grossConversions;
          newpData[superPKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newpData[superPKey] = r;
        }
        if (r.grossClicks == 0) {
          newpData[superPKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newpData[superPKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }

        if (r.goal_name == 'install') {
          newpData[superPKey]['grossInstall'] += r.grossConversions;
        } else {
          newpData[superPKey]['grossInstall'] += 0;
        }
      }

      const data_obj_p_to_arr = Object.values(newpData);
      const newArrPDataByClick = data_obj_p_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();
      const objFilterPData = newArrPDataByClick;

      axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&group[]=goal_name&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then(async (staticsRes) => {
        if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {
          if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
            var reportData = [];
            const advArrData = staticsRes.data.records;
            for (let j = 0; j < advArrData.length; j++) {
              let advTrkData = advArrData[j];
              reportData.push({
                "goal_name": advTrkData.goal_name,
                "grossClicks": advTrkData.grossClicks,
                "grossConversions": advTrkData.grossConversions,
                "grossRevenue": advTrkData.grossRevenue,
                "converionCR": 0,
                "grossInstall": 0
              });
            }


            var newData = {};

            for (let i = 0; i < reportData.length; i++) {
              let r = reportData[i];


              var superKey = "";
              if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
                superKey += r.campaign_name;
              }
              if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
                superKey += r.advertiser;
              }
              if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
                superKey += r.advertiser_id;
              }
              if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
                superKey += r.campaign_status;
              }
              if (typeof r.date !== 'undefined' && r.date !== "") {
                superKey += r.date;
              }
              superKey += i + 1;

              if (newData[superKey]) {
                newData[superKey]['grossClicks'] += r.grossClicks;
                newData[superKey]['grossConversions'] += r.grossConversions;
                newData[superKey]['grossRevenue'] += r.grossRevenue;
              } else {
                newData[superKey] = r;
              }
              if (r.grossClicks == 0) {
                newData[superKey]['converionCR'] += 0;
              } else {
                let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
                newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
              }
              if (r.goal_name == 'install') {
                newData[superKey]['grossInstall'] += r.grossConversions;
              } else {
                newData[superKey]['grossInstall'] += 0;
              }
            }

            const data_obj_to_arr = Object.values(newData);
            const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();
            const objFilterDataPerformance = newArrDataByClick;



            let array1 = objFilterPData,
              result1 = Object.values(array1.reduce((a, { date, grossClicks, grossConversions, grossRevenue, converionCR, grossInstall }) => {
                a[date] = (a[date] || { date, grossClicks: 0, grossConversions: 0, grossRevenue: 0, converionCR: 0, grossInstall: 0 });
                a[date].grossClicks = Number(a[date].grossClicks) + Number(grossClicks);
                a[date].grossConversions = Number(a[date].grossConversions) + Number(grossConversions);
                a[date].grossRevenue = Number(a[date].grossRevenue) + Number(grossRevenue);
                a[date].converionCR = Number(a[date].converionCR) + Number(converionCR);
                a[date].grossInstall = Number(a[date].grossInstall) + Number(grossInstall);
                return a;
              }, {}));

            //console.log(result1);

            let array2 = objFilterDataPerformance,
              result2 = Object.values(array2.reduce((a, { date, grossClicks, grossConversions, grossRevenue, converionCR, grossInstall }) => {
                a[date] = (a[date] || { date, grossClicks: 0, grossConversions: 0, grossRevenue: 0, converionCR: 0, grossInstall: 0 });
                a[date].grossClicks = Number(a[date].grossClicks) + Number(grossClicks);
                a[date].grossConversions = Number(a[date].grossConversions) + Number(grossConversions);
                a[date].grossRevenue = Number(a[date].grossRevenue) + Number(grossRevenue);
                a[date].converionCR = Number(a[date].converionCR) + Number(converionCR);
                a[date].grossInstall = Number(a[date].grossInstall) + Number(grossInstall);
                return a;
              }, {}));
            //console.log(result2);

            if (Array.isArray(result1) && result1.length > 0) {

              const grossClicksDiff = (parseInt(result2[0].grossClicks) - parseInt(result1[0].grossClicks));
              var grossClicksPercentageData = (grossClicksDiff * 100) / parseInt(result1[0].grossClicks);


              const grossConversionsDiff = (parseInt(result2[0].grossConversions) - parseInt(result1[0].grossConversions));
              var grossConversionsPercentageData = (grossConversionsDiff * 100) / parseInt(result1[0].grossConversions);


              const grossRevenueDiff = (parseInt(result2[0].grossRevenue) - parseInt(result1[0].grossRevenue));
              var grossRevenuePercentageData = (grossRevenueDiff * 100) / parseInt(result1[0].grossRevenue);


              const converionCRPDiff = (parseInt(result2[0].converionCR) - parseInt(result1[0].converionCR));
              if (result1[0].converionCR > 0) {
                var converionCRPercentageData = (converionCRPDiff * 100) / parseInt(result1[0].converionCR);
              } else {
                var converionCRPercentageData = 0;
              }

              const grossInstallDiff = (parseInt(result2[0].grossInstall) - parseInt(result1[0].grossInstall));
              var grossInstallPercentageData = (grossInstallDiff * 100) / parseInt(result1[0].grossInstall);


              const activePercentageDiff = (parseInt(totalActiveCurrentOffer) - parseInt(totalActivePreviousOffer));
              if (totalActivePreviousOffer > 0) {
                var activePercentageData = (activePercentageDiff * 100) / parseInt(totalActivePreviousOffer);
              } else {
                var activePercentageData = 0;
              }

              const activePercentageDiffRT = (parseInt(totalActiveCurrentOfferRT) - parseInt(totalActivePreviousOfferRT));
              if (totalActivePreviousOfferRT > 0) {
                var activePercentageDataRT = (activePercentageDiffRT * 100) / parseInt(totalActivePreviousOfferRT);
              } else {
                var activePercentageDataRT = 0;
              }


              var dataExist = true;
            } else {
              var dataExist = false;
              var grossClicksPercentageData = 0;
              var grossConversionsPercentageData = 0;
              var grossRevenuePercentageData = 0;
              var converionCRPercentageData = 0;
              var grossInstallPercentageData = 0;
              var activePercentageData = 0;
              result2.push({ 'grossClicks': 0, 'grossConversions': 0, 'grossRevenue': 0, 'converionCR': 0, 'grossInstall': 0 });
            }


            result2.push({ 'grossClicksPercentage': grossClicksPercentageData, 'grossConversionsPercentage': grossConversionsPercentageData, 'grossRevenuePercentage': grossRevenuePercentageData, 'converionCRPercentage': converionCRPercentageData, 'grossInstallPercentage': grossInstallPercentageData });
            result2.push({ 'totalOffers': totalOffers, 'active': totalActiveCurrentOffer2, 'activePercentage': activePercentageData, 'activeRT': totalActiveCurrentOfferRT2, 'reTargeting': totalOffersRT, 'reTargetingPercentage': activePercentageDataRT });

            const response = { 'success': true, 'dataExist': dataExist, 'dashboardData': result2 };
            res.status(200).send(response);
            return;
          } else {

            let dashboardData = [
              {
                "grossClicks": 0,
                "grossConversions": 0,
                "grossRevenue": 0,
                "converionCR": 0,
                "grossInstall": 0
              },
              {
                "grossClicksPercentage": 0,
                "grossConversionsPercentage": 0,
                "grossRevenuePercentage": 0,
                "converionCRPercentage": 0,
                "grossInstallPercentage": 0
              },
              {
                "totalOffers": 0,
                "active": 0,
                "activePercentage": 0,
                "activeRT": 0,
                "reTargeting": 0
              }
            ];
            const resMsg = { 'success': true, 'dataExist': true, dashboardData };
            res.status(200).send(resMsg);
            return;
          }
        } else {
          let dashboardData = [
            {
              "grossClicks": 0,
              "grossConversions": 0,
              "grossRevenue": 0,
              "converionCR": 0,
              "grossInstall": 0
            },
            {
              "grossClicksPercentage": 0,
              "grossConversionsPercentage": 0,
              "grossRevenuePercentage": 0,
              "converionCRPercentage": 0,
              "grossInstallPercentage": 0
            },
            {
              "totalOffers": 0,
              "active": 0,
              "activePercentage": 0,
              "activeRT": 0,
              "reTargeting": 0
            }
          ];
          const resMsg = { 'success': true, 'dataExist': true, dashboardData };
          res.status(200).send(resMsg);
          return;
        }

      }).catch(err => {
        console.log(err);
        const errMsg = { "success": false, "errors": err };
        res.status(400).send(errMsg);
        return;
      });
      // End PERFOMANCE FIRST

    } else {
      let dashboardData = [
        {
          "grossClicks": 0,
          "grossConversions": 0,
          "grossRevenue": 0,
          "converionCR": 0,
          "grossInstall": 0
        },
        {
          "grossClicksPercentage": 0,
          "grossConversionsPercentage": 0,
          "grossRevenuePercentage": 0,
          "converionCRPercentage": 0,
          "grossInstallPercentage": 0
        },
        {
          "totalOffers": 0,
          "active": 0,
          "activePercentage": 0,
          "activeRT": 0,
          "reTargeting": 0
        }
      ];
      const resMsg = { 'success': true, 'dataExist': true, dashboardData };
      res.status(200).send(resMsg);
      return;
    }

  }).catch(err => {
    console.log(err);
    const errMsg = { "success": false, "errors": err };
    res.status(400).send(errMsg);
    return;
  });
}

exports.dashboardTopCreatives = async (req, res) => {
  // check body key
  const paramSchema = { 1: 'offer_id', 2: 'adv_id', 3: 'start', 4: 'end' };
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
  const { offer_id, adv_id, start, end } = req.body;

  // Validate request
  if (!start || !end) {
    var requestVal = "";
    if (!start) {
      var requestVal = "start date";
    } else if (!end) {
      var requestVal = "end date";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };
  var newQueryString = querystring.stringify(req.body);
  const endpoint = "reports/custom";


  var adv_str = "";
  if (Array.isArray(offer_id) && offer_id.length > 0) {
    newQueryString = newQueryString.replace("adv_id=&", "");
    newQueryString = newQueryString.replaceAll("offer_id", "camp_ids[]");
  } else {
    if (adv_id) {
      newQueryString = newQueryString.replaceAll("adv_id", "adv_ids[]");
    } else {
      newQueryString = newQueryString.replace("adv_id=&", "");
      await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
        if (advertisers) {
          for (let i = 0; i < advertisers.length; i++) {
            let adv = advertisers[i];
            if (adv.tid > 0) {
              adv_str += ("adv_ids[]=" + adv.tid + "&");
            }
          }
        }
      }).catch(error => {
        console.error(error);
      });
    }
  }

  // console.log(adv_str);
  // console.log(newQueryString);
  // process.exit();

  var adv_array = {};
  var CTR_array = {}
  // get all advertisers
  Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
    if (all_adv) {
      for (let k = 0; k < all_adv.length; k++) {
        let adv = all_adv[k];
        adv_array[adv.tid] = ucfirst(adv.organization);
      }
    }
  }).catch(error => {
    console.error(error);
  });

  var impression = '';
  // get creative CTR
  await CreativeCtrModel.find({}).sort({ _id: 1 }).exec().then((all_CreativeCTR) => {
    if (all_CreativeCTR) {
      for (let n = 0; n < all_CreativeCTR.length; n++) {
        let CTR = all_CreativeCTR[n];
        CTR_array[CTR.creative_name] = CTR.creative_ctr;
      }
    }
  }).catch(error => {
    console.error(error);
  })


  //console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=cr_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

  axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=cr_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsRes) => {
    if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

      var reportData = [];
      if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
        const advArrData = staticsRes.data.records;
        for (let j = 0; j < advArrData.length; j++) {
          let advTrkData = advArrData[j];


          let offer_name = advTrkData.campaign_name.replace("AL-", "");

          if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
            var advertiser_name = adv_array[advTrkData.advertiser_id];
          } else {
            var advertiser_name = advTrkData.advertiser;
          }

          impression = 0;
          if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
            let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
            impression = Math.round(cretiveImpC);
          } else {
            impression = 0;
          }


          reportData.push({
            "campaign_name": offer_name,
            "campaign_id": advTrkData.campaign_id,
            "advertiser": advertiser_name,
            "advertiser_id": advTrkData.advertiser_id,
            "cr_name": advTrkData.cr_name,
            impression,
            "grossClicks": advTrkData.grossClicks,
            "grossConversions": advTrkData.grossConversions,
            "grossRevenue": advTrkData.grossRevenue,
            "converionCR": 0,
            "grossInstall": 0
          });


        }
      }

      var newData = {};
      for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
          superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
          superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
          superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
          superKey += r.campaign_status;
        }
        if (typeof r.app_name !== 'undefined' && r.app_name !== "") {
          superKey += r.app_name;
        }
        superKey += i + 1;

        if (newData[superKey]) {
          newData[superKey]['grossClicks'] += r.grossClicks;
          newData[superKey]['grossConversions'] += r.grossConversions;
          newData[superKey]['grossRevenue'] += r.grossRevenue;
        } else {
          newData[superKey] = r;
        }
        if (r.grossClicks == 0) {
          newData[superKey]['converionCR'] += 0;
        } else {
          let converionDataVal = (r.grossConversions * 100) / r.grossClicks;
          newData[superKey]['converionCR'] += Math.round(converionDataVal * 100) / 100;
        }
        newData[superKey]['grossInstall'] += r.grossConversions;
      }

      const data_obj_to_arr = Object.values(newData);
      const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 10);
      const objFilterDataTopsourceApp = newArrDataByClick;

      const response = { 'success': true, 'topsourceapp': objFilterDataTopsourceApp };
      res.status(200).send(response);
      return

    } else {
      const resMsg = { "success": false, "message": "No records found" };
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



// request.body Add Preset
exports.addPreset = async (req, res) => {
  const { reportName, reportSubcribe, createdBy, tid, company_name, filters, duration } = req.body;
  // process.exit();
  // Validate request
  if (!reportName || !reportSubcribe || !createdBy || !tid || !company_name || !filters || !duration) {
    var requestVal = "";
    if (!reportName) {
      var requestVal = "reportName";
    } else if (!reportSubcribe) {
      var requestVal = "reportSubcribe";
    } else if (!createdBy) {
      var requestVal = "createdBy";
    } else if (!tid) {
      var requestVal = "tid";
    } else if (!company_name) {
      var requestVal = "company_name";
    } else if (!filters) {
      var requestVal = "filters";
    } else if (!duration) {
      var requestVal = "duration";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }

  const preset = new Preset({
    reportName: reportName,
    reportSubcribe: reportSubcribe,
    createdBy: createdBy,
    tid: tid,
    company_name: company_name,
    filters: filters,
    duration: duration
  });

  // Save Preset in the database
  preset.save(preset).then(DBdata => {
    const resData = { 'success': true, 'message': "Report preset has been created.", 'results': DBdata };
    res.status(200).send(resData);
    return
  }).catch(err => {
    const resData = { 'success': false, 'message': "" + err.message };
    res.status(400).send(resData);
    return;
  });
};


// preset subscribed and unsubscribed
exports.presetsubscribeandunsubscribe = (req, res) => {

  const { reportID, reportSubcribe } = req.body;

  if (reportSubcribe == true) {
    var msgType = "Subscribed";
  } else {
    var msgType = "Unsubscribed";
  }

  Preset.findByIdAndUpdate({ _id: reportID }, { reportSubcribe: reportSubcribe }, { new: true }).exec().then((resPreset) => {
    if (resPreset) {
      const response = { 'success': true, 'message': `Preset successfully ${msgType}.`, 'results': resPreset };
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

// Get Preset Data
exports.getPresetData = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const { searchQuery, sorttype, sortdirection } = req.body;

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

  let result = await Preset.find({
    $or: [
      { "reportName": { '$regex': searchQuery, $options: 'i' } },
      { "company_name": { '$regex': searchQuery, $options: 'i' } },
      { "duration": { '$regex': searchQuery, $options: 'i' } },
      { "createdBy": { '$regex': searchQuery, $options: 'i' } }
    ]
  }).sort(sortObject).exec();
  const totalPreset = parseInt(result.length);

  await Preset.find({
    $or: [
      { "reportName": { '$regex': searchQuery, $options: 'i' } },
      { "company_name": { '$regex': searchQuery, $options: 'i' } },
      { "duration": { '$regex': searchQuery, $options: 'i' } },
      { "createdBy": { '$regex': searchQuery, $options: 'i' } }
    ]
  }).sort(sortObject).collation({ locale: "en_US", numericOrdering: true }).skip(skipIndex).limit(limit).exec().then((resPreset) => {
    if (resPreset) {
      const response = { 'success': true, 'totoalRecords': totalPreset, 'results': resPreset };
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


// Get Preset Data by advertiser id
exports.getPresetDataByAdvid = async (req, res) => {
  const tid = req.params.advertiserId;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const { searchQuery, sorttype, sortdirection } = req.body;



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

  let result = await Preset.find({
    $and: [
      {
        $or: [
          { "reportName": { '$regex': searchQuery, $options: 'i' } },
          { "company_name": { '$regex': searchQuery, $options: 'i' } },
          { "duration": { '$regex': searchQuery, $options: 'i' } },
          { "createdBy": { '$regex': searchQuery, $options: 'i' } }
        ]
      },
      {
        "tid": tid
      }
    ]
  }).sort(sortObject).exec();
  const totalPreset = parseInt(result.length);

  await Preset.find({
    $and: [
      {
        $or: [
          { "reportName": { '$regex': searchQuery, $options: 'i' } },
          { "company_name": { '$regex': searchQuery, $options: 'i' } },
          { "duration": { '$regex': searchQuery, $options: 'i' } },
          { "createdBy": { '$regex': searchQuery, $options: 'i' } }
        ]
      },
      {
        "tid": tid
      }
    ]
  }).sort(sortObject).collation({ locale: "en_US", numericOrdering: true }).skip(skipIndex).limit(limit).exec().then((resPreset) => {

    if (resPreset) {
      const response = { 'success': true, 'totoalRecords': totalPreset, 'results': resPreset };
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


// Get Preset Data by advertiser id
exports.getPresetDataByEmailID = async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const { email, searchQuery, sorttype, sortdirection } = req.body;



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

  let result = await Preset.find({
    $and: [
      {
        $or: [
          { "reportName": { '$regex': searchQuery, $options: 'i' } },
          { "company_name": { '$regex': searchQuery, $options: 'i' } },
          { "duration": { '$regex': searchQuery, $options: 'i' } },
          { "createdBy": { '$regex': searchQuery, $options: 'i' } }
        ]
      },
      {
        "createdBy": email
      }
    ]
  }).sort(sortObject).exec();
  const totalPreset = parseInt(result.length);

  await Preset.find({
    $and: [
      {
        $or: [
          { "reportName": { '$regex': searchQuery, $options: 'i' } },
          { "company_name": { '$regex': searchQuery, $options: 'i' } },
          { "duration": { '$regex': searchQuery, $options: 'i' } },
          { "createdBy": { '$regex': searchQuery, $options: 'i' } }
        ]
      },
      {
        "createdBy": email
      }
    ]
  }).sort(sortObject).collation({ locale: "en_US", numericOrdering: true }).skip(skipIndex).limit(limit).exec().then((resPreset) => {

    if (resPreset) {
      const response = { 'success': true, 'totoalRecords': totalPreset, 'results': resPreset };
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