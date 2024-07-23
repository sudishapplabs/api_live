const express = require("express");
const { addCampaign } = require("../controllers/oppoController");
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();


router.post('/oppo/add', isAuthenticatedUser, addCampaign);

module.exports = router;
