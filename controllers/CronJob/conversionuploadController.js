var { Conversion } = require("../../models/commonModel");
const { getAllofflineConversion } = require("../../common/common");
const axios = require('axios');

exports.uploadConversions = async (req, res) => {
  const cnvData = await getAllofflineConversion();

  if (Array.isArray(cnvData) && cnvData.length > 0) {
    var conversionUploadData = [];
    for (let i = 0; i < cnvData.length; i++) {
      let cnv = cnvData[i];

      conversionUploadData.push({
        "created": cnv.created,
        "campaign_id": cnv.campaign_id,
        "publisher_id": cnv.publisher_id,
        "source": cnv.source,
        "country": cnv.country,
        "goal_id": cnv.goal_id,
        "app_name": cnv.app_name,
        "cr_name": cnv.cr_name,
        "currency": cnv.currency,
        "txn_id": cnv.txn_id,
        "note": cnv.note,
        "revenue": parseFloat(cnv.revenue)
      });


      if (conversionUploadData[i]['source'].length == 0) {
        delete conversionUploadData[i]['source'];
      }
      if (conversionUploadData[i]['app_name'].length == 0) {
        delete conversionUploadData[i]['app_name'];
      }
      if (conversionUploadData[i]['cr_name'].length == 0) {
        delete conversionUploadData[i]['cr_name'];
      }
      if (conversionUploadData[i]['goal_id'].length == 0 || conversionUploadData[i]['goal_id'] == "0" || conversionUploadData[i]['goal_id'] == "") {
        delete conversionUploadData[i]['goal_id'];

      }
      let _id = cnv._id;
      const convProcessing = { 'job_status': "processing" };
      await Conversion.findByIdAndUpdate({ _id }, { '$set': convProcessing }, { new: true }).exec().then(async (resCnv) => {
        if (!resCnv) {
          const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
          res.status(200).send(resMsg);
          return;
        }
      }).catch((error) => {
        const resMsg = { "status": false, "message": error.message };
        res.status(400).send(resMsg);
        return;
      });
    }
    // create offer on trackier
    const axios_header = {
      headers: {
        'x-api-key': process.env.API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const conversionData = { 'data': conversionUploadData, 'fetchIpDetails': true };
    await axios.post(process.env.API_BASE_URL + "conversions/bulkUpload", conversionData, axios_header).then(async (resCnv) => {
      if (typeof resCnv.data.success !== 'undefined' && resCnv.data.success == true) {
        for (let j = 0; j < cnvData.length; j++) {
          let cnvs = cnvData[j];
          const conversionJobData = { 'job_id': resCnv.data.job.id, 'job_status': resCnv.data.job.status };
          await Conversion.findByIdAndUpdate({ _id: cnvs._id }, { '$set': conversionJobData }).exec().then((convJob) => {
            if (!convJob) {
              const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
              res.status(200).send(resMsg);
              return;
            }
          }).catch(error => {
            const errMsg = { "success": false, "message": error };
            res.status(400).send(errMsg);
            return;
          })
        }
      } else {
        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
        res.status(200).send(resMsg);
        return;
      }
    }).catch(err => {
      console.log(err);
      const errMsg = { "success": false, "errors": err };
      res.status(400).send(errMsg);
    });
    const resMsg = { "success": true, "message": "Conversion uploaded!!" };
    res.status(200).send(resMsg);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}