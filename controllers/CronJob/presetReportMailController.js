const Offer = require("../../models/offerModel");
const { getPresetDataByFilterDate, convertCampaignData } = require("../../common/common");
const { padTo2Digits, dateprint } = require("../../common/helper");



const Advertiser = require("../../models/advertiserModel");
const { URL, parse } = require('url');
const axios = require('axios');
const querystring = require("querystring");
const Publishers = require("../../models/publisherModel");
const Applist = require("../../models/applistModel");
const CreativeCtrModel = require("../../models/creativectrModel");
const Placement = require("../../models/placementModel");

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");
const { isArray } = require("util");

exports.getReportPresetData = async (req, res) => {

  const date = new Date();
  const year = date.getUTCFullYear();
  const month = padTo2Digits(date.getUTCMonth() + 1);
  const day = padTo2Digits(date.getUTCDate());
  const D = padTo2Digits(date.toLocaleString('en-us', { weekday: 'long' }));

  var t = new Date();
  const lastDayTime = (new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59));
  const lastDay = padTo2Digits(lastDayTime.getUTCDate());


  // console.log(day);
  // console.log(D);
  // console.log(lastDay);

  var filter = [];
  filter.push('daily');
  if (D == "Monday") {
    filter.push('weekly');
  }
  if (day == 01 || day == 15) {
    filter.push('by_weekly');
  }
  if (lastDay == day) {
    filter.push('monthly');
  }


  const resData = await getPresetDataByFilterDate(filter);

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (Array.isArray(resData) && resData.length > 0) {
    for (let i = 0; i < resData.length; i++) {
      let repDt = resData[i];
      let newQueryString = repDt.filters;

      let checqueryString = newQueryString.replace("&", " ");

      if ((checqueryString.indexOf("city") !== -1) || (checqueryString.indexOf("region") !== -1) || (checqueryString.indexOf("app_name") !== -1) || (checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("cr_name") !== -1) || (checqueryString.indexOf("audienc_int") !== -1)) {
        var endpoint = "reports/subid"
      } else {
        var endpoint = "reports/custom"
      }


      newQueryString = newQueryString.replaceAll("%5B%5D", "");
      newQueryString = newQueryString.replaceAll("group", "group[]");
      newQueryString = newQueryString.replaceAll("camp_ids", "camp_ids[]");
      newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
      newQueryString = newQueryString.replace("app_id", "app_name");
      newQueryString = newQueryString.replace("audienc_int", "app_name");
      newQueryString = newQueryString.replace("placement", "source");


      let minus7 = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
      let yearSevenDay = minus7.getUTCFullYear();
      let monthSevenDay = padTo2Digits(minus7.getUTCMonth() + 1);
      let daySevenDay = padTo2Digits(minus7.getUTCDate());
      let curr_date_sevenDay = [yearSevenDay, monthSevenDay, daySevenDay].join('-');

      let minus15 = new Date(date.getTime() - 15 * 24 * 60 * 60 * 1000);
      let yearFifteenDay = minus15.getUTCFullYear();
      let monthFifteenDay = padTo2Digits(minus15.getUTCMonth() + 1);
      let dayFifteenDay = padTo2Digits(minus15.getUTCDate());
      let curr_date_fifteenDay = [yearFifteenDay, monthFifteenDay, dayFifteenDay].join('-');


      let minus30 = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
      let yearThirtyDays = minus30.getUTCFullYear();
      let monthThirtyDays = padTo2Digits(minus30.getUTCMonth() + 1);
      let dayThirtyDays = padTo2Digits(minus30.getUTCDate());
      let curr_date_thirtyDays = [yearThirtyDays, monthThirtyDays, dayThirtyDays].join('-');


      const curr_date = [year, month, day].join('-');
      if (repDt.duration == 'daily') {
        var dateFromDateTo = "&start=" + curr_date + "&end=" + curr_date;
      } else if (repDt.duration == 'weekly') {
        var dateFromDateTo = "&start=" + curr_date_sevenDay + "&end=" + curr_date;
      } else if (repDt.duration == 'by_weekly') {
        var dateFromDateTo = "&start=" + curr_date_fifteenDay + "&end=" + curr_date;
      } else if (repDt.duration == 'monthly') {
        var dateFromDateTo = "&start=" + curr_date_thirtyDays + "&end=" + curr_date;
      }

      let query = newQueryString + dateFromDateTo;

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

      var adv_str = "";
      if (checqueryString.indexOf("adv_ids") !== -1) {
        newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
      } else {
        if (checqueryString.indexOf("camp_ids") == -1) {
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

      console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue" + query + "&" + adv_str + "zone=Asia/Kolkata");

      await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue" + query + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then(async (staticsRes) => {
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

            const newArrDataByClick = reportDatas.sort((a, b) => b.grossClicks - a.grossClicks).slice();


            var bodyData = [];
            for (let o = 0; o < newArrDataByClick.length; o++) {
              let repsDt = newArrDataByClick[o];


              // var campaignStatus = 'not found'; var publisher_name = 'not found'; var appListName = 'not found'; var appListID = 'not found'; var placements = 'not found'; var audiencInt = 'not found'; var cr_name = 'not found'; var goalName = 'not found'; var goalId = 'not found'; var country = 'not found'; var city = 'not found'; var region = 'not found'; var hour = 'not found'; var created = 'not found'; var month = 'not found'; var clicksImp = 'not found'; var cretiveImppression = 'not found'; var dtGrossClicks = 'not found'; var grsConversionsPayable = 'not found'; var crRatePayable = 'not found'; var grsConversions = 'not found'; var crRate = 'not found'; var grossRevenue = 'not found';



              bodyData.push([repsDt.campaign_id + "-" + repsDt.campaign_name, repsDt.advertiser_id + "-" + repsDt.advertiser]);

              if (checqueryString.indexOf("campaign_status") !== -1) {
                bodyData[o].push(repsDt.campaign_status);
              }
              if (checqueryString.indexOf("publisher_id") !== -1) {
                bodyData[o].push(repsDt.publisher_name);
              }
              if (checqueryString.indexOf("placement") !== -1) {
                bodyData[o].push(repsDt.source);
              }
              if (checqueryString.indexOf("app_id") !== -1) {
                bodyData[o].push(repsDt.app_id);
              }
              if (checqueryString.indexOf("app_name") !== -1) {
                bodyData[o].push(repsDt.app_name);
              }
              if (checqueryString.indexOf("audienc_int") !== -1) {
                bodyData[o].push(repsDt.audienc_interest);
              }
              if (checqueryString.indexOf("cr_name") !== -1) {
                bodyData[o].push(repsDt.cr_name);
              }
              if (checqueryString.indexOf("country") !== -1) {
                bodyData[o].push(repsDt.country);
              }
              if (checqueryString.indexOf("region") !== -1) {
                bodyData[o].push(repsDt.region);
              }
              if (checqueryString.indexOf("city") !== -1) {
                bodyData[o].push(repsDt.city);
              }
              if (checqueryString.indexOf("month") !== -1) {
                bodyData[o].push(repsDt.month);
              }
              if (checqueryString.indexOf("created") !== -1) {
                bodyData[o].push(repsDt.created);
              }
              if (checqueryString.indexOf("hour") !== -1) {
                bodyData[o].push(repsDt.hour);
              }
              if (checqueryString.indexOf("app_name") !== -1 || checqueryString.indexOf("app_id") !== -1 || checqueryString.indexOf("cr_name") !== -1) {
                bodyData[o].push(repsDt.impression);
              }
              if (checqueryString.indexOf("cr_name") !== -1 && checqueryString.indexOf("app_name") !== -1 && checqueryString.indexOf("app_id") !== -1) {
                bodyData[o].push(repsDt.impression);
              }
              if (checqueryString.indexOf("goal_name") !== -1) {
                bodyData[o].push(repsDt.grossClicks);
              }
              if (checqueryString.indexOf("goal_name") !== -1) {
                for (let s = 0; s < n_uniqGoalNames.length; s++) {
                  let gname = n_uniqGoalNames[s];
                  bodyData[o].push(repsDt[gname]);
                }
              }
              if (checqueryString.indexOf("goal_name") == -1) {
                bodyData[o].push(repsDt.grossClicks);
              }
              if (checqueryString.indexOf("goal_name") !== -1) {
                bodyData[o].push(repsDt.grossPayableConversions);
                bodyData[o].push(repsDt.grossPayableConversionsCR + "%");
                bodyData[o].push(repsDt.grossConversions);
                bodyData[o].push(repsDt.converionRateCR + "%");
              }
              if (checqueryString.indexOf("goal_name") == -1) {
                bodyData[o].push(repsDt.custInstall);
                bodyData[o].push(repsDt.converionCR + "%");
              }
              bodyData[o].push("$" + repsDt.grossRevenue);
            }



            var header = [];
            header.push("Campaign Name");
            header.push("Advertiser");
            if (checqueryString.indexOf("campaign_status") !== -1) {
              header.push("Offer Status");
            }
            if (checqueryString.indexOf("publisher_id") !== -1) {
              header.push("Publisher Name");
            }
            if (checqueryString.indexOf("placement") !== -1) {
              header.push("Placement");
            }
            if (checqueryString.indexOf("app_id") !== -1) {
              header.push("App ID");
            }
            if (checqueryString.indexOf("app_name") !== -1) {
              header.push("App Name");
            }
            if (checqueryString.indexOf("audienc_int") !== -1) {
              header.push("Audience Interest");
            }
            if (checqueryString.indexOf("cr_name") !== -1) {
              header.push("Creative Name");
            }
            if (checqueryString.indexOf("country") !== -1) {
              header.push("Country (GEO)");
            }
            if (checqueryString.indexOf("region") !== -1) {
              header.push("Region");
            }
            if (checqueryString.indexOf("city") !== -1) {
              header.push("City");
            }
            if (checqueryString.indexOf("month") !== -1) {
              header.push("Month");
            }
            if (checqueryString.indexOf("created") !== -1) {
              header.push("Date");
            }
            if (checqueryString.indexOf("hour") !== -1) {
              header.push("Hour");
            }
            if (checqueryString.indexOf("app_name") !== -1 || checqueryString.indexOf("app_id") !== -1 || checqueryString.indexOf("cr_name") !== -1) {
              header.push("Impressions");
            }
            if (checqueryString.indexOf("cr_name") !== -1 && checqueryString.indexOf("app_name") !== -1 && checqueryString.indexOf("app_id") !== -1) {
              header.push("Impressions");
            }
            if (checqueryString.indexOf("goal_name") !== -1) {
              header.push("Clicks");
            }
            for (let s = 0; s < n_uniqGoalNames.length; s++) {
              let gname = n_uniqGoalNames[s];
              header.push(gname);
            }
            if (checqueryString.indexOf("goal_name") == -1) {
              header.push("Clicks");
            }
            if (checqueryString.indexOf("goal_name") !== -1) {
              header.push("Payable Conversions");
              header.push("Payable Conversion Rate (CR)");
              header.push("Conversions");
              header.push("Conversion Rate (CR)");
            }
            if (checqueryString.indexOf("goal_name") == -1) {
              header.push("Install");
              header.push("Click to install ratio");
            }
            header.push("Spent");


            const { convertArrayToCSV } = require('convert-array-to-csv');
            const fs = require('fs');
            const val = convertArrayToCSV(bodyData, {
              header,
              separator: ','
            });

            var base64File = Buffer.from(val).toString('base64');
            // fs.writeFileSync('public/subscribed_report/' + Math.floor(Date.now() / 1000)
            //   + '_reports.csv', val, (err) => {
            //     if (err) throw err;
            //     console.log('The file has been saved!');
            //   });

            // send Mail to user
            const bcc_mail = process.env.BCC_EMAILS.split(",");
            const emailAdvertiserTemplate = fs.readFileSync(path.join("templates/subscribed_report.handlebars"), "utf-8");
            const templateAdv = handlebars.compile(emailAdvertiserTemplate);
            const messageBodyAdv = (templateAdv({
              todayDate: dateprint(),
              presetName: repDt.reportName,
              advertiserName: ucwords(repDt.company_name),
              url: process.env.APPLABS_URL + 'campaignList',
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
              subject: 'Applabs Alert - ' + ucwords(repDt.duration) + ' Report ' + ucwords(repDt.reportName),
              html: messageBodyAdv,
              attachments: [
                {
                  content: base64File,
                  filename: Math.floor(Date.now() / 1000) + "_report.csv",
                  ContentType: 'application/csv',
                  disposition: 'attachment',
                  contentId: 'mytext'
                },
              ]
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
    const response = { 'success': true, 'message': 'Report sent via mail!' };
    res.status(200).send(response);
    return
  }
}