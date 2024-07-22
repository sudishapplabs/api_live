const Offer = require("../../models/offerModel");
const { getAllOffersByTrafficStart, getAdertiseDetailsByAdvId, getAllOffersByStatus } = require("../../common/common");
const { padTo2Digits, number_format, isEmpty, dateprint } = require("../../common/helper");

const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");
const { isArray } = require("util");


exports.getAllOffersLowBalance = async (req, res) => {
  const offerData = await getAllOffersByStatus();

  if (Array.isArray(offerData) && offerData.length > 0) {
    var dataArr = [];
    for (let i = 0; i < offerData.length; i++) {
      let offDt = offerData[i];

      let totalBalance = offDt.total_budget;
      let totalSpent = offDt.total_spent;

      let percentage = Math.round(parseFloat(totalSpent) / parseFloat(totalBalance) * 100);
      if (percentage > 80) {
        let balance = (parseInt(totalBalance) - parseFloat(totalSpent));

        let avBalance = Math.round(balance * 100) / 100;
        let avTotalSpent = Math.round(totalSpent * 100) / 100;
        let avTotalBalance = Math.round(totalBalance * 100) / 100;

        const advDt = await getAdertiseDetailsByAdvId(parseInt(offDt.trackier_adv_id));
        dataArr.push({ offerId: offDt.trackier_camp_id, offerName: offDt.offer_name, advertiserId: offDt.trackier_adv_id, advertiserName: advDt.advName, totalBudget: avTotalBalance, totalSpent: avTotalSpent, availableBalace: avBalance });
      }
    }

    if (Array.isArray(dataArr) && dataArr.length > 0) {

      // Send Mail to Admin
      const admin_mail = process.env.ADMIN_EMAILS.split(",");
      const bcc_mail = process.env.BCC_EMAILS.split(",");
      const emailTemplateAdmin = fs.readFileSync(path.join("templates/all_offer_low_balance_admin.handlebars"), "utf-8");
      const templateAdmin = handlebars.compile(emailTemplateAdmin);
      const messageBodyAdmin = (templateAdmin({
        todayDate: dateprint(),
        data: dataArr,
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
        bcc: bcc_mail,
        subject: 'Applabs Alert - Offers Consumed > 80% Budget - ' + dateprint(),
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
    const response = { 'success': true, 'message': 'All offer Low balance mail sent' };
    res.status(200).send(response);
    return;
  } else {
    const errMsg = { "success": false, "message": "No records availabe" };
    res.status(200).send(errMsg);
    return;
  }

}