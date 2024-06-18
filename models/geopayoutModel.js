const mongoose = require("mongoose");
const validator = require("validator");

const geoPayoutSchema = new mongoose.Schema({
  geo: {
    type: String
  },
  price: {
    type: Number
  }

}, { collection: 'geo_payout' });

module.exports = mongoose.model("geo_payout", geoPayoutSchema);