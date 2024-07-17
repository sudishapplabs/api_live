var { Offer } = require("../../models/offerModel");
const { getAllOffersByTodaySpent } = require("../../common/common");
const axios = require('axios');

exports.getUpdatedCampaignStatus = async (req, res) => {
  const offerData = await getAllOffersByTodaySpent();
  if (Array.isArray(offerData) && offerData.length > 0) {
    var offer_str = "";
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];
      offer_str += ("camp_ids[]=" + offDt.trackier_camp_id + "&");
    }

    // Get offer status from trackier
    const axios_header = {
      headers: {
        'x-api-key': process.env.API_KEY,
        'Content-Type': 'application/json'
      }
    };
    var endpoint = "reports/custom"
    // GET OFFER DATA  FROM TREACKIER


    await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_id&group[]=campaign_status&" + offer_str + "zone=Asia/Kolkata", axios_header).then(async (staticsAppRes) => {

      if (typeof staticsAppRes.statusText !== 'undefined' && staticsAppRes.statusText == "OK") {

        for (let j = 0; j < staticsAppRes.data.records.length; j++) {
          let offStatus = staticsAppRes.data.records[j];
          const offStatusData = { 'status': offStatus.campaign_status };
          // console.log(offStatusData);
          await Offer.updateOne({ trackier_camp_id: offStatus.campaign_id }, { '$set': offStatusData }).exec().then((offerRes) => {
            if (!offerRes) {
              const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
              res.status(200).send(resMsg);
              return;
            }
          }).catch(error => {
            const errMsg = { "success": false, "message": error.message };
            res.status(400).send(errMsg);
            return;
          })
        }
        const resMsg = { "success": true, "message": "Offer Status updated!!" };
        res.status(200).send(resMsg);
        return;
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
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}