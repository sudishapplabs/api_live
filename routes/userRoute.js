const express = require("express");
const { addUser, loginUser, getUserData, userStatusUpdate,getUserDataById,updateUserProfile } = require("../controllers/userController");
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");
const expressRouter = express.Router();

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

expressRouter.post("/user/login", isAuthenticatedUser, loginUser);
expressRouter.post('/user/add', isAuthenticatedUser, addUser);
expressRouter.post('/users', isAuthenticatedUser, getUserData);
expressRouter.post('/user/status', isAuthenticatedUser, userStatusUpdate);


expressRouter.get('/user/:id', isAuthenticatedUser, getUserDataById);
expressRouter.post('/user/update/:id', isAuthenticatedUser, updateUserProfile);

module.exports = expressRouter;
