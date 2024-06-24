const express = require("express");
const multer = require('multer');
const multipart = multer();

const { addCreative, getAllCreativeByOfferId, deleteCreativeById, downloadCreative, uploadCreativeByOfferId, updateCreativeName } = require("../controllers/creativeController");

const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const router = express.Router();

router.post('/creative/add', isAuthenticatedUser, addCreative);
router.get('/offer/creatives/:id', isAuthenticatedUser, getAllCreativeByOfferId);

router.post('/creative/delete', isAuthenticatedUser, deleteCreativeById);


router.get('/creative/download/:id', isAuthenticatedUser, downloadCreative);

const upload = multer({ storage: multer.memoryStorage() })
router.post("/creative/upload", isAuthenticatedUser, upload.single('file'), uploadCreativeByOfferId);

router.post('/creative/name/update', isAuthenticatedUser, updateCreativeName);
module.exports = router;