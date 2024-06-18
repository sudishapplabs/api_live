const express = require("express");
const { addCampaign } = require("../controllers/vivoController");
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();


router.post('/vivo/add', isAuthenticatedUser, addCampaign);

module.exports = router;
