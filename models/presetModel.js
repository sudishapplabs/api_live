const mongoose = require("mongoose");
const validator = require("validator");

const presetSchema = new mongoose.Schema({
  reportName: {
    type: String
  },
  reportSubcribe: {
    type: Boolean
  },
  createdBy: {
    type: String
  },
  tid: {
    type: Number
  },
  company_name: {
    type: String
  },
  filters: {
    type: String
  },
  duration: {
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
}, { collection: 'reportPreset' });
module.exports = mongoose.model("reportPreset", presetSchema);