const Advertiser = require("../models/advertiserModel");
const publisherPayout = require("../models/publisherspayoutModel");
const Publisher = require("../models/publisherModel");
const Offer = require("../models/offerModel");
const Preset = require("../models/presetModel");
const Creative = require("../models/creativeModel");
var { Conversion, Notifications, Timeline } = require("../models/commonModel");
const { padTo2Digits, number_format, isEmpty, dateprint } = require("../common/helper");


const decode = require('html-entities-decoder');

const getAllofflineConversion = async () => {
    let convData = await Conversion.find({ '$and': [{ 'job_id': { '$eq': "" } }, { 'job_status': { '$eq': "" } }] }).sort({ _id: 1 }).limit(500).exec();
    return convData;
}
const getAdvertiserBalByAdvId = async (advertiser) => {
    let advCurrBalance = await Advertiser.findOne({ tid: advertiser });
    if (advCurrBalance) {
        return advCurrBalance.balance;
    } else {
        return 0;
    }
}
const getAdvertiserNameByAdvId = async (advertiser) => {
    let advName = await Advertiser.findOne({ tid: advertiser });
    if (advName) {
        return advName.organization;
    } else {
        return "";
    }
}
const getAdertiseDetailsByAdvId = async (advertiser) => {
    let advName = await Advertiser.findOne({ tid: advertiser });
    if (advName) {
        return { "advName": advName.organization, "advertiserName": advName.name, "advEmail": advName.email, "email_preferences": advName.email_preferences };
    } else {
        return "";
    }
}


const getAdvertiserBasicDetailsByAdvId = async (trackier_adv_id) => {
    let adv = await Advertiser.findOne({ tid: trackier_adv_id });
    if (adv) {
        return { "advName": adv.organization, "advEmail": adv.email, "advertiserName": adv.name, "advEmailPref": adv.email_preferences };
    } else {
        return {};
    }
}

const getpublisherPayoutByPubandGeo = async (pub_id, cTry) => {
    let pubPayoutDt = await publisherPayout.findOne({ '$and': [{ 'pub_id': parseInt(pub_id) }, { 'Geo': cTry }] });
    if (pubPayoutDt) {
        return pubPayoutDt;
    } else {
        return "";
    }
}

const getpublisherPayoutByPubId = async (pub_id) => {
    let pubPayoutDt = await publisherPayout.findOne({ 'pub_id': parseInt(pub_id) });
    if (pubPayoutDt) {
        return pubPayoutDt;
    } else {
        return "";
    }
}

const getPublisherByPubId = async (pubidArr) => {
    let publisher = await Publisher.find({ 'pub_id': { '$in': pubidArr } }).sort({ _id: 1 }).exec();
    return publisher;
}



const getpublisherPayoutArr = async () => {
    var pubPayoutDt_array = {};
    let pubPayoutDt = await publisherPayout.find({}).sort({ _id: 1 }).exec();
    if (pubPayoutDt) {
        for (let k = 0; k < pubPayoutDt.length; k++) {
            let pubPay = pubPayoutDt[k];
            pubPayoutDt_array[pubPay.pub_id] = pubPay.gross_cap_install;
        }
        return pubPayoutDt_array;
    } else {
        return pubPayoutDt_array;
    }
}

function decodeHtml(str) {
    return decode(str);
}


const getAllOffersByTodaySpent = async () => {
    let offers = await Offer.find({ '$and': [{ 'trackier_camp_id': { '$ne': 0 } }, { 'today_spent': { '$gt': 0 } }] });
    return offers;
}
const getAllOffersByUpcommingDate = async () => {
    let offers = await Offer.find({ '$and': [{ 'status': 'active' }, { 'trackier_camp_id': { '$ne': 0 } }] });
    return offers;
}

const getAllOffersByTrafficStart = async () => {
    let offers = await Offer.find({ '$and': [{ 'status': 'active' }, { 'trackier_camp_id': { '$ne': 0 } }, { 'traffic_start': 'No' }, { 'total_click': { '$gt': 0 } }] });
    return offers;
}

const getAllOffersByStatus = async () => {
    let offers = await Offer.find({ '$and': [{ 'status': 'active' }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();;
    return offers;
}



const getPresetDataByFilterDate = async (filter) => {
    let presetRes = await Preset.find({ '$and': [{ 'reportSubcribe': true }, { 'duration': { '$in': filter } }] }).sort({ created_on: -1 }).exec();;
    return presetRes;
}


const getAllOffersForSpent = async () => {
    let offers = await Offer.find({ '$and': [{ 'trackier_camp_id': { '$ne': 0 } }] });
    return offers;
}

const convertCampaignData = async (newArr2, checqueryString, SDK_array, DIRECT_array) => {

    const reportData = newArr2.map(v => Object.assign(v, { grossPayableConversions: 0, custInstall: 0 }))

    var newData = {};
    var uniqGoalNames = [];
    var n_uniqGoalNames = [];
    if ((checqueryString.indexOf("goal_name") !== -1)) {
        for (let i = 0; i < reportData.length; i++) {
            var r = reportData[i];
            if ((uniqGoalNames.indexOf(r.goal_name) == -1)) {
                uniqGoalNames.push(r.goal_name);
            }
        }
    }
    if ((checqueryString.indexOf("goal_name") !== -1)) {
        uniqGoalNames.unshift('install');
        for (var i = 0; i < uniqGoalNames.length; i++) {
            if (n_uniqGoalNames.indexOf(uniqGoalNames[i]) == -1) n_uniqGoalNames.push(uniqGoalNames[i]);
        }
    }

    for (let i = 0; i < reportData.length; i++) {
        let r = reportData[i];


        if (SDK_array.hasOwnProperty(r.campaign_id)) {
            r.source = 'NA';
        }

        if (SDK_array.hasOwnProperty(r.campaign_id)) {
            r.publisher_id = 'NA';
        }

        if (DIRECT_array.hasOwnProperty(r.campaign_id)) {
            r.app_name = 'NA';
        }

        if ((checqueryString.indexOf("goal_name") !== -1)) {

            for (let q = 0; q < n_uniqGoalNames.length; q++) {
                let gname = n_uniqGoalNames[q];
                if (r.goal_name != gname) {
                    r[gname] = 0;
                } else {
                    r[gname] = r.grossConversions;
                }
            }
        }

        var superKey = "";
        if (typeof r.campaign_id !== 'undefined' && r.campaign_id !== "") {
            superKey += r.campaign_name;
        }
        if (typeof r.advertiser !== 'undefined' && r.advertiser !== "") {
            superKey += r.advertiser;
        }
        if (typeof r.advertiser_id !== 'undefined' && r.advertiser_id !== "") {
            superKey += r.advertiser_id;
        }
        if (typeof r.campaign_status !== 'undefined' && r.campaign_status !== "") {
            superKey += r.campaign_status;
        }
        if (typeof r.publisher_id !== 'undefined' && r.publisher_id !== "") {
            superKey += r.publisher_id;
        }
        if (typeof r.source !== 'undefined' && r.source !== "") {
            superKey += r.source;
        }
        if (typeof r.app_name !== 'undefined' && r.app_name !== "") {
            superKey += r.app_name;
        }
        if (typeof r.cr_name !== 'undefined' && r.cr_name !== "") {
            superKey += r.cr_name;
        }
        if (typeof r.goal_id !== 'undefined' && r.goal_id !== "") {
            superKey += r.goal_id;
        }
        if (typeof r.country !== 'undefined' && r.country !== "") {
            superKey += r.country;
        }
        if (typeof r.region !== 'undefined' && r.region !== "") {
            superKey += r.region;
        }
        if (typeof r.city !== 'undefined' && r.city !== "") {
            superKey += r.city;
        }
        if (typeof r.month !== 'undefined' && r.month !== "") {
            superKey += r.month;
        }
        if (typeof r.created !== 'undefined' && r.created !== "") {
            superKey += r.created;
        }
        if (typeof r.hour !== 'undefined' && r.hour !== "") {
            superKey += r.hour;
        }

        if (newData[superKey]) {
            newData[superKey]['grossClicks'] += r.grossClicks;
            newData[superKey]['grossConversions'] += r.grossConversions;
            newData[superKey]['grossRevenue'] += r.grossRevenue;


            for (let s = 0; s < n_uniqGoalNames.length; s++) {
                let gname = n_uniqGoalNames[s];
                if (r.goal_name === gname) {
                    if (r.grossConversions > 0) {
                        newData[superKey][gname] += r.grossConversions;
                    } else {
                        newData[superKey][gname] += 0;
                    }
                }
            }
        } else {
            newData[superKey] = r;
            if (checqueryString.indexOf("audienc_int") !== -1) {
                newData[superKey]['audienc_int'] = r.audienc_int;
            }
        }

        if (r.grossRevenue > 0) {
            newData[superKey]['grossPayableConversions'] += r.grossConversions;
        }

        if (r.goal_name == 'install') {
            newData[superKey]['custInstall'] += r.grossConversions;
        } else {
            newData[superKey]['custInstall'] += 0;
        }
    }
    return newData;
}



const getAllCreativeByUpcommingDate = async (campaignId) => {
    //console.log(JSON.stringify({ '$and': [{ 'campaign_id': campaignId }, { 'expired': 'No' }, { 'ads_end_date': { '$ne': null } }] }));
    let creatives = await Creative.find({ '$and': [{ 'campaign_id': campaignId }, { 'expired': 'No' }, { 'ads_end_date': { '$ne': null } }] }).sort({ created_on: -1 }).exec();;
    return creatives;
}



const getAllCreativeByUpcommingDates = async (campaignId) => {
    let creatives = await Creative.find({ '$and': [{ 'campaign_id': campaignId }, { 'expired': 'No' }] }).sort({ created_on: -1 }).exec();;
    return creatives;
}

const getAllOffersByUpcommingDates = async () => {
    let offers = await Offer.find({ '$and': [{ 'status': 'active' }, { 'trackier_camp_id': { '$ne': 0 } }, { 'total_click': 500 }, { 'today_conversion': 0 }] });
    return offers;
}

const addNotificationsData = async (data) => {

    const date = new Date();
    const year = date.getUTCFullYear();
    const month = padTo2Digits(date.getUTCMonth() + 1);
    const day = padTo2Digits(date.getUTCDate());
    const todayDate = [day, month, year].join('-');

    const hour = date.getHours(); // => 9
    const min = date.getMinutes(); // =>  30
    const sec = date.getSeconds(); // => 51

    const currentTime = hour + ":" + min + ":" + sec;

    const notifications = new Notifications({
        advertiser_id: data.advertiser_id,
        advertiser_name: data.advertiser_name,
        offer_id: data.offer_id,
        offer_name: data.offer_name,
        company_name: data.company_name,
        category: data.category,
        subject_sa: data.subject_sa,
        subject_adv: data.subject_adv,
        message_sa: data.message_sa,
        message_adv: data.message_adv,
        read: data.read,
        date: todayDate,
        time: currentTime
    });
    notifications.save(notifications).then(DBdata => {
        if (DBdata) {
            return true;
        } else {
            return false;
        }

    }).catch(err => {
        return false;
    });
}

const addTimelineData = async (data) => {

    const date = new Date();
    const year = date.getUTCFullYear();
    const month = padTo2Digits(date.getUTCMonth() + 1);
    const day = padTo2Digits(date.getUTCDate());
    const todayDate = [day, month, year].join('-');

    const hour = date.getHours(); // => 9
    const min = date.getMinutes(); // =>  30
    const sec = date.getSeconds(); // => 51

    const currentTime = hour + ":" + min + ":" + sec;

    const notifications = new Timeline({
        advertiser_id: data.advertiser_id,
        advertiser_name: data.advertiser_name,
        offer_id: data.offer_id,
        offer_name: data.offer_name,
        company_name: data.company_name,
        type: data.type,
        old_value: data.old_value,
        new_value: data.new_value,
        date_time: todayDate + " " + currentTime,
        edited_by: data.edited_by,
    });
    notifications.save(notifications).then(DBdata => {
        if (DBdata) {
            return true;
        } else {
            return false;
        }

    }).catch(err => {
        return false;
    });
}


module.exports = { getAdvertiserBalByAdvId, getAdvertiserNameByAdvId, getAdertiseDetailsByAdvId, getpublisherPayoutByPubandGeo, getpublisherPayoutByPubId, getpublisherPayoutArr, getPublisherByPubId, getAdvertiserBasicDetailsByAdvId, getAllofflineConversion, decodeHtml, getAllOffersByTodaySpent, getAllOffersByUpcommingDate, getAllOffersByTrafficStart, getAllOffersForSpent, getAllOffersByStatus, convertCampaignData, getPresetDataByFilterDate, getAllCreativeByUpcommingDate, getAllCreativeByUpcommingDates, getAllOffersByUpcommingDates, addNotificationsData, addTimelineData }