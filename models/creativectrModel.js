const mongoose = require("mongoose");
const validator = require("validator");

const creativectrSchema = new mongoose.Schema({
  trackier_adv_id: {
    type: Number
  },
  trackier_camp_id: {
    type: Number
  },
  creative_name: {
    type: String
  },
  creative_ctr: {
    type: Number
  }

}, { collection: 'creatives_ctr' });

module.exports = mongoose.model("creatives_ctr", creativectrSchema);