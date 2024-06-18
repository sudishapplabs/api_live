const mongoose = require("mongoose");
const validator = require("validator");

const publisherPayoutSchema = new mongoose.Schema({
  pub_id: {
    type: Number
  },
  publisher: {
    type: String
  },
  Geo: {
    type: String
  },
  pub_avg_po: {
    type: String
  },
  our_po: {
    type: String
  },
  profit: {
    type: Number
  },
  sampling: {
    type: Number
  },
  gross_cap_install: {
    type: Number
  },
  pub_status: {
    type: String
  },
  added_by: {
    type: String
  },
  created_on: {
    type: Number,
    default: Date.now,
  },
  updated_on: {
    type: Number,
    default: Date.now,
  },

}, { collection: 'publishers_payout' });

module.exports = mongoose.model("publishers_payout", publisherPayoutSchema);