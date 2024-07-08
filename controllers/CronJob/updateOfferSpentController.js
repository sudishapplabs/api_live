const Offer = require("../../models/offerModel");
const { getAllOffersForSpent, getAdertiseDetailsByAdvId } = require("../../common/common");
const { padTo2Digits } = require("../../common/helper");
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
const { Type } = require("@aws-sdk/client-s3");

function strtotime(dateString) {
  // Parse the date string into a Date object
  const date = new Date(dateString);
  // Get the Unix timestamp (milliseconds since January 1, 1970)
  const timestamp = date.getTime();
  // Convert milliseconds to seconds by dividing by 1000
  //const timestampInSeconds = Math.floor(timestamp / 1000);
  const timestampInSeconds = Math.floor(timestamp);
  return timestampInSeconds;
}

function getDateBetween(Date1, Date2) {
  const array = [];
  const Variable1 = strtotime(Date1);
  const Variable2 = strtotime(Date2);

  for (var currentDate = Variable1; currentDate <= Variable2; currentDate += (15552000000)) {
    var cDate = new Date(parseInt(currentDate));
    const year = cDate.getUTCFullYear();
    const month = padTo2Digits(cDate.getUTCMonth() + 1);
    const day = padTo2Digits(cDate.getUTCDate());
    const createdOfferDate = [year, month, day].join('-');
    array.push(createdOfferDate);
  }
  return array;
}


exports.getOfferSpent = async (req, res) => {

  // create offer on trackier
  const axios_header = {
    headers: {
      'x-api-key': process.env.API_KEY,
      'Content-Type': 'application/json'
    }
  };


  const date = new Date();
  const year = date.getUTCFullYear();
  const month = padTo2Digits(date.getUTCMonth() + 1);
  const day = padTo2Digits(date.getUTCDate());
  const startDate = [year, month, day].join('-');


  // console.log(startDate);
  const offers = await getAllOffersForSpent();

  var offer_str = "";
  if (Array.isArray(offers) && offers.length > 0) {
    var offerIds = [];
    for (let i = 0; i < offers.length; i++) {
      let offDt = offers[i];
      offerIds.push(offDt.trackier_camp_id);
      offer_str += ("camp_ids[]=" + offDt.trackier_camp_id + "&");
    }



    var allOffersTodaySpentBeforeSix = [];
    var allOffersTodaySpent = [];
    var allOffersCreatedDate = {};

    var offers_str = "";
    for (let j = 0; j < offers.length; j++) {
      let offTodSpent = offers[j];

      if (offTodSpent.created_on.toString().length == 10) {
        var createdDate = offTodSpent.created_on + "000";
      } else {
        var createdDate = offTodSpent.created_on;
      }
      var cDate = new Date(parseInt(createdDate));
      const year = cDate.getUTCFullYear();
      const month = padTo2Digits(cDate.getUTCMonth() + 1);
      const day = padTo2Digits(cDate.getUTCDate());
      const createdOfferDate = [year, month, day].join('-');


      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      //const lastSixMonth = date.toLocaleDateString();
      const yearx = date.getUTCFullYear();
      const monthx = padTo2Digits(date.getUTCMonth() + 1);
      const dayx = padTo2Digits(date.getUTCDate());
      const lastSixMonthDFormat = [yearx, monthx, dayx].join('-');

      const date1 = new Date(createdOfferDate);
      const date2 = new Date(lastSixMonthDFormat);

      if (createdOfferDate > lastSixMonthDFormat) {
        allOffersTodaySpent.push(offTodSpent.trackier_camp_id);
        offers_str += ("camp_ids[]=" + offTodSpent.trackier_camp_id + "&");
      } else {
        allOffersTodaySpentBeforeSix.push(offTodSpent.trackier_camp_id);
        allOffersCreatedDate[offTodSpent.trackier_camp_id] = createdOfferDate;
      }
    }



    const endpoint = "reports/custom";

    // // GET DATA FROm TRACKIER
    // await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&kpi[]=grossClicks&kpi[]=grossRevenue&kpi[]=grossConversions&" + offer_str + "start=" + startDate + "&end=" + startDate + "&zone=Asia/Kolkata", axios_header).then(async (response) => {
    //   if (typeof response.statusText !== 'undefined' && response.statusText == "OK") {

    //     const advArrData = response.data.records;
    //     for (let j = 0; j < advArrData.length; j++) {
    //       let record = advArrData[j];

    //       if (parseFloat(record.grossRevenue) > 0) {

    //         console.log('today_spent for all offer === ' + record.campaign_id + " ======= " + record.grossRevenue);

    //         const dataArr = { today_spent: parseFloat(record.grossRevenue), total_click: parseInt(record.grossClicks), today_click: parseInt(record.grossClicks), today_conversion: parseInt(record.grossConversions), today_install: parseInt(record.grossConversions) }

    //         // UPDATE DB TODAY SPENT AND CONVERSION
    //         // await Offer.findOneAndUpdate({ trackier_camp_id: record.campaign_id }, dataArr, { new: true }).exec().then((recordRes) => {
    //         //   console.log('TodayGrossRevenue Update Request');
    //         //   if (!recordRes) {
    //         //     console.log('TodayGrossRevenue Update Response');
    //         //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
    //         //     res.status(200).send(resMsg);
    //         //     return;
    //         //   }
    //         // }).catch((error) => {
    //         //   const reMsg = { "status": false, "message": error.message };
    //         //   res.status(400).send(reMsg);
    //         // });
    //       }
    //     }
    //   } else {
    //     const resMsg = { "success": false, "message": "No records found" };
    //     res.status(200).send(resMsg);
    //     return;
    //   }
    // }).catch(err => {
    //   console.log(err);
    //   const errMsg = { "success": false, "errors": err.response.data.errors };
    //   res.status(400).send(errMsg);
    //   return;
    // });



    /// TOTAL SPENT LAST SIX MONTHS
    // const date = new Date();
    // const year = date.getUTCFullYear();
    // const month = padTo2Digits(date.getUTCMonth() + 1);
    // const day = padTo2Digits(date.getUTCDate());
    // const endDate = [year, month, day].join('-');

    // date.setMonth(date.getMonth() - 6);
    // //const lastSixMonth = date.toLocaleDateString();
    // const yearx = date.getUTCFullYear();
    // const monthx = padTo2Digits(date.getUTCMonth() + 1);
    // const dayx = padTo2Digits(date.getUTCDate());
    // const startDateLastSix = [yearx, monthx, dayx].join('-');

    // // GET DATA FROM TRACKIER of six month from today date

    // console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&kpi[]=grossClicks&kpi[]=grossRevenue&kpi[]=grossConversions&" + offers_str + "start=" + startDateLastSix + "&end=" + endDate + "&zone=Asia/Kolkata");
    // await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&kpi[]=grossClicks&kpi[]=grossRevenue&kpi[]=grossConversions&" + offers_str + "start=" + startDateLastSix + "&end=" + endDate + "&zone=Asia/Kolkata", axios_header).then(async (responseRes) => {
    //   if (typeof responseRes.statusText !== 'undefined' && responseRes.statusText == "OK") {

    //     const advArrData = responseRes.data.records;
    //     for (let k = 0; k < advArrData.length; k++) {
    //       let recordRes = advArrData[k];
    //       console.log('TotalSpent last six month wale:' + recordRes.campaign_id + "--" + recordRes.grossRevenue);
    //       const dataTotArr = { total_spent: parseFloat(recordRes.grossRevenue) }
    //       // UPDATE DB TOTAL SPENT
    //       await Offer.findOneAndUpdate({ trackier_camp_id: recordRes.campaign_id }, dataTotArr, { new: true }).exec().then((recRes) => {
    //         console.log('TotalGrossRevenue Update Request');
    //         if (!recRes) {
    //           console.log('TotalGrossRevenue Update Response');
    //           const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
    //           res.status(200).send(resMsg);
    //           return;
    //         }
    //       }).catch((error) => {
    //         const reMsg = { "status": false, "message": error.message };
    //         res.status(400).send(reMsg);
    //       });
    //     }
    //   } else {
    //     const resMsg = { "success": false, "message": "No records found" };
    //     res.status(200).send(resMsg);
    //     return;
    //   }
    // }).catch(err => {
    //   console.log(err);
    //   const errMsg = { "success": false, "errors": err.response.data.errors };
    //   res.status(400).send(errMsg);
    //   return;
    // });




    const tdate = new Date();
    const tyear = tdate.getUTCFullYear();
    const tmonth = padTo2Digits(tdate.getUTCMonth() + 1);
    const tday = padTo2Digits(tdate.getUTCDate());
    const todayDate = [tyear, tmonth, tday].join('-');

    var dateArrayData = {};
    for (const [key, val] of Object.entries(allOffersCreatedDate)) {
      let offerId = key;
      let offerDt = val;
      dateArrayData[offerId] = getDateBetween(offerDt, todayDate);
    }

    let totalSpent = {};
    for (let n = 0; n < allOffersTodaySpentBeforeSix.length; n++) {
      let offerIdOverSixMonth = allOffersTodaySpentBeforeSix[n];

      let offer_str_id = ("camp_ids[]=" + offerIdOverSixMonth + "&");
      dateArrayData[offerIdOverSixMonth].push(todayDate);

      for (let p = 0; p < dateArrayData[offerIdOverSixMonth].length - 1; p += 1) {
        if (typeof dateArrayData[offerIdOverSixMonth][p + 1]) {

          if (p > 0) {
            const fdateConst = new Date(dateArrayData[offerIdOverSixMonth][p]);
            var dayf = 60 * 60 * 24 * 1000;
            var fdate = new Date(fdateConst.getTime() + dayf);
            const fyear = fdate.getUTCFullYear();
            const fmonth = padTo2Digits(fdate.getUTCMonth() + 1);
            const fday = padTo2Digits(fdate.getUTCDate());
            var fromDate = [fyear, fmonth, fday].join('-');
          } else {
            var fromDate = dateArrayData[offerIdOverSixMonth][p];
          }
          if (typeof dateArrayData[offerIdOverSixMonth][p + 1] !== 'undefined' && dateArrayData[offerIdOverSixMonth][p + 1] !== "") {
            var endDate = dateArrayData[offerIdOverSixMonth][p + 1];
          }
          const endpoint = "reports/custom"
          // GET DATA FROm TRACKIER
          await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&kpi[]=grossClicks&kpi[]=grossRevenue&kpi[]=grossConversions&" + offer_str_id + "start=" + fromDate + "&end=" + endDate + "&zone=Asia/Kolkata", axios_header).then((totSixMonthRes) => {

            if (typeof totSixMonthRes.statusText !== 'undefined' && totSixMonthRes.statusText == "OK") {
              const sixMonthData = totSixMonthRes.data.records;

              if (Array.isArray(sixMonthData) && sixMonthData.length > 0) {
                if (offerIdOverSixMonth == sixMonthData[0].campaign_id) {
                  if (sixMonthData[0].grossRevenue) {
                    // let abc = pushValue(sixMonthData[0].campaign_id, sixMonthData[0].grossRevenue);
                    if (!totalSpent[sixMonthData[0].campaign_id]) {
                      totalSpent[sixMonthData[0].campaign_id] = [];
                    }
                    totalSpent[sixMonthData[0].campaign_id].push(sixMonthData[0].grossRevenue);

                    console.log([sixMonthData[0].campaign_id]);
                  }
                }
              }
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
      }
    }


    // console.log(totalSpent);

    for (const [key, val] of Object.entries(totalSpent)) {
      let campaign_id = key;
      let totalSpentVal = val;
      let sum = totalSpentVal.reduce((accumulator, current) => accumulator + current);
      let subVal = Math.round(parseFloat(sum) * 100) / 100;
      const dataArr = { total_spent: subVal }
      // UPDATE DB TODAY SPENT AND CONVERSION
      // Offer.findOneAndUpdate({ trackier_camp_id: campaign_id }, dataArr, { new: true }).exec().then((recordRes) => {
      //   console.log('TotalSpent_for_six_months Update Request');
      //   if (!recordRes) {
      //     console.log('TotalSpent_for_six_months Update Response');
      //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      //     res.status(200).send(resMsg);
      //     return;
      //   }
      // }).catch((error) => {
      //   const reMsg = { "status": false, "message": error.message };
      //   res.status(400).send(reMsg);
      // });
    }
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }
}