const mongoose = require("mongoose");
const validator = require("validator");

const offerSchema = new mongoose.Schema({
  trackier_adv_id: {
    type: Number
  },
  trackier_camp_id: {
    type: Number
  },
  offer_name: {
    type: String
  },
  source_type: {
    type: String
  },
  campaign_type: {
    type: String
  },
  publishers: {

  },
  premium_apps: {

  },
  audience_id: {
    type: String
  },
  MMP: {
    type: String
  },
  bundle_id: {
    type: String
  },
  app_name: {
    type: String
  },
  description: {
    type: String
  },
  preview_url: {
    type: String
  },
  icon: {
    type: String,
  },
  unique_tracker_id: {
    type: String,
  },
  appmetrica_tracking_id: {
    type: String,
  },
  singular_cta_tracking_link: {
    type: String,
  },
  singular_vta_tracking_link: {
    type: String,
  },
  mytracker_tracking_id: {
    type: String,
  },
  app_link: {
    type: String,
  },
  campaign_id: {
    type: String,
  },
  operating_system: {
    type: String
  },
  kpi: {
    type: String
  },
  cta_link_basic: {
    type: String
  },
  vta_link_basic: {
    type: String
  },
  cta_link: {
    type: String
  },
  vta_link: {
    type: String
  },
  goal_budget_type: {
    type: String
  },
  payable_event_name: {
    type: String
  },
  payable_event_price: {
    type: String
  },
  non_payable_event_name: {
    type: String
  },
  non_payable_event_token: {
    type: String
  },
  non_payable_event_price: {
    type: String
  },
  total_budget: {
    type: Number
  },
  daily_budget: {
    type: Number
  },
  today_spent: {
    type: Number
  },
  today_conversion: {
    type: Number
  },
  total_spent: {
    type: Number
  },
  total_conversion: {
    type: Number
  },
  total_click: {
    type: Number
  },
  total_install: {
    type: Number
  },
  today_click: {
    type: Number
  },
  today_install: {
    type: Number
  },
  traffic_start: {
    type: String
  },
  campaign_schedule: {
    type: String
  },
  schedule_start_date: {
    type: String
  },
  schedule_end_date: {
    type: String
  },
  country: {
    type: String
  },
  include_state_city: {
    type: String
  },
  state: {
    type: String
  },
  state_inc_and_exc: {
    type: String
  },
  city: {
    type: String
  },
  city_details: {

  },
  city_inc_and_exc: {
    type: String
  },
  os_version_min: {
    type: String
  },
  os_version_max: {
    type: String
  },
  language: {
    type: String
  },
  interest: {
    type: String
  },
  age_group: {
    type: String
  },
  status: {
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
  multi: {
    type: Boolean
  },
  totCap: {
    type: Boolean
  }
}, { collection: 'campaign_manager' });
module.exports = mongoose.model("campaign_manager", offerSchema);