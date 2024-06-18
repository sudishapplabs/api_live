const Publisher = require("../../models/publisherModel");


const aws = require("aws-sdk");
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

var signatures = {
    JVBERi0: "application/pdf",
    R0lGODdh: "image/gif",
    R0lGODlh: "image/gif",
    iVBORw0KGgo: "image/png",
    "/9j/": "image/jpg"
};

function detectMimeType(b64) {
    for (var s in signatures) {
        if (b64.indexOf(s) === 0) {
            return signatures[s];
        }
    }
}

// request.body
exports.addPublisher = async (req, res) => {
    const { pub_company_name, pub_name, pub_id, revenue_share, raised, cutback, pub_details, countries, pub_website, appsflyer_site_id, enable_s2s, wl_s2s, pub_status, exclude_publisher, enable_os_targeting, icon, icon_img, added_by } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!pub_company_name || !pub_name || !pub_id || !revenue_share || !raised || !cutback || !pub_details || !countries || !appsflyer_site_id) {
        var requestVal = "";
        if (!pub_company_name) {
            var requestVal = "pub_company_name";
        } else if (!pub_name) {
            var requestVal = "pub_name";
        } else if (!pub_id) {
            var requestVal = "pub_id";
        } else if (!revenue_share) {
            var requestVal = "revenue_share";
        } else if (!raised) {
            var requestVal = "raised";
        } else if (!cutback) {
            var requestVal = "cutback";
        } else if (!pub_details) {
            var requestVal = "pub_details";
        } else if (!countries) {
            var requestVal = "countries";
        } else if (!appsflyer_site_id) {
            var requestVal = "appsflyer_site_id";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(countries)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "countries should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(countries) && countries.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "countries is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }


    let data_val = icon_img.replace(/^data:image\/[a-z]+;base64,/, "");
    let data_name = icon;
    let mimetype = detectMimeType(icon_img);
    // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
    const buffer = Buffer.from(data_val, "base64");
    const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
    let s3 = new aws.S3({
        credentials: {
            accessKeyId: BUCKET_ACCESS_ID,
            secretAccessKey: BUCKET_SECRET
        },
        region: BUCKET_REGION
    });
    const putobj = {
        Bucket: "applabs2024",
        Key: data_name,
        Body: buffer,
        ContentType: mimetype,
        acl: "private"
    }
    s3.upload(putobj, function (err, data) {
        if (err) {
            console.log("Error", err)
            const erroData = { 'success': false, 'error': err };
            res.status(400).send(erroData);
            return;
        } else {
            data && console.log("Upload success", data);
        }
    })


    const countryString = countries.join(',');
    const publisher = new Publisher({
        pub_company_name: pub_company_name,
        pub_name: pub_name,
        pub_id: pub_id,
        revenue_share: revenue_share,
        raised: raised,
        cutback: cutback,
        pub_details: pub_details,
        countries: countryString,
        pub_website: pub_website,
        appsflyer_site_id: appsflyer_site_id,
        enable_s2s: enable_s2s,
        wl_s2s: wl_s2s,
        pub_status: pub_status,
        exclude_publisher: exclude_publisher,
        enable_os_targeting: enable_os_targeting,
        icon: icon,
        added_by: added_by
    });

    // Save Publisher in the database
    publisher.save(publisher).then(DBdata => {
        const resData = { 'success': true, 'message': "Publisher added successfully", 'results': DBdata };
        res.status(200).send(resData);
        return
    }).catch(err => {
        const resData = { 'success': false, 'message': "" + err.message };
        res.status(400).send(resData);
        return;
    });
};


// Get Publisher Data
exports.getPublishersData = async (req, res) => {

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = parseInt((page - 1) * limit);

    const { searchQuery, sorttype, sortdirection, pub_status, countries, enable_s2s, wl_s2s } = req.body;

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

    if (Array.isArray(countries) && countries.length > 0) {
        const c_string = countries.join(',');

        Object.assign(filter, {
            $or: [{ '$text': { '$search': `${c_string}` } }]
        });
    }

    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
        Object.assign(filter, {
            $or: [{ 'pub_company_name': { '$regex': searchQuery, $options: 'i' } }, { 'pub_name': { '$regex': searchQuery, $options: 'i' } }, { 'pub_id': { '$regex': searchQuery, $options: 'i' } }, { 'countries': { '$regex': searchQuery, $options: 'i' } }]
        });
    }

    //console.log(JSON.stringify(filter))


    let result = await Publisher.find(filter).sort(sortObject).exec();
    var totalPublishers = parseInt(result.length);


    await Publisher.find(filter).sort(sortObject).skip(skipIndex).limit(limit).exec().then((notRes) => {
        if (notRes) {
            const response = { 'success': true, 'totoalRecords': totalPublishers, 'results': notRes };
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
exports.getPublisherDataById = (req, res) => {
    const id = req.params.id;
    Publisher.findById(id).sort({ _id: -1 }).exec().then((publisher) => {
        if (publisher) {
            const response = { 'success': true, 'results': publisher };
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
exports.updatePublisher = (req, res) => {

    const _id = req.params.id;
    const { pub_company_name, pub_name, pub_id, revenue_share, raised, cutback, pub_details, countries, appsflyer_site_id, icon, icon_img, } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!pub_company_name || !pub_name || !pub_id || !revenue_share || !raised || !cutback || !pub_details || !countries || !appsflyer_site_id) {
        var requestVal = "";
        if (!pub_company_name) {
            var requestVal = "pub_company_name";
        } else if (!pub_name) {
            var requestVal = "pub_name";
        } else if (!pub_id) {
            var requestVal = "pub_id";
        } else if (!revenue_share) {
            var requestVal = "revenue_share";
        } else if (!raised) {
            var requestVal = "raised";
        } else if (!cutback) {
            var requestVal = "cutback";
        } else if (!pub_details) {
            var requestVal = "pub_details";
        } else if (!countries) {
            var requestVal = "countries";
        } else if (!appsflyer_site_id) {
            var requestVal = "appsflyer_site_id";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(countries)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "countries should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(countries) && countries.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "countries is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (icon_img) {
        let data_val = icon_img.replace(/^data:image\/[a-z]+;base64,/, "");
        let data_name = icon;
        let mimetype = detectMimeType(icon_img);
        // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
        const buffer = Buffer.from(data_val, "base64");
        const { BUCKET, BUCKET_ACCESS_ID, BUCKET_SECRET, BUCKET_REGION } = process.env;
        let s3 = new aws.S3({
            credentials: {
                accessKeyId: BUCKET_ACCESS_ID,
                secretAccessKey: BUCKET_SECRET
            },
            region: BUCKET_REGION
        });
        const putobj = {
            Bucket: "applabs2024",
            Key: data_name,
            Body: buffer,
            ContentType: mimetype,
            acl: "private"
        }
        s3.upload(putobj, function (err, data) {
            if (err) {
                console.log("Error", err)
                const erroData = { 'success': false, 'error': err };
                res.status(400).send(erroData);
                return;
            } else {
                data && console.log("Upload success", data);
            }
        })
    }

    const countryString = countries.join(',');
    req.body.countries = countryString;
    Publisher.findByIdAndUpdate(_id, req.body, { new: true, upsert: true }).exec().then((publisher) => {
        if (publisher) {
            const response = { 'success': true, 'results': publisher };
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


exports.changePublisherStatus = (req, res) => {
    const { publisherId, pub_status, approved_by, approved_by_email } = req.body;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!publisherId || !pub_status || !approved_by || !approved_by_email) {
        var requestVal = "";
        if (!publisherId) {
            var requestVal = "publisherId";
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

    if (!Array.isArray(publisherId)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisherId should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(publisherId) && publisherId.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisherId is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }
    for (let i = 0; i < publisherId.length; i++) {
        let _id = publisherId[i];
        Publisher.findByIdAndUpdate(_id, { 'pub_status': pub_status }, { new: true }).exec().then(async (resStatus) => {
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