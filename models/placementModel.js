const mongoose = require("mongoose");
const validator = require("validator");

const placeMentsSchema = new mongoose.Schema({
  placement_id: {
    type: String
  },
  name: {
    type: String
  }
}, { collection: 'placements' });
module.exports = mongoose.model("placements", placeMentsSchema);