const express = require("express");
const { addCampaign } = require("../controllers/xiaomiController");
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();


router.post('/xiaomi/add', isAuthenticatedUser, addCampaign);

module.exports = router;
