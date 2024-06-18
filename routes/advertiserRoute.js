const express = require("express");
const { addAdvertiser, updateAdvertiserProfile, getAdvertiserData, registerAdvertiser, updateAdvertiser, advertiserSatatusApproved, getAdvertiserDetailsByAdvId,getAdvertiserMasterData,checkEmailorAdvertiserExist } = require("../controllers/advertiserController");
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();
const axios = require('axios');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});
const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg'
        || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({ storage: storage, fileFilter: filefilter });

router.post("/advertisers", isAuthenticatedUser, getAdvertiserData);
//router.route("/registerAdvertiser").post(registerAdvertiser);

router.post('/advertiser/update/:id', isAuthenticatedUser, upload.single('profile_pic'), updateAdvertiser);

router.post("/advertiser/register", isAuthenticatedUser, registerAdvertiser);
router.post('/advertiser/add', isAuthenticatedUser, upload.single('profile_pic'), addAdvertiser);
router.post("/advertiser/status", isAuthenticatedUser, advertiserSatatusApproved);
router.get("/advertiser/:id", isAuthenticatedUser, getAdvertiserDetailsByAdvId);

router.post("/advertiser/profile", isAuthenticatedUser, updateAdvertiserProfile);

router.get("/master/advertisers", isAuthenticatedUser, getAdvertiserMasterData);


router.post("/advertiser/checkadvoremailexist", isAuthenticatedUser, checkEmailorAdvertiserExist);

module.exports = router;
