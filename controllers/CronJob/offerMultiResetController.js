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


exports.multiReset = async (req, res) => {

  try {
    const dataMulArr = { 'multi': false, 'today_spent': 0, 'today_conversion': 0 }
    // UPDATE DB TODAY SPENT AND CONVERSION
    // await Offer.findOneAndUpdate({ trackier_camp_id: campaign_id }, dataMulArr, { new: true }).exec().then((recordRes) => {
    //   console.log('Multi Reset Update Request');
    //   if (!recordRes) {
    //     console.log('Multi Reset Update Response');
    //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
    //     res.status(200).send(resMsg);
    //     return;
    //   }
    // }).catch((error) => {
    //   const reMsg = { "status": false, "message": error.message };
    //   res.status(400).send(reMsg);
    // });
  } catch (err) {
    console.log(err);
  }

  try {
    const dataTotArr = { 'totCap': false, 'today_spent': 0, 'today_conversion': 0 }
    // UPDATE DB TODAY SPENT AND CONVERSION
    // await Offer.findOneAndUpdate({ trackier_camp_id: campaign_id }, dataTotArr, { new: true }).exec().then((recordRes) => {
    //   console.log('total cap Update Request');
    //   if (!recordRes) {
    //     console.log('total cap Reset Update Response');
    //     const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
    //     res.status(200).send(resMsg);
    //     return;
    //   }
    // }).catch((error) => {
    //   const reMsg = { "status": false, "message": error.message };
    //   res.status(400).send(reMsg);
    // });
  } catch (err) {
    console.log(err);
  }

}