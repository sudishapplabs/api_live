const express = require("express");
const router = express();
const { isAuthenticatedUser } = require("../middleware/checkUserAuth");

const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

const path = require('path');

router.set('view engine', 'ejs');
router.set('views', path.join(__dirname, '../views'));


const { renderBuyPage, addFund, successPage, cancelPage, funds, addAdminFund } = require("../controllers/fundController");

router.get('/fund/add', isAuthenticatedUser, renderBuyPage);
router.post('/fund/pay', isAuthenticatedUser, addFund);
router.get('/fund/success', successPage);
router.get('/fund/cancel', cancelPage);

router.post('/funds', isAuthenticatedUser, funds);


router.post('/adminfund/add', isAuthenticatedUser, addAdminFund);

module.exports = router;