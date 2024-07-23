const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  profile_pic: {
    type: String,
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  company_name: {
    type: String
  },
  contact: {
    type: String
  },
  comment: {
    type: String
  },
  user_type: {
    type: String
  },
  status: {
    type: Boolean
  },
  profile_status: {
    type: String
  },
  permissions: {

  },
  signup_country: {
    type: String
  },
  tid: {
    type: Number
  },
  im_id: {

  },
  designation: {
    type: String
  },
  last_login: {
    type: Number
  },
  last_login_ip: {
    type: String
  }, created_on: {
    type: Number,
    default: Date.now,
  },
  updated_on: {
    type: Number,
    default: Date.now,
  },
}, { collection: 'users' });
module.exports = mongoose.model("users", userSchema);
