const mongoose = require("mongoose");
const validator = require("validator");

const fundSchema = new mongoose.Schema({
  tid: {
    type: Number
  },
  email: {
    type: String
  },
  amount: {
    type: Number
  },
  comment: {
    type: String
  },
  payment_id: {
    type: Number
  },
  paypal_payment_id: {
    type: String
  },
  action: {
    type: String
  },
  description: {
    type: String
  },
  payment_status: {
    type: String
  },
  mode: {
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

module.exports = mongoose.model("funds", fundSchema);