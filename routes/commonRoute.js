const express = require("express");
const multer = require('multer');
const multipart = multer();
const { getCountry, getSalesPartner, getStateByCountry, citySearch, getPublisherByCountry, getLanguageByCountry, getInterestByCountry, getGeoWisePrice, checkOffernameExist, addConversionlist, uploadImagesFromBase64, getApplists, getAllInterest, getApplistsByInterest, getAllFlagDialCode, getFlagByDialCode, getGoalByofferId, uploadCreatives } = require("../controllers/commonController");

const { addPublisher, getPublishersData, getPublisherDataById, updatePublisher, changePublisherStatus } = require("../controllers/masters/publisherController");
const { addPublisherpayout, getPublisherPayoutData, getPublisherPayoutDataById, updatePublisherpayout, changePublisherPayoutStatus } = require("../controllers/masters/publisherpayoutController");
const { addCoupon, getCouponsData, changeCoupanStatus, changeCoupanStatusAcInc } = require("../controllers/couponController");

const { addApplist } = require("../controllers/masters/applistController");
const { uploadConversions } = require("../controllers/CronJob/conversionuploadController");

const { getNotificationData, updateNotificationStatus } = require("../controllers/notificationController");

const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();


router.get("/country", isAuthenticatedUser, getCountry);
router.get("/sales", isAuthenticatedUser, getSalesPartner);
router.get("/state", isAuthenticatedUser, getStateByCountry);
router.get("/city", isAuthenticatedUser, citySearch);
router.post("/publishers", isAuthenticatedUser, getPublisherByCountry);
router.post("/apps/applist", isAuthenticatedUser, getApplists);

router.post("/interest/applist", isAuthenticatedUser, getApplistsByInterest);

router.post("/language", isAuthenticatedUser, getLanguageByCountry);
router.post("/interest", isAuthenticatedUser, getInterestByCountry);
router.get("/interest/all", isAuthenticatedUser, getAllInterest);
router.get("/geoprice", isAuthenticatedUser, getGeoWisePrice);
router.post("/offername", isAuthenticatedUser, checkOffernameExist);
router.post("/publisher/add", isAuthenticatedUser, addPublisher);
router.post("/publishers/all", isAuthenticatedUser, getPublishersData);
router.get("/publisher/:id", isAuthenticatedUser, getPublisherDataById);
router.post("/publisher/update/:id", isAuthenticatedUser, updatePublisher);
router.post("/publisher/status", isAuthenticatedUser, changePublisherStatus);

router.post("/publisherpayout/add", isAuthenticatedUser, addPublisherpayout);
router.post("/publisherpayouts", isAuthenticatedUser, getPublisherPayoutData);
router.get("/publisherpayout/:id", isAuthenticatedUser, getPublisherPayoutDataById);
router.post("/publisherpayout/update/:id", isAuthenticatedUser, updatePublisherpayout);
router.post("/publisherpayout/status", isAuthenticatedUser, changePublisherPayoutStatus);


router.get("/common/offer/goals/:id", isAuthenticatedUser, getGoalByofferId)

router.get("/countrydialcode/", isAuthenticatedUser, getAllFlagDialCode);
router.post("/countrydialcode/flag", isAuthenticatedUser, getFlagByDialCode);

router.post("/coupon/add", isAuthenticatedUser, addCoupon);
router.post("/coupons", isAuthenticatedUser, getCouponsData);
router.post("/coupon/status", isAuthenticatedUser, changeCoupanStatus);

router.post("/coupon/statusAcInc", isAuthenticatedUser, changeCoupanStatusAcInc);


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post("/applist/add", isAuthenticatedUser, upload.single('file'), addApplist);

router.post("/conversionlist/add", isAuthenticatedUser, upload.single('file'), addConversionlist);


router.post("/creatives/upload", isAuthenticatedUser, upload.fields([
    { name: 'creative', maxCount: 50 },
    { name: 'icon', maxCount: 50 }
]), uploadCreatives);

router.get("/CronJob/conversionUpload", uploadConversions);


router.post("/imageUploadBase64/upload", isAuthenticatedUser, uploadImagesFromBase64);


router.post('/notifications', isAuthenticatedUser, getNotificationData);
router.post('/notification/status/update', isAuthenticatedUser, updateNotificationStatus);





module.exports = router;