var { Notifications } = require("../models/commonModel");
var { timeSince } = require("../common/helper");

// Get User Data
exports.getNotificationData = async (req, res) => {


  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = parseInt((page - 1) * limit);

  const advertiserId = parseInt(req.query.advertiserId);

  const { sorttype, sortdirection, category, searchQuery, read, date_from, date_to } = req.body;

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

  if (advertiserId) {
    var filter = {};
    filter['advertiser_id'] = advertiserId;
    if (category == "all") {
      filter['category'] = { '$ne': 'all' };
    } else {
      if ((category == "User") || (category == "Advertiser") || (category == "Campaign") || (category == "Fund") || (category == "Audience")) {
        filter['category'] = category;
      }
    }

    if (typeof read !== "undefined" && read !== "") {
      if (read == true) {
        filter['read'] = 1;
      } else {
        filter['read'] = 0;
      }
    }
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      Object.assign(filter, {
        $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'company_name': { '$regex': searchQuery, $options: 'i' } }, { 'category': { '$regex': searchQuery, $options: 'i' } }, { 'subject_adv': { '$regex': searchQuery, $options: 'i' } }, { 'message_sa': { '$regex': searchQuery, $options: 'i' } }, { 'message_adv': { '$regex': searchQuery, $options: 'i' } }]
      });
    }
    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {

      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");

      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();

      Object.assign(filter, {
        'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp }
      });
    }

    //console.log(JSON.stringify(filter));

    var filters = {};
    filters['advertiser_id'] = advertiserId;

    if (category == "all") {
      filters['category'] = { '$ne': 'all' };
    } else {
      if ((category == "User") || (category == "Advertiser") || (category == "Campaign") || (category == "Fund") || (category == "Audience")) {
        filters['category'] = category;
      }
    }
    if (typeof read !== "undefined" && read !== "") {
      if (read == true) {
        filters['read'] = 1;
      } else {
        filters['read'] = 0;
      }
    }
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      Object.assign(filters, {
        $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'company_name': { '$regex': searchQuery, $options: 'i' } }, { 'category': { '$regex': searchQuery, $options: 'i' } }, { 'subject_adv': { '$regex': searchQuery, $options: 'i' } }, { 'message_sa': { '$regex': searchQuery, $options: 'i' } }, { 'message_adv': { '$regex': searchQuery, $options: 'i' } }]
      });
    }

    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {

      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");

      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();

      Object.assign(filters, {
        'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp }
      });
    }

    //console.log(JSON.stringify(filters))
    let result = await Notifications.find(filters).sort(sortObject).exec();
    var totalNotifications = parseInt(result.length);

  } else {
    var filter = {};
    if (category == "all") {
      filter['category'] = { '$ne': 'all' };
    } else {
      if ((category == "User") || (category == "Advertiser") || (category == "Campaign") || (category == "Fund") || (category == "Audience")) {
        filter['category'] = category;
      }
    }
    if (typeof read !== "undefined" && read !== "") {
      if (read == true) {
        filter['read'] = 1;
      } else {
        filter['read'] = 0;
      }
    }
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      Object.assign(filter, {
        $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'company_name': { '$regex': searchQuery, $options: 'i' } }, { 'category': { '$regex': searchQuery, $options: 'i' } }, { 'subject_adv': { '$regex': searchQuery, $options: 'i' } }, { 'message_sa': { '$regex': searchQuery, $options: 'i' } }, { 'message_adv': { '$regex': searchQuery, $options: 'i' } }]
      });
    }

    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_to !== "undefined" && date_to !== "") {

      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");

      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();

      Object.assign(filter, {
        'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp }
      });
    }
    //console.log("MOHAN");
    //console.log(JSON.stringify(filter))


    var filters = {};
    if (category == "all") {
      filters['category'] = { '$ne': 'all' };
    } else {
      if ((category == "User") || (category == "Advertiser") || (category == "Campaign") || (category == "Fund") || (category == "Audience")) {
        filters['category'] = category;
      }
    }
    if (typeof read !== "undefined" && read !== "") {
      if (read == true) {
        filters['read'] = 1;
      } else {
        filters['read'] = 0;
      }
    }
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
      Object.assign(filters, {
        $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'company_name': { '$regex': searchQuery, $options: 'i' } }, { 'category': { '$regex': searchQuery, $options: 'i' } }, { 'subject_adv': { '$regex': searchQuery, $options: 'i' } }, { 'message_sa': { '$regex': searchQuery, $options: 'i' } }, { 'message_adv': { '$regex': searchQuery, $options: 'i' } }]
      });
    }

    if (typeof date_from !== "undefined" && date_from !== "" && typeof date_from !== "undefined" && date_to !== "") {

      const currentDateStart = new Date(date_from + "T01:59:59.053Z");
      const currentDateEnd = new Date(date_to + "T23:59:59.053Z");

      var date_from_timestamp = currentDateStart.getTime();
      var date_to_timestamp = currentDateEnd.getTime();

      Object.assign(filters, {
        'created_on': { '$gte': date_from_timestamp, '$lte': date_to_timestamp }
      });
    }

    //console.log("SUDISH");
    //console.log(JSON.stringify(filters))

    let result = await Notifications.find(filters).sort(sortObject).exec();
    var totalNotifications = parseInt(result.length);
  }

  await Notifications.find(filter).sort(sortObject).skip(skipIndex).limit(limit).exec().then((notRes) => {
    if (notRes) {

      var dataArr = [];
      for (let i = 0; i < notRes.length; i++) {
        let adRes = notRes[i];

        let ago = timeSince(adRes.created_on);
        dataArr.push({
          _id: adRes._id,
          advertiser_id: adRes.advertiser_id,
          advertiser_name: adRes.advertiser_name,
          offer_id: adRes.offer_id,
          offer_name: adRes.offer_name,
          company_name: adRes.company_name,
          category: adRes.category,
          subject_sa: adRes.subject_sa,
          subject_adv: adRes.subject_adv,
          message_sa: adRes.message_sa,
          message_adv: adRes.message_adv,
          read: adRes.read,
          date: adRes.date,
          time: adRes.time,
          ago: ago
        });
      }
      const response = { 'success': true, 'totoalRecords': totalNotifications, 'results': dataArr };
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


exports.updateNotificationStatus = (req, res) => {
  const { notificationId, read } = req.body;

  if (!notificationId) {
    var requestVal = "";
    if (!notificationId) {
      var requestVal = "notificationId";
    }
    // console.log(requestVal);
    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
    res.status(400).send(reMsg);
    return;
  }
  let _id = notificationId;

  Notifications.findByIdAndUpdate(_id, { 'read': read }, { new: true }).exec().then(async (resStatus) => {
    if (resStatus) {
      const response = { 'success': true, 'message': 'Status successfully updated.' };
      res.status(200).send(response);
      return;
    } else {
      const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
      res.status(200).send(resMsg);
      return;
    }
  }).catch((error) => {
    console.log(error);
    const reMsg = { "status": false, "message": error };
    res.status(400).send(reMsg);
    return;
  })
}