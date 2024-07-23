const mongoose = require("mongoose");
const validator = require("validator");

const advertiserSchema = new mongoose.Schema({
  profile_pic: {
    type: String
  },
  name: {
    type: String,
  },
  organization: {
    type: String,
  },
  website: {
    type: String
  },
  email: {
    type: String,
  },
  mobile: {
    type: String
  },
  im_id: {

  },
  address: {
    type: String
  },
  state: {
    type: String
  },
  country: {
    type: String
  },
  zip: {
    type: String
  },
  email_preferences: {
    type: Boolean
  },
  assigned_to: {

  },
  tid: {
    type: Number
  },
  users: {

  },
  availed_coupons: {

  },
  balance: {
    type: Number
  },
  billing_detail: {

  },
  created_on: {
    type: Number,
    default: Date.now,
  },
  updated_on: {
    type: Number,
    default: Date.now,
  }
}, { collection: 'advertiser' });
module.exports = mongoose.model("advertiser", advertiserSchema);