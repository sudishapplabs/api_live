const mongoose = require("mongoose");
const validator = require("validator");

const applistSchema = new mongoose.Schema({
  AppBundle: {
    type: String
  },
  App_Name: {
    type: String
  },
  CPM: {
    type: String
  },
  CTR: {
    type: Number
  },
  Category: {
    type: String
  },
  Geo: {
    type: String
  },
  Google_Play_Rating: {
    type: String
  },
  Insert_Ratio: {
    type: Number
  },
  Installs: {
    type: String
  },
  Language: {
    type: String
  },
  OS: {
    type: String
  },
  Playstore_URL: {
    type: String
  },
  Reach: {
    type: String
  },
  Region: {
    type: String
  },
  Region: {
    type: String
  },
  Tier: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'app_list' });

module.exports = mongoose.model("app_list", applistSchema);