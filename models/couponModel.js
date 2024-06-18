const mongoose = require("mongoose");
const validator = require("validator");

const fundSchema = new mongoose.Schema({
  couponId: {
    type: String
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  coupon_code: {
    type: String
  },
  cashback: {
    type: String
  },
  max_amt: {
    type: Number
  },
  status: {
    type: Boolean
  },
  coupon_status: {
    type: String
  },
  expiry_date: {
    type: String
  },
  coupon_type: {
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
}, { collection: 'fund_coupons' });
module.exports = mongoose.model("fund_coupons", fundSchema);