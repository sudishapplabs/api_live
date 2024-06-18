const express = require("express");
const { staticsData, quickViewData, quickViewDataPerandEvent, dashboardPerformanceEvent, dashboardSourceGeo, dashboardSourceAppList, dashboardTopCreatives,addPreset, getPresetData, dashboardTopHeader,presetsubscribeandunsubscribe,getPresetDataByAdvid,getPresetDataByEmailID} = require("../controllers/staticsController");

const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();

router.post("/statics", isAuthenticatedUser, staticsData);
router.post("/quickview", isAuthenticatedUser, quickViewData);
router.post("/quickviewEvent", isAuthenticatedUser, quickViewDataPerandEvent);

router.post("/statics/dashboardtopdata", isAuthenticatedUser, dashboardTopHeader);


router.post("/dashboardSourceGeo", isAuthenticatedUser, dashboardSourceGeo);
router.post("/dashboardSourceAppList", isAuthenticatedUser, dashboardSourceAppList);
router.post("/dashboardPerformanceEvent", isAuthenticatedUser, dashboardPerformanceEvent);
router.post("/dashboardTopCreatives", isAuthenticatedUser, dashboardTopCreatives);

router.post("/preset/add", isAuthenticatedUser, addPreset);
router.post("/preset/list", isAuthenticatedUser, getPresetData);

router.post("/preset/subandunsub", isAuthenticatedUser, presetsubscribeandunsubscribe);

router.post("/preset/advertiser/:advertiserId", isAuthenticatedUser, getPresetDataByAdvid);

router.post("/preset/email", isAuthenticatedUser, getPresetDataByEmailID);


module.exports = router;