const mongoose = require("mongoose");
const validator = require("validator");

const vivoSchema = new mongoose.Schema({

  advertiser_id: {
    type: Number
  },
  remotefeed_id: {
    type: Number
  },
  name: {
    type: String
  },
  pricing_model: {
    type: String
  },
  description: {
    type: String
  },
  impressions_per_ip_requests_only: {
    type: Boolean
  },
  type: {
    type: String
  },
  is_active: {
    type: Boolean
  },
  start_date: {
    type: String
  },
  end_date: {
    type: String
  },
  budget_daily: {
    type: Number
  },
  clicks_per_ip: {
    type: Number
  },
  impressions_per_ip: {
    type: Number
  },
  budget_limiter_type: {
    type: String
  },
  tagid_list_mode: {
    type: String
  },
  offersBLId: {
    type: Number
  },
  offersTier1Id: {
    type: Number
  },
  offersTier2Id: {
    type: Number
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now,
  }
});
module.exports = mongoose.model("vivo_adkernal_campaigns", vivoSchema);