const mongoose = require("mongoose");
const validator = require("validator");

const publisherSchema = new mongoose.Schema({
  pub_company_name: {
    type: String
  },
  pub_name: {
    type: String
  },
  pub_id: {
    type: String
  },
  revenue_share: {
    type: String
  },
  raised: {
    type: Number
  },
  cutback: {
    type: Number
  },
  pub_details: {
    type: String
  },
  countries: {
    type: String
  },
  pub_website: {
    type: String
  },
  appsflyer_site_id: {
    type: String
  },
  enable_s2s: {
    type: String
  },
  wl_s2s: {
    type: String
  },
  pub_status: {
    type: String
  },
  exclude_publisher: {
    type: String
  },
  enable_os_targeting: {
    type: String
  },
  icon: {
    type: String
  },
  added_by: {
    type: String
  },
  created_on: {
    type: Number,
    default: Date.now
  },
  updated_on: {
    type: Number,
    default: Date.now
  }
}, { collection: 'publishers' });
module.exports = mongoose.model("publishers", publisherSchema);