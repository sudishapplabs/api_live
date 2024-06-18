const express = require("express");
const multer = require('multer');
const multipart = multer();
const { uploadCSV, addAudience, getAudienceData, getAudienceDataById,getAudienceByAdvertiserId,deleteAudience,checkAudienceNameExist,updateAudience } = require("../controllers/audienceController");

const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });
router.post("/audience/csv/upload", isAuthenticatedUser, upload.single('file'), uploadCSV);


router.post("/audience/add", isAuthenticatedUser, upload.single('file'), addAudience);
router.get("/audiences", isAuthenticatedUser, getAudienceData);
router.get("/audience/:id", isAuthenticatedUser, getAudienceDataById);
router.get("/audience/advertiser/:advertiserId", isAuthenticatedUser, getAudienceByAdvertiserId);

router.post("/audience/update/:id", isAuthenticatedUser, upload.single('file'), updateAudience);

router.delete("/audience/delete/:id", isAuthenticatedUser, deleteAudience);
router.post("/audiencename", isAuthenticatedUser, checkAudienceNameExist);



module.exports = router;