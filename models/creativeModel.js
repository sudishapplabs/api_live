const mongoose = require("mongoose");
const validator = require("validator");

var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

const offerSchema = new mongoose.Schema({
  campaign_id: {
    type: ObjectId
  },
  trackier_adv_id: {
    type: Number
  },
  trackier_camp_id: {
    type: Number
  },
  creative: {
    type: String
  },
  creative_type: {
    type: String
  },
  concept_name: {
    type: String
  },
  image_dimension: {
    type: String
  },
  ads_end_date: {
    type: String
  },
  ads: {
    type: String
  },
  user: {
    type: String
  },
  expired: {
    type: String
  },
  created_on: {
    type: Number,
    default: Date.now,
  },
  updated_on: {
    type: Number,
    default: Date.now,
  }

});

module.exports = mongoose.model("creatives", offerSchema);