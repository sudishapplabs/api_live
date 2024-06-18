const mongoose = require("mongoose");
const validator = require("validator");

const applistSchema = new mongoose.Schema({

  tid: {
    type: Number
  },
  user_email: {
    type: String
  },
  user_type: {
    type: String
  },
  audience_type: {
    type: String
  },
  audience_name: {
    type: String
  },
  bundle_id: {
    type: String
  },
   app_name: {
    type: String
  },
  os_version: {
    type: Number
  },
  audience_api_key: {
    type: String
  },
  csv_file_name: {
    type: String
  },
  csv_link: {
    type: String
  },
  geo: {

  },
  gender: {

  },
  language: {

  },
  age_group: {

  },
  interest: {

  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'audiences' });

module.exports = mongoose.model("audiences", applistSchema);