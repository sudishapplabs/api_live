const mongoose = require("mongoose");
const validator = require("validator");

var countries = new mongoose.Schema({
  ISO: {
    type: String
  },
  Country: {
    type: String
  },
  States: {
    type: Number
  },
  Status: {
    type: String
  }
});

var regions = new mongoose.Schema({
  ISO: {
    type: String
  },
  Country: {
    type: String
  },
  States: {
    type: Number
  },
  Status: {
    type: String
  }
}, { collection: 'region' });


var cities = new mongoose.Schema({
  Id: {
    type: String
  },
  City: {
    type: String
  }
});


var offline_conversions = new mongoose.Schema({
  created: {
    type: String
  },
  campaign_id: {
    type: String
  },
  publisher_id: {
    type: String
  },
  source: {
    type: String
  },
  country: {
    type: String
  },
  goal_id: {
    type: String
  },
  app_name: {
    type: String
  },
  cr_name: {
    type: String
  },
  currency: {
    type: String
  },
  revenue: {
    type: Number
  },
  txn_id: {
    type: String
  },
  job_status: {
    type: String
  },
  note: {
    type: String
  },
  status: {
    type: String
  },
  job_id: {
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
}, { collection: 'offline_conversions' });


var notifications = new mongoose.Schema({
  advertiser_id: {
    type: Number
  },
  advertiser_name: {
    type: String
  },
  offer_id: {
    type: Number
  },
  offer_name: {
    type: String
  },
  company_name: {
    type: String
  },
  category: {
    type: String
  },
  subject_sa: {
    type: String
  },
  subject_adv: {
    type: String
  },
  message_sa: {
    type: String
  },
  message_adv: {
    type: String
  },
  read: {
    type: Boolean
  },
  date: {
    type: String
  },
  time: {
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
}, { collection: 'notifications' });

var sales_partner = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String
  }
}, { collection: 'sales_partner' });

var country_dial_code = new mongoose.Schema({
  name: {
    type: String
  },
  dial_code: {
    type: String
  },
  code: {
    type: String
  }
}, { collection: 'countryanddialcode' });

var offer_timeline = new mongoose.Schema({
  advertiser_id: {
    type: Number
  },
  advertiser_name: {
    type: String
  },
  offer_id: {
    type: Number
  },
  offer_name: {
    type: String
  },
  type: {
    type: String
  },
  old_value: {
    type: String
  },
  new_value: {
    type: String
  },
  date_time: {
    type: String
  },
  edited_by: {
    type: String
  },
}, { collection: 'offers_timeline' });

const countrySchema = mongoose.model('countries', countries);
const regionsSchema = mongoose.model('region', regions);
const citiesSchema = mongoose.model('cities', cities);
const conversionSchema = mongoose.model('offline_conversions', offline_conversions);
const notificationsSchema = mongoose.model('notifications', notifications);

const salesPartnerSchema = mongoose.model('sales_partner', sales_partner);

const countryDialCodeSchema = mongoose.model('countryanddialcode', country_dial_code);

const offerTimelineSchema = mongoose.model('offers_timeline', offer_timeline);


module.exports = { Country: countrySchema, Region: regionsSchema, City: citiesSchema, Conversion: conversionSchema, Notifications: notificationsSchema, Salespartner: salesPartnerSchema, Countryanddialcode: countryDialCodeSchema,Timeline: offerTimelineSchema }