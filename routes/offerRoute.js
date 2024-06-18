const express = require("express");
const { addOffer, getOfferData, getOfferDataByOfferId, changeOfferStatus, getDashboardOfferStatus, getDashboardTopOffers, getOfferMasterData, getOfferMasterDataByAdvId,updateOffer,getOfferMasterDataByMutipleAdvId, getTimeLineData } = require("../controllers/offerController");

const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();

router.post('/offer/add', isAuthenticatedUser, addOffer);
router.post("/offers", isAuthenticatedUser, getOfferData);
router.get("/offer/:id", isAuthenticatedUser, getOfferDataByOfferId);
router.post('/offer/status', isAuthenticatedUser, changeOfferStatus);
router.get('/offer/dashboard/offerwithstatus', isAuthenticatedUser, getDashboardOfferStatus);
router.post('/offer/dashboard/topoffers', isAuthenticatedUser, getDashboardTopOffers);

router.get("/master/offers", isAuthenticatedUser, getOfferMasterData);

router.post('/offer/update/:id', isAuthenticatedUser, updateOffer);

router.get("/master/advertiser/offers/:id", isAuthenticatedUser, getOfferMasterDataByAdvId);

router.post("/master/multiAdvertiser/offers", isAuthenticatedUser, getOfferMasterDataByMutipleAdvId);

router.post('/offer/timeline/', isAuthenticatedUser, getTimeLineData);




module.exports = router;