const Publisherpayout = require("../../models/publisherspayoutModel");
const Publisher = require("../../models/publisherModel");
const { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, generateOTP, dateprint } = require('../../common/helper');


// request.body
exports.addPublisherpayout = async (req, res) => {
    const { pub_id, publisher, Geo, pub_avg_po, profit, gross_cap_install, pub_status, added_by } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!pub_id || !publisher || !Geo || !pub_avg_po || !profit || !gross_cap_install) {
        var requestVal = "";
        if (!pub_id) {
            var requestVal = "pub_id";
        } else if (!publisher) {
            var requestVal = "publisher";
        } else if (!Geo) {
            var requestVal = "Geo";
        } else if (!pub_avg_po) {
            var requestVal = "pub_avg_po";
        } else if (!profit) {
            var requestVal = "profit";
        } else if (!gross_cap_install) {
            var requestVal = "gross_cap_install";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(Geo)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Geo should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(Geo) && Geo.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Geo is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    const geoString = Geo.join(',');
    const publishepayout = new Publisherpayout({
        pub_id: pub_id,
        publisher: publisher,
        Geo: geoString,
        pub_avg_po: pub_avg_po,
        profit: profit,
        gross_cap_install: gross_cap_install,
        pub_status: pub_status,
        added_by: added_by
    });

    // Save Publisher Payout in the database
    publishepayout.save(publishepayout).then(DBdata => {
        const resData = { 'success': true, 'message': "Publisher Payout added successfully!", 'results': DBdata };
        res.status(200).send(resData);
        return
    }).catch(err => {
        const resData = { 'success': false, 'message': "" + err.message };
        res.status(400).send(resData);
        return;
    });
};


// Get Publisher Payout Data
exports.getPublisherPayoutData = async (req, res) => {


    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = parseInt((page - 1) * limit);

    const { searchQuery, sorttype, sortdirection, pub_status, Geo } = req.body;

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
    if (typeof pub_status !== "undefined" && pub_status !== "") {
        filter['pub_status'] = pub_status;
    }
    if (typeof enable_s2s !== "undefined" && enable_s2s !== "") {
        filter['enable_s2s'] = enable_s2s;
    }
    if (typeof wl_s2s !== "undefined" && wl_s2s !== "") {
        filter['wl_s2s'] = wl_s2s;
    }

    if (Array.isArray(Geo) && Geo.length > 0) {
        const c_string = Geo.join(',');

        Object.assign(filter, {
            $or: [{ '$text': { '$search': `${c_string}` } }]
        });
    }


    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
        var searchId = "";
        if (searchQuery && isNumeric(searchQuery) && num !== '0') {
            searchId = parseInt(searchQuery);
            filter['pub_id'] = searchId;
        } else {
            Object.assign(filter, {
                $or: [{ 'publisher': { '$regex': searchQuery, $options: 'i' } }, { 'Geo': { '$regex': searchQuery, $options: 'i' } }, { 'pub_status': { '$regex': searchQuery, $options: 'i' } }, { 'added_by': { '$regex': searchQuery, $options: 'i' } }]
            });
        }
    }

    let result = await Publisherpayout.find(filter).sort(sortObject).exec();
    var totalPubPayout = parseInt(result.length);


    await Publisherpayout.find(filter).sort(sortObject).skip(skipIndex).limit(limit).exec().then(async (notRes) => {
        if (notRes) {

            var pubPayoutArr = [];
            for (let i = 0; i < notRes.length; i++) {
                let payOutDt = notRes[i];

                let pub = await Publisher.findOne({ pub_id: payOutDt.pub_id.toString() }).sort(sortObject).exec();

                if (pub) {
                    var pubIcon = pub.icon
                } else {
                    var pubIcon = "";
                }

                pubPayoutArr.push({
                    _id: payOutDt._id,
                    pub_id: payOutDt.pub_id,
                    publisher: payOutDt.publisher,
                    Geo: payOutDt.Geo,
                    pub_avg_po: payOutDt.pub_avg_po,
                    our_po: payOutDt.our_po,
                    profit: payOutDt.profit,
                    sampling: payOutDt.sampling,
                    gross_cap_install: payOutDt.gross_cap_install,
                    pub_status: payOutDt.pub_status,
                    added_by: payOutDt.added_by,
                    created_on: payOutDt.created_on,
                    updated_on: payOutDt.updated_on,
                    icon: pubIcon
                })
            }

            const response = { 'success': true, 'totoalRecords': totalPubPayout, 'results': pubPayoutArr };
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

// Get Publisher Data by id
exports.getPublisherPayoutDataById = (req, res) => {
    const id = req.params.id;
    Publisherpayout.findById(id).sort({ _id: -1 }).exec().then((pubPayout) => {
        if (pubPayout) {
            const response = { 'success': true, 'results': pubPayout };
            res.status(200).send(response);
            return;
        } else {
            const response = { 'success': false, 'results': 'No records found!' };
            res.status(200).send(response);
            return;
        }
    }).catch(error => {
        const response = { 'success': false, 'error': error['message'] };
        res.status(400).send(response);
        return;
    });
};


// find by id and update
exports.updatePublisherpayout = (req, res) => {

    const _id = req.params.id;
    const { pub_id, publisher, Geo, pub_avg_po, profit, gross_cap_install } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!pub_id || !publisher || !Geo || !pub_avg_po || !profit || !gross_cap_install) {
        var requestVal = "";
        if (!pub_id) {
            var requestVal = "pub_id";
        } else if (!publisher) {
            var requestVal = "publisher";
        } else if (!Geo) {
            var requestVal = "Geo";
        } else if (!pub_avg_po) {
            var requestVal = "pub_avg_po";
        } else if (!profit) {
            var requestVal = "profit";
        } else if (!gross_cap_install) {
            var requestVal = "gross_cap_install";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(Geo)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Geo should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(Geo) && Geo.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Geo is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }
    const countryString = Geo.join(',');
    req.body.Geo = countryString;
    Publisherpayout.findByIdAndUpdate(_id, req.body, { new: true, upsert: true }).exec().then((payoutRes) => {
        if (payoutRes) {
            const response = { 'success': true, 'results': payoutRes };
            res.status(200).send(response);
            return;
        } else {
            const response = { 'success': false, 'results': 'No records found!' };
            res.status(200).send(response);
            return;
        }
    }).catch(error => {
        const response = { 'success': false, 'error': error['message'] };
        res.status(400).send(response);
        return;
    });
};

exports.changePublisherPayoutStatus = (req, res) => {
    const { payoutId, pub_status, approved_by, approved_by_email } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!payoutId || !pub_status || !approved_by || !approved_by_email) {
        var requestVal = "";
        if (!payoutId) {
            var requestVal = "payoutId";
        } else if (!pub_status) {
            var requestVal = "pub_status";
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

    if (!Array.isArray(payoutId)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payoutId should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(payoutId) && payoutId.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payoutId  is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    for (let i = 0; i < payoutId.length; i++) {
        let _id = payoutId[i];
        Publisherpayout.findByIdAndUpdate(_id, { 'pub_status': pub_status }, { new: true }).exec().then(async (resStatus) => {
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

