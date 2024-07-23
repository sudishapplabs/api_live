const mongoose = require("mongoose");
const validator = require("validator");

const userregisterSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: [true, "Please Enter Company Name"],
    minlength: [20, "Name maxlength is 50 characters"],
    minlength: [2, "Please enter more than 2 characters"],
  },
  name: {
    type: String,
    required: [true, "Please Enter Advertiser Name"],
    minlength: [20, "Name maxlength is 50 characters"],
    minlength: [2, "Please enter more than 2 characters"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please Enter Email"],
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  mobile: {
    type: String,
    required: [true, "Please Enter Contact Number"],
  },
  comment: {
    type: String
  },
  user_type: {
    type: String
  },
  profile_status: {
    type: String
  },
  status: {
    type: Boolean
  },
  tid: {
    type: Number
  },
  signup_country: {
    type: String
  },
  balance: {
    type: Number
  },
  permissions: {
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now,
  }
}, { collection: 'users' });
module.exports = mongoose.model("Userregister", userregisterSchema);
