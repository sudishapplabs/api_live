const Coupon = require("../models/couponModel");
var sprintf = require('sprintf-js').sprintf;


// request.body Add coupans
exports.addCoupon = async (req, res) => {
    const { name, email, coupon_code, cashback, max_amt, status, coupon_status, expiry_date, coupon_type } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!cashback || !max_amt || !expiry_date || !coupon_type) {
        var requestVal = "";
        if (!cashback) {
            var requestVal = "cashback";
        } else if (!max_amt) {
            var requestVal = "max_amt";
        } else if (!expiry_date) {
            var requestVal = "expiry_date";
        } else if (!coupon_type) {
            var requestVal = "coupon_type";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    const totCoupon = await Coupon.count({});
    const totalCoupon = (parseInt(totCoupon) + 1);
    const couponId = sprintf('%04d', totalCoupon);

    const coupon = new Coupon({
        couponId: couponId,
        name: name,
        email: email,
        coupon_code: coupon_code,
        cashback: cashback,
        max_amt: max_amt,
        coupon_status: coupon_status,
        status: status,
        expiry_date: expiry_date,
        coupon_type: coupon_type
    });

    // Save Coupon in the database
    coupon.save(coupon).then(DBdata => {
        const resData = { 'success': true, 'message': "New coupon code added!", 'results': DBdata };
        res.status(200).send(resData);
        return
    }).catch(err => {
        const resData = { 'success': false, 'message': "" + err.message };
        res.status(400).send(resData);
        return;
    });
};



// Get Coupon Data
exports.getCouponsData = async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = parseInt((page - 1) * limit);

    const { searchQuery, sorttype, sortdirection, coupon_code, status } = req.body;

    if (sorttype && sortdirection) {
        var sortObject = {};
        var stype = sorttype;
        var sdir = sortdirection;
        sortObject[stype] = sdir;
    } else {
        var sortObject = {};
        var stype = '_id';
        var sdir = -1;
        sortObject[stype] = sdir;
    }


    var filter = {};
    if (typeof coupon_code !== "undefined" && coupon_code !== "") {
        filter['coupon_code'] = coupon_code;
    }

    if (typeof status !== "undefined" && status !== "") {
        if (status == "true") {
            filter['status'] = true;
        } else {
            filter['status'] = false;
        }
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
        Object.assign(filter, {
            $or: [{ 'couponId': { '$regex': searchQuery, $options: 'i' } }, { 'name': { '$regex': searchQuery, $options: 'i' } }, { 'coupon_code': { '$regex': searchQuery, $options: 'i' } }, { 'coupon_type': { '$regex': searchQuery, $options: 'i' } }]
        });
    }

    let result = await Coupon.find(filter).sort(sortObject).exec();
    var totalCoupon = parseInt(result.length);


    await Coupon.find(filter).sort(sortObject).skip(skipIndex).limit(limit).exec().then((notRes) => {
        if (notRes) {
            const response = { 'success': true, 'totoalRecords': totalCoupon, 'results': notRes };
            res.status(200).send(response);
            return;
        } else {
            const resMsg = { "success": false, "message": "No records found" };
            res.status(200).send(resMsg);
            return;
        }
    }).catch(error => {
        console.log(error);
        const response = { 'success': false, 'error': error };
        res.status(400).send(response);
        return;
    });
};



exports.changeCoupanStatus = (req, res) => {
    const { couponId, coupon_status, approved_by, approved_by_email } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!couponId || !coupon_status || !approved_by || !approved_by_email) {
        var requestVal = "";
        if (!couponId) {
            var requestVal = "couponId";
        } else if (!coupon_status) {
            var requestVal = "coupon_status";
        } else if (!approved_by) {
            var requestVal = "approved_by";
        } else if (!approved_by_email) {
            var requestVal = "approved_by_email";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(couponId)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "couponId should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(couponId) && couponId.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "couponId is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }
    for (let i = 0; i < couponId.length; i++) {
        let _id = couponId[i];
        Coupon.findByIdAndUpdate(_id, { 'coupon_status': coupon_status }, { new: true }).exec().then(async (resStatus) => {
            if (!resStatus) {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log('JKL');
            console.log(error);
            const reMsg = { "status": false, "message": error };
            res.status(400).send(reMsg);
            return;
        })
    }
    const response = { 'success': true, 'message': 'Status successfully updated.' };
    res.status(200).send(response);
    return;
}


exports.changeCoupanStatusAcInc = (req, res) => {
    const { couponId, status, approved_by, approved_by_email } = req.body;

    if (typeof status !== "undefined" && status !== "") {
        if (status == "true") {
            var statusDt = true;
        } else {
            var statusDt = false;
        }
    }
    if (!Array.isArray(couponId)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "couponId should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(couponId) && couponId.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "couponId is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }
    for (let i = 0; i < couponId.length; i++) {
        let _id = couponId[i];
        Coupon.findByIdAndUpdate(_id, { 'status': statusDt }, { new: true }).exec().then(async (resStatus) => {
            if (!resStatus) {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log('JKL');
            console.log(error);
            const reMsg = { "status": false, "message": error };
            res.status(400).send(reMsg);
            return;
        })
    }
    const response = { 'success': true, 'message': 'Status successfully updated.' };
    res.status(200).send(response);
    return;
}

