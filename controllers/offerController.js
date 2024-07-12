const Offer = require("../models/offerModel");
const geoPayout = require("../models/geopayoutModel");
const publisherPayout = require("../models/publisherspayoutModel");
const appLists = require("../models/applistModel");
const Advertiser = require("../models/advertiserModel");
const { URL, parse } = require('url');
const Publishers = require("../models/publisherModel");
const Applist = require("../models/applistModel");
const querystring = require("querystring");
const axios = require('axios');
const CreativeModel = require("../models/creativeModel");
const CreativeCtrModel = require("../models/creativectrModel");
const { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, getCreativeNameLists, dateprint } = require('../common/helper');
const { getAdvertiserBalByAdvId, getAdvertiserNameByAdvId, getAdertiseDetailsByAdvId, getpublisherPayoutByPubandGeo, getpublisherPayoutArr, getPublisherByPubId, getAdvertiserBasicDetailsByAdvId, getpublisherPayoutByPubId, getPublisherDataByPubId, decodeHtml, addNotificationsData, addTimelineData, } = require("../common/common");

const Audience = require("../models/audienceModel");
var { Timeline } = require("../models/commonModel");


const ucfirst = require('ucfirst');
const ucwords = require('ucwords');
const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const { url } = require("inspector");

// request.body
exports.addOffer = async (req, res) => {
    const { req_from, user_type, user_name, user_email, advertiser, offer_name, source_type, campaign_type, premium_apps, audience_id, pubs, MMP, bundle_id, app_name, preview_url, icon, description, unique_tracker_id, appmetrica_tracking_id, singular_cta_tracking_link, singular_vta_tracking_link, mytracker_tracking_id, app_link, campaign_id, operating_system, kpi, cta_link, cta_redirect_link, af_redirect_link, vta_link, goal_budget_type, payable_event_name, total_budget, daily_budget, campaign_schedule, schedule_start_date, schedule_end_date, country, include_state_city, state, state_inc_and_exc, city, city_details, city_inc_and_exc, os_version_min, os_version_max, language, interest, age_group, payable_event_price, goal_budget, creatives } = req.body; var step1 = false; var step2 = false; var step3 = false; var step4 = false; var step5 = false; var step6 = false; var step7 = false;
    // console.log(RU_erid);
    // process.exit();
    // Validate request
    if (!user_type || !offer_name || !source_type || !MMP || !bundle_id || !app_name || !preview_url || !icon || !description || !operating_system || !cta_link || !goal_budget_type || !payable_event_name || !total_budget || !daily_budget || !schedule_start_date || !country || !language || !interest || !age_group) {
        var requestVal = "";
        if (!user_type) {
            var requestVal = "user_type";
        } else if (!offer_name) {
            var requestVal = "offer_name";
        } else if (!source_type) {
            var requestVal = "source_type";
        } else if (!MMP) {
            var requestVal = "MMP";
        } else if (!bundle_id) {
            var requestVal = "bundle_id";
        } else if (!app_name) {
            var requestVal = "app_name";
        } else if (!preview_url) {
            var requestVal = "preview_url";
        } else if (!icon) {
            var requestVal = "icon";
        } else if (!description) {
            var requestVal = "description";
        } else if (!operating_system) {
            var requestVal = "operating_system";
        } else if (!cta_link) {
            var requestVal = "cta_link";
        } else if (!goal_budget_type) {
            var requestVal = "goal_budget_type";
        } else if (!payable_event_name) {
            var requestVal = "payable_event_name";
        } else if (!total_budget) {
            var requestVal = "total_budget";
        } else if (!daily_budget) {
            var requestVal = "daily_budget";
        } else if (!schedule_start_date) {
            var requestVal = "schedule_start_date";
        } else if (!country) {
            var requestVal = "country";
        } else if (!language) {
            var requestVal = "language";
        } else if (!interest) {
            var requestVal = "interest";
        } else if (!age_group) {
            var requestVal = "age_group";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    const currBalance = await getAdvertiserBalByAdvId(advertiser);
    if (typeof total_budget !== 'undefined' && total_budget > currBalance) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Your balance is (" + currBalance + ")!!. Please enter amount less than/equal to your Available Balance" }] };
        res.status(400).send(reMsg);
        return;
    }

    if (typeof daily_budget !== 'undefined' && daily_budget > total_budget) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Daily Budget must be less or equal to Total Budget" }] };
        res.status(400).send(reMsg);
        return;
    }
    if (user_type == 'sa') {
        if (!advertiser) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiser is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }
    if (user_type != 'sa') {
        if (!payable_event_price) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable event is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
        if (country.length > 1) {
            let priceValArr = await geoPayout.find({ geo: { $in: country } }).sort('-1');
            min = Math.min.apply(null, priceValArr.map(function (item) {
                return item.price;
            }));
            max = Math.max.apply(null, priceValArr.map(function (item) {
                return item.price;
            }));
            // const maxPrivceValue = max;
            const minPriceValue = min;

            if (payable_event_price < minPriceValue) {
                const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price should be Greater or equal to " + minPriceValue + " for the selected geo" }] };
                res.status(400).send(reMsg);
                return;
            }
        } else {
            let priceValArr = await geoPayout.find({ geo: { $in: country } });
            const priceVal = priceValArr[0].price;
            if (payable_event_price < priceVal) {
                const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price should be Greater or equal to " + priceVal + " for the selected geo" }] };
                res.status(400).send(reMsg);
                return;
            }

        }
    }

    if (MMP == 'Adjust') {
        if (!unique_tracker_id) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "adjust unique_tracker_id is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }

        if (goal_budget_type == 'CPA' && MMP == 'Adjust') {
            var arrNonPayableEventToken = [];
            var arrNonPayableEventName = [];
            var arrNonPayableEventPrice = [];
            if (Array.isArray(goal_budget) && goal_budget.length > 0) {
                //console.log(goal_budget);
                for (let i = 0; i < goal_budget.length; i++) {
                    let value = goal_budget[i];
                    //console.log(`${index}: ${value.non_payable_event_name}`);
                    arrNonPayableEventName.push(value.non_payable_event_name);
                    if (value.non_payable_event_token) {
                        arrNonPayableEventToken.push(value.non_payable_event_token);
                    }
                    arrNonPayableEventPrice.push(value.non_payable_event_price);
                }
                var arrNonPayableEventName = arrNonPayableEventName.filter(function (eName) {
                    return eName !== "";
                });
                var arrNonPayableEventToken = arrNonPayableEventToken.filter(function (eToken) {
                    return eToken !== "";
                });
                //console.log(arrNonPayableEventName);
                //console.log(arrNonPayableEventToken);
                const totNonPayableEventToken = arrNonPayableEventName.length;
                const totNonPayableEventName = arrNonPayableEventToken.length;

                // console.log(totNonPayableEventToken);
                // console.log(totNonPayableEventName);

                if (parseInt(totNonPayableEventToken) !== parseInt(totNonPayableEventName)) {
                    console.log("Please enter all event token for all event name!!");
                    const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Please enter all event token for all event name!!" }] };
                    res.status(400).send(reMsg);
                    return;
                }
            }
        }
    } else {
        if (goal_budget_type == 'CPA') {
            var arrNonPayableEventToken = [];
            var arrNonPayableEventName = [];
            var arrNonPayableEventPrice = [];

            if (!Array.isArray(goal_budget)) {
                const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "goal_budget should be []!!" }] };
                res.status(400).send(reMsg);
                return;
            } else if (Array.isArray(goal_budget) && goal_budget.length == 0) {
                const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "goal_budget is not allowed to be empty" }] };
                res.status(400).send(reMsg);
                return;
            } else {
                //console.log(goal_budget);
                // goal_budget.forEach(function callback(value, index) {
                for (let i = 0; i < goal_budget.length; i++) {
                    let value = goal_budget[i];
                    //console.log(`${index}: ${value.non_payable_event_name}`);
                    arrNonPayableEventName.push(value.non_payable_event_name);
                    if (value.non_payable_event_token) {
                        arrNonPayableEventToken.push(value.non_payable_event_token);
                    }
                    arrNonPayableEventPrice.push(value.non_payable_event_price);
                    //});
                }
                var arrNonPayableEventName = arrNonPayableEventName.filter(function (eName) {
                    return eName !== "";
                });
                var arrNonPayableEventToken = arrNonPayableEventToken.filter(function (eToken) {
                    return eToken !== "";
                });
            }
        }
    }
    if (MMP == 'Appmetrica') {
        if (!appmetrica_tracking_id) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "appmetrica_tracking_id is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (MMP == 'Singular') {
        if (!singular_cta_tracking_link) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "singular_cta_tracking_link is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }

        if (!singular_vta_tracking_link) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "singular_vta_tracking_link is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (MMP == 'MyTracker') {
        if (!mytracker_tracking_id) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "mytracker_tracking_id is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (MMP == 'Branch') {
        if (!app_link) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "app_link is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (MMP == 'Kochava') {
        if (!campaign_id) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "campaign_id is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (goal_budget_type == 'CPI') {
        if (!payable_event_price) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    const cta_link_check = stringIsAValidUrl(cta_link, ['https']);
    if (cta_link_check == false) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Invalid Click Through Attribution Link (CTA) URL" }] };
        res.status(400).send(reMsg);
        return;

    }
    if (vta_link) {
        const vta_link_check = stringIsAValidUrl(vta_link, ['https']);
        if (vta_link_check == false) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Invalid View Through Attribution Link( VTA) URL" }] };
            res.status(400).send(reMsg);
            return;

        }
    }

    if (!Array.isArray(pubs)) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisher should be []!!" }] };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(pubs) && pubs.length == 0) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisher is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    if (typeof source_type !== 'undefined' && source_type == "SDK") {
        if (!Array.isArray(creatives)) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "creative should be []!!" }] };
            res.status(400).send(reMsg);
            return;
        } else if (Array.isArray(creatives) && creatives.length == 0) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "creative is not allowed to be empty" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (typeof state !== "undefined" && state !== "") {
        if (!Array.isArray(state)) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "state should be []!" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (typeof city !== "undefined" && city !== "") {
        if (!Array.isArray(city)) {
            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "city should be []!" }] };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (!Array.isArray(country)) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" }] };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(country) && country.length == 0) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(language)) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language should be []!!" }] };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(language) && language.length == 0) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(interest)) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest should be []!!" }] };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(interest) && interest.length == 0) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(age_group)) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group should be []!!" }] };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(age_group) && age_group.length == 0) {
        const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group is not allowed to be empty" }] };
        res.status(400).send(reMsg);
        return;
    }

    // Create a Offer

    // start ->  all publishers
    var publishers = [];
    if (Array.isArray(pubs) && pubs.length > 0) {
        let pubDataArray = await getPublisherByPubId(pubs);
        for (let i = 0; i < pubDataArray.length; i++) {
            let value = pubDataArray[i];
            publishers.push({ 'pub_id': value.pub_id, 'pub_name': value.pub_name, 'pub_details': value.pub_details, 'pub_website': value.pub_website, 'enable_s2s': value.enable_s2s, 'enable_os_targeting': value.enable_os_targeting, 'exclude_publisher': value.exclude_publisher, 'revenue_share': parseFloat(value.revenue_share), 'wl_s2s': value.wl_s2s, 'appsflyer_site_id': value.appsflyer_site_id, 'pub_status': value.pub_status, 'bid_ajustment': 100, 'bid_price': parseFloat(0.0), 'status': "active" });
        }
    }
    // end ->  all publishers 


    // start ->  all publishers
    var publishers = [];
    if (Array.isArray(pubs) && pubs.length > 0) {
        let pubDataArray = await getPublisherByPubId(pubs);
        for (let i = 0; i < pubDataArray.length; i++) {
            let value = pubDataArray[i];
            publishers.push({ 'pub_id': value.pub_id, 'pub_name': value.pub_name, 'pub_details': value.pub_details, 'pub_website': value.pub_website, 'enable_s2s': value.enable_s2s, 'enable_os_targeting': value.enable_os_targeting, 'exclude_publisher': value.exclude_publisher, 'revenue_share': parseFloat(value.revenue_share), 'wl_s2s': value.wl_s2s, 'appsflyer_site_id': value.appsflyer_site_id, 'pub_status': value.pub_status, 'bid_ajustment': 100, 'bid_price': parseFloat(0.0), 'status': "active" });
        }
    }
    // end ->  all publishers 


    const countryString = country.join(',');
    if (state) {
        var stateString = state.join(',');
    } else {
        var stateString = "";
    }
    if (city) {
        var cityString = city.join(',');
    } else {
        var cityString = "";
    }

    var osVersionMins = {};
    if (os_version_min && os_version_max) {
        osVersionMins = { "min": parseInt(os_version_min), "max": parseInt(os_version_max) };
    } else if (os_version_min) {
        osVersionMins = { "min": parseInt(os_version_min), "max": parseInt(os_version_max) };
        if (typeof os_version_max == 'undefined' || os_version_max == "")
            delete osVersionMins['max'];
    } else if (os_version_max) {
        osVersionMins = { "min": parseInt(os_version_min), "max": parseInt(os_version_max) };
        if (typeof os_version_min == 'undefined' || os_version_min == "")
            delete osVersionMins['min'];
    }

    if (typeof state_inc_and_exc !== 'undefined' && state_inc_and_exc == "on") {
        var state_inc_and_exc_str = "allow";
    } else {
        var state_inc_and_exc_str = "deny";
    }
    if (typeof city_inc_and_exc !== 'undefined' && city_inc_and_exc == "on") {
        var city_inc_and_exc_str = "allow";
    } else {
        var city_inc_and_exc_str = "deny";
    }
    const languageString = language.join(',');
    const interestString = interest.join(',');
    const age_groupString = age_group.join(',');
    var description_text = description.replace('~^[\'"]?(.*?)[\'"]?$~', '$1');
    description_text = description_text.substr(0, 500);

    if (Array.isArray(arrNonPayableEventName) && arrNonPayableEventName.length) {
        var listNonPayableEventName = arrNonPayableEventName.join(',');
    } else {
        var listNonPayableEventName = "";
    }
    if (Array.isArray(arrNonPayableEventPrice) && arrNonPayableEventPrice.length) {
        var listNonPayableEventPrices = arrNonPayableEventPrice.join(',');
    } else {
        var listNonPayableEventPrices = "00";
    }

    if (Array.isArray(arrNonPayableEventToken) && arrNonPayableEventToken.length) {
        var listNonPayableEventToken = arrNonPayableEventToken.join(',');
    } else {
        var listNonPayableEventToken = "";
    }

    var now = new Date();
    currentHours = ("0" + now.getHours()).slice(-2);
    currentMinutes = ("0" + now.getMinutes()).slice(-2);
    currentSeconds = ("0" + now.getSeconds()).slice(-2);
    var time_24 = [currentHours, ':', currentMinutes, ':', currentSeconds].join('');

    var dt_start = schedule_start_date;
    var datearray = dt_start.split("/");
    var startDate = `${datearray[2]}-${datearray[1]}-${datearray[0]}T${time_24}`;

    var endDate = "";
    if (typeof schedule_end_date !== 'undefined' || schedule_end_date !== "") {
        var dt_end = schedule_end_date;
        var datearray_end = dt_end.split("/");
        var endDate = `${datearray_end[2]}-${datearray_end[1]}-${datearray_end[0]}T${time_24}`;

        var schedule_end_date_check = schedule_end_date;
    } else {
        var schedule_end_date_check = null;
    }
    if (typeof payable_event_price !== 'undefined' && payable_event_price > 0) {
        var campaignRevenue = payable_event_price;
    } else {
        var campaignRevenue = 0;
    }

    // console.log(osVersionMins);
    if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {
        if (typeof cta_link !== 'undefined' && cta_link !== "") {

            if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                var CTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1&af_r=" + encodeURIComponent(decodeRedirectUrl);
            } else {
                var CTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1";
            }

            var ctaLink = cta_link + CTAMacro;

            const query_agid = require('url').parse(cta_link, true).query;
            var afAdId = "&af_ad_id=";
            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                afAdId += "{publisher_id}_";
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                afAdId += "{source}_";
            }
            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                afAdId += "{app_name}_";
            }
            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                afAdId += "{camp_id}_";
            }
            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                afAdId += "{publisher_id}_";
            }
            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                afAdId += "{creative_name}_";
            }

            // Start Encode ~agency_id URL
            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                const search_replace = { '&af_sub1={publisher_id}': "" };
                ctaLink = ctaLink.replace(/&af_sub1={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                const search_replace = { '&af_sub2={source}': "" };
                ctaLink = ctaLink.replace(/&af_sub2={source}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                const search_replace = { '&af_sub3={app_name}': "" };
                ctaLink = ctaLink.replace(/&af_sub3={app_name}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                const search_replace = { '&af_sub4={camp_id}': "" };
                ctaLink = ctaLink.replace(/&af_sub4={camp_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                const search_replace = { '&af_sub5={publisher_id}': "" };
                ctaLink = ctaLink.replace(/&af_sub5={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                const search_replace = { '&af_sub6={creative_name}': "" };
                ctaLink = ctaLink.replace(/&af_sub6={creative_name}/g, matched => search_replace[matched]);
            }
            if (afAdId !== "&af_ad_id=") {
                ctaLink = ctaLink + afAdId.replace(/_+$/, '');
            } else {
                ctaLink = ctaLink;
            }

            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '__DEEPLINK__': "", '__COST__': campaignRevenue, '__CURRENCY__': 'USD', '=channel': '=AL-{publisher_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}|__DEEPLINK__|__COST__|__CURRENCY__|USD|=channel/g, matched => search_replace[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            // Remove &af_dp= form VTA link
            const query_dp = require('url').parse(vta_link, true).query;
            if (typeof query_dp.af_dp !== 'undefined' && query_dp.af_dp !== "") {
                var removeAfdpFromVta = vta_link.replace("&af_dp=" + query_dp.af_dp, "");
            } else {
                var removeAfdpFromVta = vta_link;
            }

            if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                var VTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1&af_r=" + encodeURIComponent(decodeRedirectUrl);
            } else {
                var VTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1";
            }

            var vtaLink = removeAfdpFromVta + VTAMacro;

            const query_agid = require('url').parse(vta_link, true).query;
            var afAdId = "&af_ad_id=";

            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                afAdId += "{publisher_id}_";
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                afAdId += "{source}_";
            }

            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                afAdId += "{app_name}_";
            }

            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                afAdId += "{camp_id}_";
            }

            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                afAdId += "{publisher_id}_";
            }

            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                afAdId += "{creative_name}_";
            }

            // Start Encode ~agency_id URL
            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                const search_replace = { '&af_sub1={publisher_id}': "" };
                vtaLink = vtaLink.replace(/&af_sub1={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                const search_replace = { '&af_sub2={source}': "" };
                vtaLink = vtaLink.replace(/&af_sub2={source}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                const search_replace = { '&af_sub3={app_name}': "" };
                vtaLink = vtaLink.replace(/&af_sub3={app_name}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                const search_replace = { '&af_sub4={camp_id}': "" };
                vtaLink = vtaLink.replace(/&af_sub4={camp_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                const search_replace = { '&af_sub5={publisher_id}': "" };
                vtaLink = vtaLink.replace(/&af_sub5={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                const search_replace = { '&af_sub6={creative_name}': "" };
                vtaLink = vtaLink.replace(/&af_sub6={creative_name}/g, matched => search_replace[matched]);
            }
            if (afAdId !== "&af_ad_id=") {
                vtaLink = vtaLink + afAdId.replace(/_+$/, '');
            } else {
                vtaLink = vtaLink;
            }

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '__DEEPLINK__': "", '__COST__': campaignRevenue, '__CURRENCY__': 'USD', '=channel': '=AL-{publisher_id}', '{click_id}': '{imp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}|__DEEPLINK__|__COST__|__CURRENCY__|USD|=channel|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            // console.log('null');
            var VTAMacro = "";
            var finalVtaLink = "";
        }
        // Start=> Mobile Measurement Partner(MMP) - Branch
    } else if (typeof MMP !== 'undefined' && MMP == "Branch") {

        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            // Start Encode ~agency_id URL
            const query_agid = require('url').parse(cta_link, true).query;
            // check ~agencyId
            if ("~agency_id" in query_agid) {
                var CTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            } else {
                var CTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&~agency_id=730316834393313593";
            }
            const ctaLink = cta_link + CTAMacro;
            // End Encode ~agency_id URL
            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '={channel_id}': '=AL-{publisher_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}|={channel_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            // Start Encode ~agency_id URL
            const query_agid_vta = require('url').parse(vta_link, true).query;
            // check ~agencyId
            if ("~agency_id" in query_agid_vta) {
                var VTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            } else {
                var VTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&~agency_id=730316834393313593";
            }
            const vtaLink = vta_link + VTAMacro;
            // End Encode ~agency_id URL
            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '={channel_id}': '=AL-{publisher_id}', '{click_id}': '{imp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}|={channel_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
        // Start=> Mobile Measurement Partner(MMP) - Adjust
    } else if (typeof MMP !== 'undefined' && MMP == "Adjust") {

        var event_postback = "";
        if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPA') {

            if (Array.isArray(goal_budget) && goal_budget.length) {
                //console.log(goal_budget);
                // goal_budget.forEach(function callback(value, index) {
                for (let i = 0; i < goal_budget.length; i++) {
                    let value = goal_budget[i];
                    if (value.non_payable_event_token) {
                        event_postback += "&event_callback_" + value.non_payable_event_token + "=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}%26goal_value%3D" + value.non_payable_event_name + "";
                    }
                    // });
                }
            }
        }

        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);

                var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
            } else {
                var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback;
            }
            const ctaLink = cta_link + CTAMacro;

            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            var VTAReplaceClick_id = vta_link.replace("{click_id}", "{imp_id}");

            if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                const decodeRedirectVTAUrl = decodeURIComponent(cta_redirect_link);
                var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback + "&redirect=" + encodeURIComponent(decodeRedirectVTAUrl);
            } else {
                var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback;
            }
            const vtaLink = VTAReplaceClick_id + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    } else if (typeof MMP !== 'undefined' && MMP == "Kochava") {

        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const ctaLink = cta_link + CTAMacro;
            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const vtaLink = vta_link + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    } else if (typeof MMP !== 'undefined' && MMP == "Appmetrica") {
        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const ctaLink = cta_link + CTAMacro;

            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const vtaLink = vta_link + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    } else if (typeof MMP !== 'undefined' && MMP == "Singular") {

        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const ctaLink = cta_link + CTAMacro;

            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const vtaLink = vta_link + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' };
            var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    } else if (typeof MMP !== 'undefined' && MMP == "MyTracker") {

        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const ctaLink = cta_link + CTAMacro;

            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' }
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const vtaLink = vta_link + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' }
            var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    } else {
        // Start=> Mobile Measurement Partner(MMP) - other
        if (typeof cta_link !== 'undefined' && cta_link !== "") {
            var CTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const ctaLink = cta_link + CTAMacro;

            const search_replace_cta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' }
            var finalCtaLink = ctaLink.replace(/{placement_id}/g, matched => search_replace_cta[matched]);
        } else {
            var finalCtaLink = "";
        }

        if (typeof vta_link !== 'undefined' && vta_link !== "") {
            // VTA LINK
            var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
            const vtaLink = vta_link + VTAMacro;

            const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' }

            var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
        } else {
            var VTAMacro = "";
            var finalVtaLink = "";
        }
    }

    // get erid in the case of russia
    var RU_erid = {};
    const query_erid = require('url').parse(finalCtaLink, true).query;
    if (typeof query_erid.erid !== 'undefined' && query_erid.erid !== "") {
        const RU_erid_val = encodeURIComponent(query_erid.erid);
        RU_erid = { "erid": RU_erid_val };
    } else {
        RU_erid = {};
    }


    // start ->  all publishers
    var publisherIdsArr = [];
    var allPublisherIdsArr = [];
    if (Array.isArray(publishers) && publishers.length > 0) {
        //publishers.forEach(function callback(value, index) {
        for (let i = 0; i < publishers.length; i++) {
            let value = publishers[i];
            //console.log(`${index}: ${value.pub_id}`);
            allPublisherIdsArr.push(value.pub_id);
            if (value.exclude_publisher == "Enabled") {
                publisherIdsArr.push(value.pub_id);
            }
            // });
        }
    }

    const offer = new Offer({
        trackier_adv_id: advertiser,
        trackier_camp_id: 0,
        offer_name: offer_name,
        source_type: source_type,
        campaign_type: campaign_type,
        publishers: publishers,
        premium_apps: premium_apps,
        audience_id: audience_id,
        MMP: MMP,
        bundle_id: bundle_id,
        app_name: app_name,
        description: description_text,
        preview_url: preview_url,
        icon: icon,
        unique_tracker_id: unique_tracker_id,
        appmetrica_tracking_id: appmetrica_tracking_id,
        singular_cta_tracking_link: singular_cta_tracking_link,
        singular_vta_tracking_link: singular_vta_tracking_link,
        mytracker_tracking_id: mytracker_tracking_id,
        app_link: app_link,
        campaign_id: campaign_id,
        operating_system: operating_system,
        kpi: kpi,
        cta_link_basic: cta_link,
        vta_link_basic: vta_link,
        cta_link: CTAMacro,
        vta_link: VTAMacro,
        goal_budget_type: goal_budget_type,
        payable_event_name: payable_event_name,
        payable_event_price: payable_event_price,
        non_payable_event_name: listNonPayableEventName,
        non_payable_event_price: listNonPayableEventPrices,
        non_payable_event_token: listNonPayableEventToken,
        total_budget: total_budget,
        daily_budget: daily_budget,
        today_spent: 0,
        today_conversion: 0,
        total_spent: 0,
        total_conversion: 0,
        total_click: 0,
        total_install: 0,
        today_click: 0,
        today_install: 0,
        traffic_start: "No",
        campaign_schedule: campaign_schedule,
        schedule_start_date: schedule_start_date,
        schedule_end_date: schedule_end_date_check,
        country: countryString,
        include_state_city: include_state_city,
        state: stateString,
        state_inc_and_exc: state_inc_and_exc,
        city: cityString,
        city_details: city_details,
        city_inc_and_exc: city_inc_and_exc,
        os_version_min: os_version_min,
        os_version_max: os_version_max,
        language: languageString,
        interest: interestString,
        age_group: age_groupString,
        status: "pending",
        multi: false,
        totCap: false
    });

    // Save Offer in the database
    offer.save(offer).then(DBdata => {

        //data._id object id
        // after insert into database send data to trackier
        var trackierBasicPostData = {
            advertiserId: advertiser,
            title: "AL-" + offer_name,
            description: description_text,
            previewUrl: preview_url,
            url: finalCtaLink,
            currency: "USD",
            commModel: "cpi",
            status: "pending",
            device: "mobile",
            defaultGoalName: "install",
            appName: app_name,
            appId: bundle_id,
            os: [operating_system],
            visibility: "private",
            kpi: kpi,
            iurl: finalVtaLink,
            overrideAppNameWithCsvValues: 1,
            convTrackingDomain: "t.clickscot.com",
            primaryTrackingDomain: "t.clickscot.com",
            attributionWindow: "168",
            subIdOverride: RU_erid,
            redirectType: "302",
            convTracking: "postback",
            payouts: [{ "payout": "0", "revenue": parseFloat(campaignRevenue), "geo": country }],
            startTime: startDate,
            endTime: endDate
        }
        if (typeof schedule_end_date == 'undefined' || schedule_end_date == "")
            delete trackierBasicPostData['endTime'];
        if (typeof kpi == 'undefined' || kpi == "" || kpi == null)
            delete trackierBasicPostData['kpi'];
        if (typeof finalVtaLink == 'undefined' || finalVtaLink == "")
            delete trackierBasicPostData['iurl'];

        // create offer on trackier
        const axios_header = {
            headers: {
                'x-api-key': process.env.API_KEY,
                'Content-Type': 'application/json'
            }
        };

        // create offer on trackier
        const axios_adk_header = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        //console.log(trackierBasicPostData);
        // START CREATE OFFER ON TRACKIER BASICS


        axios.post(process.env.API_BASE_URL + "campaigns", trackierBasicPostData, axios_header).then((response) => {
            //console.log('First');
            console.log('Step1 Request');
            //response.data  get all data
            // Update status on local DB
            //console.log(response.data);
            // START CHECK IF CREATE OFFER ON TRACKIER BASICS OK
            if (typeof response.data.success !== 'undefined' && response.data.success == true) {
                console.log('Step1 Response');
                step1 = true;
                // console.log('First response ok');
                var trackier_camp_id = response.data.campaign.id;

                const basicTargeting = [{
                    "variable": "country", "logic": "allow", "condition": "contains", "values": country
                }, { "variable": "os", "logic": "allow", "condition": "contains", "values": [operating_system], "osVersion": osVersionMins }, {
                    "variable": "region", "logic": state_inc_and_exc_str, "condition": "contains", "values": state
                }, { "variable": "city", "logic": city_inc_and_exc_str, "condition": "contains", "values": city }, { "variable": "gaid", "logic": "deny", "condition": "empty" }];

                if (Array.isArray(state) && state.length == 0) {
                    basicTargeting.splice(2, 1);
                    if (Array.isArray(city) && city.length == 0) {
                        basicTargeting.splice(2, 1);
                    }
                } else {
                    if (Array.isArray(city) && city.length == 0) {
                        basicTargeting.splice(3, 1);
                    }
                }
                const bTargetingFltData = { "name": "AL-CB-Targetting-" + trackier_camp_id + "-All", "condition": "and", "event": "all", "excludedPubIds": publisherIdsArr, 'rules': basicTargeting };
                // START CREATE BASIC TRAGETING ON TRACKIER 
                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", bTargetingFltData, axios_header).then(async (basicTrgt) => {
                    console.log('Step2 Request');
                    //console.log('basic targetings');
                    // END START CREATE BASIC TRAGETING ON TRACKIER IS OK
                    if (typeof basicTrgt.data.success !== 'undefined' && basicTrgt.data.success == true) {
                        console.log('Step2 Response');
                        step2 = true;
                        //console.log('basic targetings response ok');
                        if (finalVtaLink) {
                            const impressionTrackingSettig = { "allowImp": 1, "enableVta": 1 };
                            //STEP-1.1 Push imression setting
                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/impression-tracking", impressionTrackingSettig, axios_header).then((imression_setting) => {
                                console.log('Step3 Request');
                                if (typeof imression_setting.data.success !== 'undefined' && imression_setting.data.success == true) {
                                    step3 = true;
                                    // impression setting done
                                    // console.log('impression-tracking ok');
                                    console.log('Step3 Response');
                                } else {
                                    step3 = false;
                                }
                            }).catch(err => {
                                step3 = false;
                                console.log("impression-tracking");
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }

                        var publishersMailArr = [];
                        var publishersS2SEnabledArr = [];
                        if (Array.isArray(publishers) && publishers.length > 0) {
                            for (let i = 0; i < publishers.length; i++) {
                                let pubDt = publishers[i];
                                //publishers.forEach(async function callback(pubDt, index) {
                                //console.log(`${index}: ${value.pub_id}`);
                                const pubTargeting = [{
                                    "variable": "country", "logic": "allow", "condition": "contains", "values": country
                                }, { "variable": "os", "logic": "allow", "condition": "contains", "values": [operating_system], "osVersion": osVersionMins }, {
                                    "variable": "region", "logic": state_inc_and_exc_str, "condition": "contains", "values": state
                                }, { "variable": "city", "logic": city_inc_and_exc_str, "condition": "contains", "values": city }];

                                if (typeof pubDt.enable_os_targeting !== 'undefined' && pubDt.enable_os_targeting == "Disabled") {
                                    pubTargeting.splice(1, 1);
                                    if (Array.isArray(state) && state.length == 0) {
                                        pubTargeting.splice(1, 1);
                                    }
                                    if (Array.isArray(city) && city.length == 0) {
                                        pubTargeting.splice(1, 1);
                                    }
                                } if (Array.isArray(state) && state.length == 0) {
                                    pubTargeting.splice(2, 1);
                                    if (Array.isArray(city) && city.length == 0) {
                                        pubTargeting.splice(2, 1);
                                    }
                                } else {
                                    if (Array.isArray(city) && city.length == 0) {
                                        pubTargeting.splice(3, 1);
                                    }
                                }

                                const pTargetingFltData = { "name": "AL-PSB-Targetting-" + trackier_camp_id + "-All-" + pubDt.pub_name + "-" + pubDt.pub_id, "publisherIds": [pubDt.pub_id], "condition": "and", "event": "all", 'rules': pubTargeting };

                                if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {
                                    if (pubDt.pub_id == 2705) {
                                        pTargetingFltData['rules'].push({ "variable": "source", "logic": "allow", "condition": "contains", "values": ["indusos_auto"] })
                                    }
                                }

                                // STEP-4 Push Publisher targeting on trackier
                                try {
                                    let pubTarRes = await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", pTargetingFltData, axios_header);
                                    console.log('Step4 Request');
                                    //console.log('Publisher targeting');
                                    if (typeof pubTarRes.data.success !== 'undefined' && pubTarRes.data.success == true) {
                                        step4 = true;
                                        //console.log('Publisher targeting ok');
                                        console.log('Step4 Response');

                                        if (pubDt.wl_s2s == "Yes") {
                                            publishersS2SEnabledArr.push(pubDt.pub_id);
                                        }

                                        if (pubDt.enable_s2s == "Yes") {
                                            var supportive_link = "";
                                            if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {
                                                supportive_link = finalCtaLink + "&redirect=false&af_ip={p5}&af_ua={user_agent}";
                                            } else if (typeof MMP !== 'undefined' && MMP == "Branch") {
                                                supportive_link = finalCtaLink + "&%24s2s=TRUE&device_ip={p5}&user_agent={user_agent}";
                                            } else if (typeof MMP !== 'undefined' && MMP == "Adjust") {

                                                // CHECK "IN" IN array for domain replace
                                                var inArrayCountry = country.filter(function (inC) { return inC == "IN"; })
                                                if (Array.isArray(inArrayCountry) && inArrayCountry.length > 0) {
                                                    const search_replace_adj = { 'app.adjust.com': 's2s.adjust.net.in', 'app.adjust.net.in': 's2s.adjust.net.in' };
                                                    supportive_link = finalCtaLink.replace(/app.adjust.com|app.adjust.net.in/g, matched => search_replace_adj[matched]);
                                                } else {
                                                    const search_replace_adj = { 'app.adjust.com': 's2s.adjust.com', 'app.adjust.net.in': 's2s.adjust.com' };
                                                    supportive_link = finalCtaLink.replace(/app.adjust.com|app.adjust.net.in/g, matched => search_replace_adj[matched]);
                                                }

                                                supportive_link = supportive_link + "&s2s=1&ip_address={p5}&user_agent={user_agent}";

                                            } else if (typeof MMP !== 'undefined' && MMP == "Appmetrica") {
                                                supportive_link = finalCtaLink + "&device_ip={p5}&device_ua={user_agent}&click_timestamp={click_time}&noredirect=1";
                                            } else if (typeof MMP !== 'undefined' && MMP == "Singular") {
                                                supportive_link = finalCtaLink + "&ve={os_version}&redirect=FALSE&ip={ip}&ua={user_agent}&p=Android&sng_ref=applabs_{click_id}";
                                            } else if (typeof MMP !== 'undefined' && MMP == "MyTracker") {
                                                supportive_link = finalCtaLink + "&mt_s2s=1&mt_no_redirect=1";
                                            } else {
                                                supportive_link = finalCtaLink;
                                            }
                                        } else {
                                            supportive_link = finalCtaLink;
                                        }

                                        if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {
                                            if (pubDt.pub_id == 2705) {
                                                supportive_link = supportive_link + "&af_engagement_type=click_to_download&af_ad_type=installed";
                                                supportive_link = supportive_link.replace('AL_1{publisher_id}8_{camp_id}', 'AL127058_1');
                                            }
                                            /*if (pubDt.pub_id == 2963) {
                                              supportive_link = supportive_link + "&af_engagement_type={p8}&af_ad_type={p9}&is_transfer={p10}";
                                            }*/
                                            supportive_link = supportive_link.replace('AL_1{publisher_id}8_{camp_id}', pubDt.appsflyer_site_id);
                                        }

                                        if (pubDt.pub_id == 2802) {
                                            if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {

                                                if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                                                    var decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                                    supportive_link = supportive_link.replace(encodeURIComponent(decodeRedirectUrl), "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id);
                                                } else {
                                                    supportive_link = supportive_link + "&af_r=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                                }

                                            } else if (typeof MMP !== 'undefined' && MMP == "Branch") {
                                                supportive_link = supportive_link + "&%24android_url=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id + "&%24mobile_web_only=true";
                                            } else if (typeof MMP !== 'undefined' && MMP == "Adjust") {
                                                if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                                    var decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                                    supportive_link = supportive_link.replace(encodeURIComponent(decodeRedirectUrl), "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id);
                                                } else {
                                                    supportive_link = supportive_link + "&redirect=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                                }
                                            }
                                        }
                                        if (pubDt.pub_id == 3631) {
                                            if (typeof MMP !== 'undefined' && MMP == "Branch") {
                                                supportive_link = supportive_link + "&%24android_url=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id + "&%24mobile_web_only=true";
                                            } else if (typeof MMP !== 'undefined' && MMP == "Adjust") {
                                                if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                                    var decodeRedirectUrl3631 = decodeURIComponent(cta_redirect_link);
                                                    supportive_link = supportive_link.replace(encodeURIComponent(decodeRedirectUrl3631), "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id);
                                                } else {
                                                    supportive_link = supportive_link + "&redirect=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                                }
                                            }
                                        }

                                        var pubLandignPage = {
                                            "title": "AL-PLP-" + trackier_camp_id + "-" + pubDt.pub_name + "-" + pubDt.pub_id, "previewLink": preview_url, "url": supportive_link, "iurl": finalVtaLink, "status": "active", "visibility": "private", "lpType": "targeting_group", "ruleValue": pubTarRes.data.ruleblock._id
                                        };
                                        // IF VTA_URL IS NOT FOUND THE DELETE iurl from publicaherLandingPage objects
                                        if (!finalVtaLink)
                                            delete pubLandignPage['iurl'];

                                        publishersMailArr.push({ "pub_id": pubDt.pub_id, "supportive_link": supportive_link });

                                        // STEP-5 Push Publisher LP on trackier
                                        //var pubLpRes = await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", pubLandignPage, axios_header);
                                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", pubLandignPage, axios_header).then(async (pubLpRes) => {
                                            console.log('Step5 Request');
                                            //console.log('Publisher LP');
                                            if (typeof pubLpRes.data.success !== 'undefined' && pubLpRes.data.success == true) {
                                                console.log('Step5 Response');
                                                step5 = true;

                                                // for Indus publisher add non auto
                                                if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {
                                                    // for Indus publisher add non auto
                                                    if (pubDt.pub_id == 2705) {
                                                        var pubNonTargeting = [{
                                                            "variable": "country", "logic": "allow", "condition": "contains", "values": country
                                                        }, { "variable": "os", "logic": "allow", "condition": "contains", "values": [operating_system], "osVersion": osVersionMins }, {
                                                            "variable": "region", "logic": state_inc_and_exc_str, "condition": "contains", "values": state
                                                        }, { "variable": "city", "logic": city_inc_and_exc_str, "condition": "contains", "values": city }];

                                                        if (typeof pubDt.enable_os_targeting !== 'undefined' && pubDt.enable_os_targeting == "Disabled") {
                                                            pubNonTargeting.splice(1, 1);
                                                            if (Array.isArray(state) && state.length == 0) {
                                                                pubNonTargeting.splice(1, 1);
                                                            }
                                                            if (Array.isArray(city) && city.length == 0) {
                                                                pubNonTargeting.splice(1, 1);
                                                            }
                                                        } if (Array.isArray(state) && state.length == 0) {
                                                            pubNonTargeting.splice(2, 1);
                                                            if (Array.isArray(city) && city.length == 0) {
                                                                pubNonTargeting.splice(2, 1);
                                                            }
                                                        } else {
                                                            if (Array.isArray(city) && city.length == 0) {
                                                                pubNonTargeting.splice(3, 1);
                                                            }
                                                        }

                                                        var pTargetingNonAutoFltData = { "name": "AL-PSB-Targetting-NON-AUTO-" + trackier_camp_id + "-All-" + pubDt.pub_name + "-" + pubDt.pub_id, "publisherIds": [pubDt.pub_id], "condition": "and", "event": "all", 'rules': pubNonTargeting };
                                                        pTargetingNonAutoFltData['rules'].push({ "variable": "source", "logic": "deny", "condition": "contains", "values": ["indusos_auto"] });

                                                        try {
                                                            console.log('Step6 Request');
                                                            let pubNonAutoTarRes = await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", pTargetingNonAutoFltData, axios_header);

                                                            // STEP-4 Push Publisher targeting on trackier
                                                            if (typeof pubNonAutoTarRes.data.success !== 'undefined' && pubNonAutoTarRes.data.success == true) {
                                                                console.log('Step6 Response');
                                                                var supportive_link = "";
                                                                if (pubDt.enable_s2s == "Yes") {
                                                                    supportive_link = finalCtaLink + "&redirect=false&af_ip={p5}&af_ua={user_agent}";
                                                                } else {
                                                                    supportive_link = finalCtaLink;
                                                                }

                                                                supportive_link = supportive_link + "&af_engagement_type=click_to_download&af_ad_type=installed";
                                                                supportive_link = supportive_link.replace('AL_1{publisher_id}8_{camp_id}', 'AL127058');

                                                                var pubLandignNoAutoPage = {
                                                                    "title": "AL-PLP-NON-AUTO-" + trackier_camp_id + "-" + pubDt.pub_name + "-" + pubDt.pub_id, "previewLink": preview_url, "url": supportive_link, "iurl": finalVtaLink, "status": "active", "visibility": "private", "lpType": "targeting_group", "ruleValue": pubNonAutoTarRes.data.ruleblock._id
                                                                };
                                                                // IF VTA_URL IS NOT FOUND THE DELETE iurl from publicaherLandingPage objects
                                                                if (!finalVtaLink)
                                                                    delete pubLandignNoAutoPage['iurl'];

                                                                // STEP-5 Push Publisher LP on trackier
                                                                try {
                                                                    console.log('Step7 Request');
                                                                    let pubNonAutoLpRes = await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", pubLandignNoAutoPage, axios_header);
                                                                    if (typeof pubNonAutoLpRes.data.success !== 'undefined' && pubNonAutoLpRes.data.success == true) {
                                                                        console.log('Step7 Response');
                                                                    } else {
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    }
                                                                } catch (err) {
                                                                    console.log(err);
                                                                }
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        } catch (err) {
                                                            console.log("Publisher Targeting for Indus publisher add non auto");
                                                            console.log(err);
                                                        }
                                                    }
                                                }
                                            } else {
                                                step5 = false;
                                                console.log("Publisher LP else");
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(error => {
                                            step5 = false;
                                            console.log("Publisher LP");
                                            console.log(error);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                        // END STEP-5 Push Publisher LP on trackier
                                    } else {
                                        step4 = false;
                                        console.log("Publisher targetings else");
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                } catch (err) {
                                    console.log("Publisher targetings");
                                    console.log(err);
                                }
                                // END STEP-4 Push Publisher targeting on trackier
                                //});
                            }
                        }

                        // Set white list publisher on trackier
                        if (Array.isArray(publishersS2SEnabledArr) && publishersS2SEnabledArr.length > 0) {
                            const pubS2SEnabledPage = { "serverSideClicks": 1, "s2sPubSetting": "include", "s2spubs": publishersS2SEnabledArr };
                            //STEP-1.1 Push imression setting
                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/s2s-tracking", pubS2SEnabledPage, axios_header).then((s2s_tracking) => {
                                console.log('s2s-tracking Request');
                                if (typeof s2s_tracking.data.success !== 'undefined' && s2s_tracking.data.success == true) {
                                    console.log('s2s-tracking Response');
                                }
                            }).catch(err => {
                                console.log("s2s-tracking");
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }

                        // PAYOUT AND GOALS PUSH ON TRACKIER inthe case of goal and budget type "install"
                        if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPI') {
                            //===================PAYOUT AND GOALS============================ 
                            if (Array.isArray(publishers) && publishers.length > 0) {
                                for (let i = 0; i < publishers.length; i++) {
                                    let pubDt = publishers[i];

                                    for (const cTry of country) {
                                        let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pubDt.pub_id), cTry);
                                        if (pubPayoutDt) {
                                            if (isNumeric(pubPayoutDt.pub_avg_po)) {
                                                const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                                const publisherGoalPayout = {
                                                    "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                                };

                                                // STEP-8 Push publisher goals payout on trackier
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                    console.log('Step8 Request');
                                                    if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                        console.log('Step8 Response');

                                                        const sampValue = (pub_avg_payout - (payable_event_price - (payable_event_price * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                                        const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                                        if (samplingMinVal > 0) {
                                                            var samplingMinVals = samplingMinVal;
                                                        } else {
                                                            var samplingMinVals = 5;
                                                        }
                                                        // SET publisher samplings/CutBack
                                                        const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };

                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                            console.log('Step9 Request');
                                                            if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                console.log('Step9 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }

                                                }).catch(err => {
                                                    //console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });

                                            } else {
                                                const pub_avg_payout = parseFloat(campaignRevenue);
                                                const publisherGoalPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                                // STEP-8 Push publisher goals payout on trackier
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                    console.log('Step10 Request');
                                                    if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                        console.log('Step10 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });
                                            }
                                        } else {
                                            const pubPayblePayout = ((parseFloat(payable_event_price) * parseFloat(pubDt.revenue_share)) / 100);
                                            const publisherGoalPayout = { "payout": parseFloat(pubPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubDt.pub_id)] };
                                            // STEP-8 Push publisher goals payout on trackier
                                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                console.log('Step11 Request');
                                                if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                    console.log('Step11 Response');
                                                } else {
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            });

                                            // SET publisher samplings/CutBack
                                            const publisherSamplings = { "pubIds": [parseInt(pubDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                console.log('Step12 Request');
                                                if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                    console.log('Step12 Response');
                                                } else {
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            });
                                        }
                                    }
                                }
                            }

                            // STEP-13 Push campaign caps on trackier 
                            const campCaps = { "type": "revenue", "visibility": "private", "pubCapType": "group", "daily": parseInt(daily_budget), "lifetime": parseInt(total_budget) };
                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", campCaps, axios_header).then((capsRes) => {
                                console.log('Step13 Request');
                                if (typeof capsRes.data.success !== 'undefined' && capsRes.data.success == true) {
                                    console.log('Step13 Response');
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });


                            if (Array.isArray(publishers) && publishers.length > 0) {
                                let pub_array = await getpublisherPayoutArr();
                                for (let j = 0; j < publishers.length; j++) {
                                    let pCheck = publishers[j];
                                    //var pubPayoutDt = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                    //let pubPayoutDt = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                    if (pub_array.hasOwnProperty(pCheck.pub_id)) {
                                        let gross_cap_install = pub_array[pCheck.pub_id];
                                        const publisherCaps = { "type": "approvedConv", "visibility": "public", "pubCapType": "group", "daily": parseInt(gross_cap_install), "publisherIds": [pCheck.pub_id] };
                                        // STEP-6.1 Push publisher wise caps on trackier

                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                            console.log('Step14 Request');
                                            if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                console.log('Step14 Response');
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(err => {
                                            console.log(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                    } else {
                                        const publisherCaps = { "type": "approvedConv", "visibility": "public", "pubCapType": "group", "daily": 100, "publisherIds": [pCheck.pub_id] };
                                        // STEP-6.1 Push publisher wise caps on trackier
                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                            console.log('Step15 Request');
                                            if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                console.log('Step15 Response');
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(err => {
                                            console.log(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                    }
                                }
                            }
                        }

                        if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPA') {

                            if (Array.isArray(goal_budget) && goal_budget.length) {
                                var whitelistPostbackPubs = [];
                                for (let i = 0; i < goal_budget.length; i++) {
                                    let goalBudget = goal_budget[i];

                                    // STEP-7 Push campaign goals on trackier
                                    const campaignGoals = { "title": goalBudget.non_payable_event_name, "value": goalBudget.non_payable_event_name, "type": "public", "payout_model": "fixed", "payouts": [{ "payout": 0, "revenue": parseFloat(goalBudget.non_payable_event_price), "geo": country }] };
                                    // STEP-6.1 Push publisher wise caps on trackier
                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", campaignGoals, axios_header).then(async (cGoalRes) => {
                                        console.log('Step16 Request');
                                        if (typeof cGoalRes.data.success !== 'undefined' && cGoalRes.data.success == true) {
                                            console.log('Step16 Response');

                                            if (typeof goalBudget.non_payable_event_price !== 'undefined' && parseFloat(goalBudget.non_payable_event_price) > 0) {
                                                // STEP-8 Push campaign caps on trackier
                                                const campCaps = { "type": "revenue", "goalId": cGoalRes.data.goal._id, "visibility": "private", "pubCapType": "group", "daily": parseInt(daily_budget), "lifetime": parseInt(total_budget) };
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", campCaps, axios_header).then((capsRes) => {
                                                    console.log('Step17 Request');
                                                    if (typeof capsRes.data.success !== 'undefined' && capsRes.data.success == true) {
                                                        console.log('Step17 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });

                                                if (Array.isArray(publishers) && publishers.length > 0) {
                                                    let pub_array = await getpublisherPayoutArr();
                                                    for (let i = 0; i < publishers.length; i++) {
                                                        let pCheck = publishers[i];
                                                        // let pubPayoutDt = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                                        //let pubPayoutDt = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                                        if (pub_array.hasOwnProperty(pCheck.pub_id)) {
                                                            let gross_cap_install = pub_array[pCheck.pub_id];
                                                            whitelistPostbackPubs.push(parseInt(pCheck.pub_id));
                                                            // STEP-6.1 Push publisher wise caps on trackier
                                                            const publisherCaps = { "type": "approvedConv", "visibility": "public", "pubCapType": "group", "daily": parseInt(gross_cap_install), "publisherIds": [pCheck.pub_id] };
                                                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                                                console.log('Step18 Request');
                                                                if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                                    console.log('Step18 Response');
                                                                } else {
                                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                    res.status(200).send(resMsg);
                                                                    return;
                                                                }
                                                            }).catch(err => {
                                                                console.log(err);
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            });
                                                        } else {
                                                            // STEP-6.1 Push publisher wise caps on trackier
                                                            const publisherCaps = { "type": "approvedConv", "goalId": cGoalRes.data.goal._id, "visibility": "public", "pubCapType": "group", "daily": 100, "publisherIds": [pCheck.pub_id] };
                                                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                                                console.log('Step19 Request');
                                                                if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                                    console.log('Step19 Response');
                                                                } else {
                                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                    res.status(200).send(resMsg);
                                                                    return;
                                                                }
                                                            }).catch(err => {
                                                                console.log(err);
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            });
                                                        }

                                                        for (const cTry of country) {
                                                            //let pubPayoutDt = await publisherPayout.findOne({ '$and': [{ 'pub_id': parseInt(pCheck.pub_id) }, { 'Geo': cTry }] });
                                                            let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pCheck.pub_id), cTry);
                                                            if (pubPayoutDt) {
                                                                if (isNumeric(pubPayoutDt.pub_avg_po)) {

                                                                    // STEP-10 Push publisher goals payout on trackier
                                                                    const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                                                    const publisherPayout = {
                                                                        "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                                                    };

                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {

                                                                        console.log('Step20 Request');
                                                                        if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                            console.log('Step20 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });

                                                                    const sampValue = (pub_avg_payout - (goalBudget.non_payable_event_price - (goalBudget.non_payable_event_price * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                                                    const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                                                    if (samplingMinVal > 0) {
                                                                        var samplingMinVals = samplingMinVal;
                                                                    } else {
                                                                        var samplingMinVals = 5;
                                                                    }
                                                                    // SET publisher samplings/CutBack
                                                                    const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };
                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                                        console.log('Step21 Request');
                                                                        if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                            console.log('Step21 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });
                                                                } else {
                                                                    const pub_avg_payout = parseFloat(goalBudget.non_payable_event_price);
                                                                    const publisherPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                                                    // STEP-10 Push publisher goals payout on trackier\
                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                                        console.log('Step22 Request');
                                                                        if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                            console.log('Step22 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });
                                                                }
                                                            } else {
                                                                //let pubPayoutDtG = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                                                // let pubPayoutDtG = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                                                let pubPayoutDtG = await getpublisherPayoutArr();
                                                                if (pubPayoutDtG.hasOwnProperty(pCheck.pub_id)) {
                                                                    const pubNonPayblePayout = ((parseFloat(goalBudget.non_payable_event_price) * parseFloat(pCheck.revenue_share)) / 100);
                                                                    const publisherPayout = { "payout": parseFloat(pubNonPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pCheck.pub_id)] };

                                                                    // STEP-10 Push publisher goals payout on trackier
                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                                        console.log('Step23 Request');
                                                                        if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                            console.log('Step23 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });
                                                                } else {
                                                                    const pubNonPayblePayout = ((parseFloat(goalBudget.non_payable_event_price) * parseFloat(pCheck.revenue_share)) / 100);
                                                                    const publisherPayout = {
                                                                        "payout": parseFloat(pubNonPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pCheck.pub_id)], "goalId": cGoalRes.data.goal._id
                                                                    };

                                                                    // STEP-10 Push publisher goals payout on trackier
                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                                        console.log('Step24 Request');
                                                                        if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                            console.log('Step24 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });

                                                                }

                                                                //let pubPayoutDtByCountry = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                                                //let pubPayoutDtByCountry = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                                                let pubPayoutDtByCountry = await getpublisherPayoutArr();
                                                                if (pubPayoutDtByCountry.hasOwnProperty(pCheck.pub_id)) {
                                                                    // SET publisher samplings/CutBack
                                                                    const publisherSamplings = { "pubIds": [parseInt(pCheck.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                                        console.log('Step25 Request');
                                                                        if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                            console.log('Step25 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });

                                                                } else {
                                                                    // SET publisher samplings/CutBack
                                                                    const publisherSamplings = { "pubIds": [parseInt(pCheck.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "goalId": cGoalRes.data.goal._id, "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };

                                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                                        console.log('Step26 Request');
                                                                        if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                            console.log('Step26 Response');
                                                                        } else {
                                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                            res.status(200).send(resMsg);
                                                                            return;
                                                                        }
                                                                    }).catch(err => {
                                                                        console.log(err);
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                const publisherGoalPayoutBlockPub = { "goals": [{ 'goalId': "default", "blacklistPostbackPubs": [], "whitelistPostbackPubs": whitelistPostbackPubs }] };
                                                // STEP-9 Pusho on trackier blacklisting lushlisher for default goals ex install
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/postback-settings", publisherGoalPayoutBlockPub, axios_header).then((pubSetpayoutRes) => {
                                                    console.log('Step27 Request');
                                                    if (typeof pubSetpayoutRes.data.success !== 'undefined' && pubSetpayoutRes.data.success == true) {
                                                        console.log('Step27 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });
                                                const publisherGoalPayoutBlockPubBlackList = { "goals": [{ 'goalId': cGoalRes.data.goal._id, "blacklistPostbackPubs": whitelistPostbackPubs, "whitelistPostbackPubs": [] }] };
                                                // STEP-9 Pusho on trackier blacklisting lushlisher for any specific goals
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/postback-settings", publisherGoalPayoutBlockPubBlackList, axios_header).then((pubSetpayoutBlackRes) => {


                                                    console.log('Step28 Request');
                                                    if (typeof pubSetpayoutBlackRes.data.success !== 'undefined' && pubSetpayoutBlackRes.data.success == true) {
                                                        console.log('Step28 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });
                                            } else {
                                                const publisherGoalPayoutBlockAllPub = { "goals": [{ 'goalId': cGoalRes.data.goal._id, "blacklistPostbackPubs": ["all"], "whitelistPostbackPubs": [] }] };
                                                // STEP-9 Pusho on trackier blacklisting lushlisher for any specific goals
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/postback-settings", publisherGoalPayoutBlockAllPub, axios_header).then((pubSetpayoutAllRes) => {
                                                    console.log('Step29 Request');
                                                    if (typeof pubSetpayoutAllRes.data.success !== 'undefined' && pubSetpayoutAllRes.data.success == true) {
                                                        console.log('Step29 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });

                                            }
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }

                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });
                                }

                                // PYABALE EVENT PRICE IS GREATER THAN 0
                                if (typeof payable_event_price !== 'undefined' && parseFloat(payable_event_price) > 0) {
                                    //===================PAYOUT AND GOALS============================ 
                                    if (Array.isArray(publishers) && publishers.length > 0) {
                                        for (let k = 0; k < publishers.length; k++) {
                                            let pubDt = publishers[k];
                                            for (const cTry of country) {
                                                //let pubPayoutDt = await publisherPayout.findOne({ '$and': [{ 'pub_id': parseInt(pubDt.pub_id) }, { 'Geo': cTry }] });
                                                let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pubDt.pub_id), cTry);
                                                if (pubPayoutDt) {
                                                    if (isNumeric(pubPayoutDt.pub_avg_po)) {
                                                        const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                                        const publisherGoalPayout = {
                                                            "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                                        };
                                                        // STEP-8 Push publisher goals payout on trackier
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                            console.log('Step30 Request');
                                                            if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                                console.log('Step30 Response');

                                                                const sampValue = (pub_avg_payout - (payable_event_price - (payable_event_price * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                                                const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                                                if (samplingMinVal > 0) {
                                                                    var samplingMinVals = samplingMinVal;
                                                                } else {
                                                                    var samplingMinVals = 5;
                                                                }
                                                                // SET publisher samplings/CutBack
                                                                const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };
                                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                                    console.log('Step31 Request');
                                                                    if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                        console.log('Step31 Response');
                                                                    } else {
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    }
                                                                }).catch(err => {
                                                                    console.log(err);
                                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                    res.status(200).send(resMsg);
                                                                    return;
                                                                });
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });

                                                    } else {
                                                        const pub_avg_payout = parseFloat(campaignRevenue);
                                                        const publisherGoalPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                                        // STEP-8 Push publisher goals payout on trackier
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                            console.log('Step32 Request');
                                                            if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                                console.log('Step32 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    }
                                                } else {
                                                    const pubPayblePayout = ((parseFloat(payable_event_price) * parseFloat(pubDt.revenue_share)) / 100);
                                                    const publisherGoalPayout = { "payout": parseFloat(pubPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubDt.pub_id)] };
                                                    // STEP-8 Push publisher goals payout on trackier
                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                                        console.log('Step33 Request');
                                                        if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                                            console.log('Step33 Response');
                                                        } else {
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        }
                                                    }).catch(err => {
                                                        console.log(err);
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    });

                                                    // SET publisher samplings/CutBack
                                                    const publisherSamplings = { "pubIds": [parseInt(pubDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                        console.log('Step34 Request');
                                                        if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                            console.log('Step34 Response');
                                                        } else {
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        }
                                                    }).catch(err => {
                                                        console.log(err);
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    // STEP-13 Push campaign caps on trackier 
                                    const campCaps = { "type": "revenue", "visibility": "private", "pubCapType": "group", "daily": parseInt(daily_budget), "lifetime": parseInt(total_budget) };
                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", campCaps, axios_header).then((capsRes) => {
                                        console.log('Step35 Request');
                                        if (typeof capsRes.data.success !== 'undefined' && capsRes.data.success == true) {
                                            console.log('Step35 Response');
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });

                                    if (Array.isArray(publishers) && publishers.length > 0) {
                                        let pub_array = await getpublisherPayoutArr();
                                        for (let j = 0; j < publishers.length; j++) {
                                            let pCheck = publishers[j];
                                            //let pubPayoutDt = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                            if (pub_array.hasOwnProperty(pCheck.pub_id)) {
                                                let gross_cap_install = pub_array[pCheck.pub_id];
                                                const publisherCaps = { "type": "approvedConv", "visibility": "public", "pubCapType": "group", "daily": parseInt(gross_cap_install), "publisherIds": [pCheck.pub_id] };
                                                // STEP-6.1 Push publisher wise caps on trackier
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                                    if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                        console.log('Step36 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });

                                            } else {
                                                const publisherCaps = { "type": "approvedConv", "visibility": "public", "pubCapType": "group", "daily": 100, "publisherIds": [pCheck.pub_id] };
                                                // STEP-6.1 Push publisher wise caps on trackier
                                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", publisherCaps, axios_header).then((pubCapsRes) => {
                                                    console.log('Step37 Request');
                                                    if (typeof pubCapsRes.data.success !== 'undefined' && pubCapsRes.data.success == true) {
                                                        console.log('Step37 Response');
                                                    } else {
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // START push app lists on trackier
                        if (typeof source_type !== 'undefined' && source_type == "SDK") {

                            if (operating_system == 'android') {
                                var os = "AOS";
                            } else {
                                var os = "IOS";
                            }
                            let app_lists = await appLists.find({ '$and': [{ 'Geo': { '$in': country } }, { "OS": os }, { 'Category': { '$in': interest } }, { 'Language': { '$in': language } },] }).sort({ _id: -1 });

                            var valid_fields = [];
                            for (let i = 0; i < app_lists.length; i++) {
                                let app = app_lists[i];
                                valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio);
                            }
                            var fionalAppList = [];
                            for (let j = 0; j < valid_fields.length; j++) {

                                let expIntApp = valid_fields[j].split("__");
                                for (let k = 0; k < parseInt(expIntApp[1]); k++) {
                                    fionalAppList.push(expIntApp[0]);
                                }
                            }
                            shuffle(fionalAppList);
                            n = 1000;
                            var shuffled = fionalAppList.sort(function () { return 0.5 - Math.random() });
                            var randomlyPickedappList = shuffled.slice(0, n);
                            const appListData = { "appNames": randomlyPickedappList };
                            // STEP-11 push app lists on trackier
                            axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/app-names", appListData, axios_header).then((applistUpload) => {
                                console.log('Step38 Request');
                                if (typeof applistUpload.data.success !== 'undefined' && applistUpload.data.success == true) {
                                    console.log('Step38 Response');
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }

                        if (Array.isArray(creatives) && creatives.length > 0) {
                            var creativeName = [];
                            var creative_dimension = [];
                            for (let i = 0; i < creatives.length; i++) {
                                creativeName.push(creatives[i].creative);
                                creative_dimension.push(creatives[i].image_dimension);
                                //process.exit();
                                const creative_data = new CreativeModel({
                                    campaign_id: DBdata._id,
                                    trackier_adv_id: advertiser,
                                    trackier_camp_id: trackier_camp_id,
                                    creative: creatives[i].creative,
                                    creative_type: creatives[i].creative_type,
                                    concept_name: creatives[i].concept_name,
                                    image_dimension: creatives[i].image_dimension,
                                    ads_end_date: creatives[i].ads_end_date,
                                    ads: creatives[i].ads,
                                    user: creatives[i].user,
                                    expired: "No"
                                });

                                //console.log(creative_data);
                                // Save Creative in the database
                                await creative_data.save(creative_data).then(data_c => {
                                    console.log('Creative ok');
                                }).catch(err => {
                                    console.error(err);
                                });
                            }
                            const final_creative_list = getCreativeNameLists(creativeName, creative_dimension);
                            // START INSERT DATA INTO DB WITH CREATIVE CTR
                            const banner_ctr = {
                                "300x250": "1.1348-1.4514",
                                "320x50": "1.1348-1.4514",
                                "320x480": "1.3514-1.7373",
                                "480x320": "1.303-1.8345",
                                "84x84": "1.1348-1.4514",
                                "default": "1.1348-1.4514",
                                "720x1280": "1.3514-1.7373",
                                "540x960": "1.3514-1.7373",
                                "1080x1920": "1.3514-1.7373",
                                "640x640": "1.3514-1.7373",
                                "1280x720": "1.3514-1.7373",
                                "1200x628": "1.3514-1.7373",
                                "960x540": "1.3514-1.7373"
                            }
                            var creativeArr = [];
                            for (const [key, val] of Object.entries(banner_ctr)) {
                                let ctrArr = val.split('-');
                                let randCTR = generateRandomNumber(parseFloat(ctrArr[0]), parseFloat(ctrArr[1]));
                                creativeArr[key] = parseFloat(randCTR);
                            }

                            var final_creative_list_mod = [];
                            for (let i = 0; i < final_creative_list.length; i++) {
                                let key = Object.keys(final_creative_list[i])[0];
                                let value = final_creative_list[i][key];

                                final_creative_list_mod.push(value);
                                let creative = value;
                                for (const [size, val] of Object.entries(creativeArr)) {
                                    if (key.indexOf(size) !== -1) {
                                        const aData = new CreativeCtrModel({
                                            trackier_adv_id: advertiser,
                                            trackier_camp_id: trackier_camp_id,
                                            creative_name: creative,
                                            creative_ctr: val,
                                        });
                                        let creative_ctr_exist = await CreativeCtrModel.find({ 'creative_name': creative });
                                        var creative_ctr_exist_arr = [];
                                        for (let n = 0; n < creative_ctr_exist.length; n++) {
                                            let creative_c = creative_ctr_exist[n];
                                            creative_ctr_exist_arr.push(creative_c.creative_name);
                                        }
                                        if (Array.isArray(creative_ctr_exist_arr) && creative_ctr_exist_arr.length == 0) {
                                            await aData.save(aData).then(ctr_data => {
                                                console.log('Creative ads ctr ok');
                                            }).catch(err => {
                                                console.error(err);
                                            });
                                        }
                                    }
                                }
                            }
                            // END INSERT DATA INTO DB WITH CREATIVE CTR              
                            const creativeData = { "creativeNames": final_creative_list_mod };
                            // // STEP-11 push app lists on trackier
                            axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then((creativeUpload) => {
                                console.log('Step39 Request');
                                if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                                    console.log('Step39 Response');
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        } else {
                            const creativeIconName = icon.split('.');
                            const creativeData = { "creativeNames": [creativeIconName[0]] };
                            const aData = new CreativeCtrModel({
                                trackier_adv_id: advertiser,
                                trackier_camp_id: trackier_camp_id,
                                creative_name: creativeIconName[0],
                                creative_ctr: 1.4514,
                            });
                            await aData.save(aData).then(ctr_data => {
                                console.log('Creative icon ctr ok');
                                // // STEP-11 push app lists on trackier
                                axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then((creativeUpload) => {
                                    console.log('Step39 Request');
                                    if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                                        console.log('Step39 Response');
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const errMsg = { "success": false, "errors": err.response.data.errors };
                                    res.status(400).send(errMsg);
                                    return;
                                });
                            }).catch(err => {
                                console.error(err);
                            });
                        }
                        // CREATE OFFER ON ADKERNAL
                        // Create Xiaomi campaign on adkernal
                        var VTAExist = "No";
                        if (typeof vta_link !== 'undefined' && vta_link !== "") {
                            VTAExist = "Yes";
                        } else {
                            VTAExist = "No";
                        }

                        if (req_from == "work") {
                            var APPLABS_URL = "https://applabs.work/ads/";
                        } else {
                            var APPLABS_URL = process.env.APPLABS_URL_ADS;
                        }

                        try {
                            const xiaomiData = { 'country': country, "trackier_camp_id": trackier_camp_id, "bundle_id": bundle_id, "app_name": app_name, "descriptions": description, "icon": APPLABS_URL + icon, "VTAExist": VTAExist };

                            let res_xiomi = await axios.post(process.env.ADK_API_BASE_URL + "xiaomi/add?apiKey=" + process.env.ADK_API_KEY, xiaomiData, axios_adk_header);
                            console.log('Step40 Request');
                            if (typeof res_xiomi.data.success !== 'undefined' && res_xiomi.data.success == true) {
                                console.log('Step40 Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                        }

                        // Create VIVO campaign on adkernal 
                        try {
                            const vivoData = { 'country': country, "trackier_camp_id": trackier_camp_id, "bundle_id": bundle_id, "app_name": app_name, "descriptions": description, "VTAExist": VTAExist };

                            let res_vivo = await axios.post(process.env.ADK_API_BASE_URL + "vivo/add?apiKey=" + process.env.ADK_API_KEY, vivoData, axios_adk_header);
                            console.log('Step41 Request');
                            if (typeof res_vivo.data.success !== 'undefined' && res_vivo.data.success == true) {
                                console.log('Step41 Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }


                        // Create OPPO campaign on adkernal 
                        try {
                            const oppoData = { 'country': country, "trackier_camp_id": trackier_camp_id, "bundle_id": bundle_id, "app_name": app_name, "descriptions": description, "icon": APPLABS_URL + icon, "preview_url": preview_url, "VTAExist": VTAExist };

                            let res_oppo = await axios.post(process.env.ADK_API_BASE_URL + "oppo/add?apiKey=" + process.env.ADK_API_KEY, oppoData, axios_adk_header);
                            console.log('Step42 Request');
                            if (typeof res_oppo.data.success !== 'undefined' && res_oppo.data.success == true) {
                                console.log('Step42 Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }


                        try {
                            const transsionData = { 'country': country, "trackier_camp_id": trackier_camp_id, "bundle_id": bundle_id, "app_name": app_name, "descriptions": description, "icon": APPLABS_URL + icon, "VTAExist": VTAExist };

                            let res_transsion = await axios.post(process.env.ADK_API_BASE_URL + "transsion/add?apiKey=" + process.env.ADK_API_KEY, transsionData, axios_adk_header);
                            console.log('Step43 Request');
                            if (typeof res_transsion.data.success !== 'undefined' && res_transsion.data.success == true) {
                                console.log('Step43 Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }


                        try {
                            const shareitRTBData = { 'country': country, "trackier_camp_id": trackier_camp_id, "bundle_id": bundle_id, "app_name": app_name, "descriptions": description, "icon": APPLABS_URL + icon, "VTAExist": VTAExist };

                            let res_shareitRTB = await axios.post(process.env.ADK_API_BASE_URL + "shareitRTB/add?apiKey=" + process.env.ADK_API_KEY, shareitRTBData, axios_adk_header);
                            console.log('Step44 Request');
                            if (typeof res_shareitRTB.data.success !== 'undefined' && res_shareitRTB.data.success == true) {
                                console.log('Step44 Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        } catch (err) {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }


                        const currBalance = await getAdvertiserBalByAdvId(advertiser);

                        if (typeof total_budget !== 'undefined' && total_budget > currBalance) {
                            const reMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Your balance is (" + currBalance + ")!!. Please enter amount less than/equal to your Available Balance" }] };
                            res.status(400).send(reMsg);
                            return;
                        }


                        const updatedBalance = (parseInt(currBalance) - parseInt(total_budget));
                        const advName = await getAdvertiserNameByAdvId(advertiser);
                        Advertiser.findOneAndUpdate({ tid: advertiser }, { balance: updatedBalance }, { new: true }).exec().then((updateBalance) => {
                            console.log('Balance Update Request');
                            if (updateBalance) {
                                console.log('Balance Update Response');
                                Offer.findOneAndUpdate({ _id: DBdata._id }, { trackier_camp_id: trackier_camp_id }, { new: true }).exec().then(async (resOffer) => {
                                    console.log('OfferId Update Request');
                                    if (resOffer) {
                                        console.log('OfferId Update Response');

                                        // INSERT DATA INTO NOTIFICATIONS
                                        const notificationData = {
                                            advertiser_id: parseInt(advertiser),
                                            advertiser_name: "",
                                            company_name: ucfirst(advName),
                                            offer_id: trackier_camp_id,
                                            offer_name: ucfirst(offer_name),
                                            category: "Campaign",

                                            subject_adv: "",
                                            message_adv: "",

                                            subject_sa: 'New Offer Set Up by Advertiser ' + ucfirst(advName),
                                            message_sa: "A new Campaign <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>  has been created for the advertiser <span class= 'text_primary'> " + ucfirst(advName) + "</span> by <span class='text_primary'> " + ucfirst(user_name) + "  </span>.",

                                            read: 0
                                        }

                                        // END INSERT DATA INTO NOTIFICATIONS
                                        await addNotificationsData(notificationData);

                                        // INSERT DATA INTO Tileline
                                        const timelineData = {
                                            advertiser_id: parseInt(advertiser),
                                            advertiser_name: ucfirst(updateBalance.name),
                                            offer_id: trackier_camp_id,
                                            offer_name: ucfirst(offer_name),
                                            type: "New Campaign Added",
                                            old_value: "",
                                            new_value: "",
                                            edited_by: ucfirst(user_name),
                                        }
                                        // END INSERT DATA INTO Tileline
                                        await addTimelineData(timelineData);


                                        // Send Mail to Admin
                                        const admin_mail = process.env.ADMIN_EMAILS.split(",");
                                        const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_created_admin.handlebars"), "utf-8");
                                        const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                        const messageBodyAdmin = (templateAdmin({
                                            todayDate: dateprint(),
                                            offer_name: ucfirst(offer_name),
                                            offer_id: trackier_camp_id,
                                            adv_name: ucfirst(advName),
                                            created_by: ucfirst(user_name),
                                            url: process.env.APPLABS_URL + 'view_offer',
                                            base_url: process.env.APPLABS_URL
                                        }))
                                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                        const msgAdmin = {
                                            to: admin_mail,
                                            from: {
                                                name: process.env.MAIL_FROM_NAME,
                                                email: process.env.MAIL_FROM_EMAIL,
                                            },
                                            //bcc: bcc_mail,
                                            subject: 'Applabs Alert - New Campaign Set Up by Advertiser ' + ucfirst(advName),
                                            html: messageBodyAdmin
                                        };
                                        //ES6
                                        sgMail.send(msgAdmin).then(() => { }, error => {
                                            console.error(error);
                                            if (error.response) {
                                                console.error(error.response.body)
                                            }
                                        }).catch((error) => {
                                            const response = { 'success': false, 'message': error };
                                            console.error(response);
                                        });
                                        // OFFER CEATED SUCCESSFULLY
                                        const resMsg = { "success": true, "message": "Offer Created!", "offer": resOffer };
                                        res.status(200).send(resMsg);
                                        return
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch((error) => {
                                    console.log(error);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch((error) => {
                            const reMsg = { "status": false, "message": error.message };
                            res.status(400).send(reMsg);
                        });
                    } else {
                        step2 = false;
                        console.log("Basic targetings else");
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                    // END START CREATE BASIC TRAGETING ON TRACKIER IS OK
                }).catch(err => {
                    step2 = false;
                    console.log("Basic targetings");
                    console.log(err);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });
                // END START CREATE BASIC TRAGETING ON TRACKIER 
            } else {
                step1 = false;
                console.log("Create Offer else");
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
            // END CHECK IF CREATE OFFER ON TRACKIER BASICS OK
        }).catch(err => {
            step1 = false;
            console.log("Create Offer");
            console.error(err.errors.message);
            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(400).send(resMsg);
            return;
        });

        // END CREATE OFFER ON TRACKIER BASICS
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating Offer."
        });
        return;
    });
};

// Get Offers Data
exports.getOfferData = async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const advertiserId = parseInt(req.query.advertiserId);
    const skipIndex = parseInt((page - 1) * limit);
    const offers = {};
    const { searchQuery, sorttype, sortdirection, advId, offer_id, operating_system, status, country } = req.body;


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

    console.log(sortObject);

    if ((typeof searchQuery !== "undefined" && searchQuery.length !== 0) || (typeof advId !== "undefined" && advId.length !== 0) || (typeof offer_id !== "undefined" && offer_id.length !== 0) || (typeof operating_system !== "undefined" && operating_system.length !== 0) || (typeof status !== "undefined" && status.length !== 0) || (typeof country !== "undefined" && country.length !== 0)) {

        if (!Array.isArray(advId)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advId should be []!!" } };
            res.status(400).send(reMsg);
            return;
        }
        if (!Array.isArray(offer_id)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "offer_id should be []!!" } };
            res.status(400).send(reMsg);
            return;
        }
        if (!Array.isArray(operating_system)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "operating_system should be []!!" } };
            res.status(400).send(reMsg);
            return;
        }
        if (!Array.isArray(status)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "status should be []!!" } };
            res.status(400).send(reMsg);
            return;
        }
        if (!Array.isArray(country)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" } };
            res.status(400).send(reMsg);
            return;
        }

        var searchOfferId = "";
        var searchOfferName = "";
        if (searchQuery && isNumeric(searchQuery)) {
            searchOfferId = parseInt(searchQuery);
        } else {
            searchOfferName = searchQuery;
        }

        const c_string = country.join(',');
        if (advertiserId) {
            var filterData = {
                '$match': {
                    '$or': [{ 'trackier_camp_id': { '$in': offer_id } }, { 'operating_system': { '$in': operating_system } }, { 'trackier_adv_id': { '$in': advId } }, { '$text': { '$search': `${c_string}` } }, { 'status': { '$in': status } }, { 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }, { 'offer_name': { '$regex': searchOfferName, $options: 'i' } }, {
                        $expr: {
                            $regexMatch: {
                                input: { $toString: "$trackier_camp_id" },
                                regex: `${searchOfferId}`
                            }
                        }
                    }]
                }
            };


            //console.log(filterData['$match']['$or']);

            if (Array.isArray(offer_id) && offer_id.length == 0) {
                delete filterData.$match.$or[0];
            }

            if (Array.isArray(operating_system) && operating_system.length == 0) {
                delete filterData.$match.$or[1];
            }

            if (Array.isArray(advId) && advId.length == 0) {
                delete filterData.$match.$or[2];
            }

            if (Array.isArray(country) && country.length == 0) {
                delete filterData.$match.$or[3];
            }

            if (Array.isArray(status) && status.length == 0) {
                delete filterData.$match.$or[4];
            }

            if (typeof searchOfferName !== 'undefined' && searchOfferName == "") {
                delete filterData.$match.$or[7];
            }
            if (typeof searchOfferId !== 'undefined' && searchOfferId == "") {
                delete filterData.$match.$or[8];
            }
        } else {
            var filterData = {
                '$match': {
                    '$or': [{ 'trackier_camp_id': { '$in': offer_id } }, { 'operating_system': { '$in': operating_system } }, { 'trackier_adv_id': { '$in': advId } }, { '$text': { '$search': `${c_string}` } }, { 'status': { '$in': status } }, { 'trackier_camp_id': { $ne: 0 } }, { 'offer_name': { '$regex': searchOfferName, $options: 'i' } }, {
                        $expr: {
                            $regexMatch: {
                                input: { $toString: "$trackier_camp_id" },
                                regex: `${searchOfferId}`
                            }
                        }
                    }
                    ]
                }
            };

            //console.log(filterData['$match']['$or']);

            if (Array.isArray(offer_id) && offer_id.length == 0) {
                delete filterData.$match.$or[0];
            }

            if (Array.isArray(operating_system) && operating_system.length == 0) {
                delete filterData.$match.$or[1];
            }

            if (Array.isArray(advId) && advId.length == 0) {
                delete filterData.$match.$or[2];
            }

            if (Array.isArray(country) && country.length == 0) {
                delete filterData.$match.$or[3];
            }

            if (Array.isArray(status) && status.length == 0) {
                delete filterData.$match.$or[4];
            }

            if (typeof searchOfferName !== 'undefined' && searchOfferName == "") {
                delete filterData.$match.$or[6];
            }
            if (typeof searchOfferId !== 'undefined' && searchOfferId == "") {
                delete filterData.$match.$or[7];
            }
        }


        const filterDatas = filterData.$match.$or.filter(Boolean);


        // console.log(filter_Datas);
        //console.log(JSON.stringify(filterDatas));

        if (advertiserId) {
            var filter_Datas = { '$match': { '$and': filterDatas } };
            try {
                let result = await Offer.aggregate([
                    filter_Datas,
                    {
                        '$lookup': {
                            'foreignField': 'tid',
                            'localField': 'trackier_adv_id',
                            'as': 'Advertiser',
                            'from': 'advertiser'
                        }
                    },
                    { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
                    {
                        $addFields: {
                            'advertiser.organization': '$Advertiser.organization',
                            'advertiser.profile_pic': '$Advertiser.profile_pic'
                        }
                    }, {
                        $project: {
                            'Advertiser': 0
                        }
                    }
                ]).exec();
                var totalOffers = parseInt(result.length);
            } catch (err) {
                console.log(err);
            }
        } else {
            var filter_Datas = { '$match': { '$and': filterDatas } };
            try {
                let result = await Offer.aggregate([
                    filter_Datas,
                    {
                        '$lookup': {
                            'foreignField': 'tid',
                            'localField': 'trackier_adv_id',
                            'as': 'Advertiser',
                            'from': 'advertiser'
                        }
                    },
                    { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
                    {
                        $addFields: {
                            'advertiser.organization': '$Advertiser.organization',
                            'advertiser.profile_pic': '$Advertiser.profile_pic'
                        }
                    }, {
                        $project: {
                            'Advertiser': 0
                        }
                    }
                ]).exec();
                var totalOffers = parseInt(result.length);
            } catch (err) {
                console.log(err);
            }
        }

        // console.log(filter_Datas);
        //console.log(JSON.stringify(filter_Datas));
        Offer.aggregate([
            filter_Datas,
            {
                '$lookup': {
                    'foreignField': 'tid',
                    'localField': 'trackier_adv_id',
                    'as': 'Advertiser',
                    'from': 'advertiser'
                }
            },
            { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    'advertiser.organization': '$Advertiser.organization',
                    'advertiser.profile_pic': '$Advertiser.profile_pic'
                }
            }, {
                $project: {
                    'Advertiser': 0
                }
            }
        ]).sort(sortObject).collation({ locale: "en_US", numericOrdering: true }).skip(skipIndex).limit(limit).exec().then((offers) => {
            res.getOfferData = offers;
            for (var i = 0; i <= offers.length - 1; i++) {
                delete offers[i].publishers;
            }
            next();
            const response = { 'success': true, 'totoalRecords': totalOffers, 'results': offers };
            res.status(200).send(response);
            return;
        }).catch(error => {
            const response = { 'success': false, 'error': error };
            res.status(400).send(response);
            return;
        });
    } else {
        if (advertiserId) {
            var filter_Datas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }] } };
            try {
                let result = await Offer.find({ '$and': [{ 'trackier_camp_id': { $ne: 0 } }, { 'trackier_adv_id': advertiserId }] });
                var totalOffers = parseInt(result.length);
            } catch (err) {
                console.log(err);
            }
        } else {
            var filter_Datas = { '$match': { '$and': [{ 'trackier_camp_id': { $ne: 0 } }] } };
            try {
                let result = await Offer.find({ 'trackier_camp_id': { $ne: 0 } });
                var totalOffers = parseInt(result.length);
            } catch (err) {
                console.log(err);
            }
        }

        Offer.aggregate([
            filter_Datas,
            {
                '$lookup': {
                    'foreignField': 'tid',
                    'localField': 'trackier_adv_id',
                    'as': 'Advertiser',
                    'from': 'advertiser'
                }
            },
            { $unwind: { path: '$Advertiser', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    'advertiser.organization': '$Advertiser.organization',
                    'advertiser.profile_pic': '$Advertiser.profile_pic'
                }
            }, {
                $project: {
                    'Advertiser': 0
                }
            }
        ]).sort(sortObject).collation({ locale: "en_US", numericOrdering: true }).skip(skipIndex).limit(limit).exec().then((offers) => {
            res.getOfferData = offers;
            for (var i = 0; i <= offers.length - 1; i++) {

                delete offers[i].publishers;
            }
            next();
            const response = { 'success': true, 'totoalRecords': totalOffers, 'results': offers };
            res.status(200).send(response);
            return;
        }).catch(error => {
            const response = { 'success': false, 'error': error };
            res.status(400).send(response);
            return;
        });
    }
};


// Get Offers Data
exports.getOfferDataByOfferId = async (req, res) => {
    const id = req.params.id;

    if (isNumeric(id)) {
        await Offer.findOne({ trackier_camp_id: id }).sort({ _id: -1 }).exec().then(async (offer) => {
            if (offer) {
                const c_string = offer.country;
                const result = await Publishers.find({ "pub_status": "Enabled", '$text': { '$search': `${c_string}` + ",ALL" } }).sort({ pub_name: 1 }).exec();
                const totalPublisher = parseInt(result.length);
                const response = { 'success': true, 'totalPublisher': totalPublisher, 'results': offer };
                res.status(200).send(response);
                return;
            } else {
                const response = { 'success': false, 'totalPublisher': 0, 'results': 'No records found!' };
                res.status(200).send(response);
                return;
            }
        }).catch(error => {
            const response = { 'success': false, 'totalPublisher': 0, 'error': error['message'] };
            res.status(400).send(response);
            return;
        });
    } else {
        await Offer.findById(id).sort({ _id: -1 }).exec().then(async (offer) => {
            if (offer) {
                const c_string = offer.country;
                const result = await Publishers.find({ "pub_status": "Enabled", '$text': { '$search': `${c_string}` + ",ALL" } }).sort({ pub_name: 1 }).exec();
                const totalPublisher = parseInt(result.length);
                const response = { 'success': true, 'totalPublisher': totalPublisher, 'results': offer };
                res.status(200).send(response);
                return;
            } else {
                const response = { 'success': false, 'totalPublisher': 0, 'results': 'No records found!' };
                res.status(200).send(response);
                return;
            }
        }).catch(error => {
            const response = { 'success': false, 'totalPublisher': 0, 'error': error['message'] };
            res.status(400).send(response);
            return;
        });
    }
};


// Get Offers Data
exports.getOfferMasterData = (req, res) => {
    Offer.find({ trackier_camp_id: { '$ne': 0 } }).sort({ offer_name: 1 }).exec().then((offer) => {
        if (offer) {
            var offerDataArr = [];
            for (let i = 0; i < offer.length; i++) {
                let off = offer[i];
                offerDataArr.push({
                    "trackier_camp_id": off.trackier_camp_id,
                    "offer_name": off.offer_name
                });
            }
            const response = { 'success': true, 'results': offerDataArr };
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

// Get Offers Data by advertiserId
exports.getOfferMasterDataByAdvId = (req, res) => {
    const id = parseInt(req.params.id);
    console.log(id);
    Offer.find({ '$and': [{ trackier_camp_id: { '$ne': 0 } }, { trackier_adv_id: id }] }).sort({ offer_name: 1 }).exec().then((offer) => {
        if (offer) {
            var offerDataArr = [];
            for (let i = 0; i < offer.length; i++) {
                let off = offer[i];
                offerDataArr.push({
                    "trackier_camp_id": off.trackier_camp_id,
                    "offer_name": off.offer_name
                });
            }
            const response = { 'success': true, 'results': offerDataArr };
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


// Get Offers Data by multiple advertiserId
exports.getOfferMasterDataByMutipleAdvId = (req, res) => {
    const advId = req.body.advId;
    Offer.find({ '$and': [{ trackier_camp_id: { '$ne': 0 } }, { trackier_adv_id: { '$in': advId } }] }).sort({ offer_name: 1 }).exec().then((offer) => {
        if (offer) {
            var offerDataArr = [];
            for (let i = 0; i < offer.length; i++) {
                let off = offer[i];
                offerDataArr.push({
                    "trackier_camp_id": off.trackier_camp_id,
                    "offer_name": off.offer_name
                });
            }
            const response = { 'success': true, 'results': offerDataArr };
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


// update offer status
exports.changeOfferStatus = async (req, res) => {
    // check body key
    const paramSchema = { 1: 'offerId', 2: 'trackier_camp_id', 3: 'offerStatus', 4: 'approved_by', 5: 'approved_by_email' };
    var new_array = [];
    for (var key in paramSchema) {
        if (!req.body.hasOwnProperty(paramSchema[key])) {
            new_array.push(paramSchema[key]);
        }
    }

    if (new_array.length !== 0) {
        let text = new_array.toString();
        const response = { "status": false, "message": `${text} is missing!` };
        res.status(200).send(response);
        return;
    }

    const { offerId, trackier_camp_id, offerStatus, approved_by, approved_by_email } = req.body;

    // Validate request
    if (!offerStatus || !approved_by || !approved_by_email) {
        var requestVal = "";
        if (!offerStatus) {
            var requestVal = "offerStatus";
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

    if (!Array.isArray(offerId)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "offerId should be []!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(offerId) && offerId.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "offerId is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(trackier_camp_id)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "trackier_camp_id should be []!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(trackier_camp_id) && trackier_camp_id.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "trackier_camp_id is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    var integerIDs = [];
    for (let j = 0; j < trackier_camp_id.length; j++) {
        integerIDs.push(trackier_camp_id[j]);
    }

    const allOfferStatus = await Offer.find({ trackier_camp_id: { '$in': integerIDs } }).exec();
    var offerIdStatus = {};
    if (Array.isArray(allOfferStatus) && allOfferStatus.length > 0) {
        for (let k = 0; k < allOfferStatus.length; k++) {
            offerIdStatus[allOfferStatus[k].trackier_camp_id] = ucfirst(allOfferStatus[k].status);
        }
    }

    // create offer on trackier
    const axios_header = {
        headers: {
            'x-api-key': process.env.API_KEY,
            'Content-Type': 'application/json'
        }
    };

    try {
        const campaignStatus = { "campaignIds": integerIDs, "fields": { 'status': offerStatus } };
        // STEP-6.1 Push publisher wise caps on trackier
        axios.post(process.env.API_BASE_URL + "campaigns/bulkEdit", campaignStatus, axios_header).then(async (status) => {
            console.log('Step37 Request');
            if (typeof status.data.success !== 'undefined' && status.data.success == true) {
                try {
                    const resStatus = await Offer.updateMany({ _id: { '$in': offerId } }, { 'status': offerStatus }).exec();
                    if (resStatus) {
                        for (let i = 0; i < offerId.length; i++) {
                            let _id = offerId[i];
                            const resStatus = await Offer.findOne({ _id }).exec();
                            if (resStatus) {
                                const advDetails = await getAdvertiserBasicDetailsByAdvId(resStatus.trackier_adv_id);

                                // INSERT DATA INTO Tileline
                                const timelineData = {
                                    advertiser_id: parseInt(resStatus.trackier_adv_id),
                                    advertiser_name: ucfirst(advDetails.advertiserName),
                                    offer_id: resStatus.trackier_camp_id,
                                    offer_name: ucfirst(resStatus.offer_name),
                                    type: "Campaign Status",
                                    old_value: offerIdStatus[resStatus.trackier_camp_id],
                                    new_value: offerStatus,
                                    edited_by: approved_by
                                }
                                // END INSERT DATA INTO Tileline
                                await addTimelineData(timelineData);

                                if (offerStatus == 'active') {
                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(resStatus.trackier_adv_id),
                                        advertiser_name: ucfirst(advDetails.advertiserName),
                                        company_name: ucfirst(advDetails.advName),
                                        offer_id: resStatus.trackier_camp_id,
                                        offer_name: ucfirst(resStatus.offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Applabs Alert - New Offer ' + ucwords(offerStatus),
                                        message_adv: " Congratulations! Your new offer <span class= 'text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span> is approved and live.",

                                        subject_sa: 'Applabs Alert - Offer ' + resStatus.offer_name + " " + resStatus.trackier_camp_id + " " + ucwords(offerStatus),
                                        message_sa: "Account <span class= 'text_primary'> " + ucfirst(advDetails.advName) + "</span>  offer <span class= 'text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span>  has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>  by <span class='text_primary'> " + ucfirst(approved_by) + "  </span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_approved.handlebars"), "utf-8");
                                } else if (offerStatus == 'pending') {
                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(resStatus.trackier_adv_id),
                                        advertiser_name: ucfirst(advDetails.advertiserName),
                                        company_name: ucfirst(advDetails.advName),
                                        offer_id: resStatus.trackier_camp_id,
                                        offer_name: ucfirst(resStatus.offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Applabs Alert - New Offer ' + ucwords(offerStatus),
                                        message_adv: "This is to inform you that your offer <span class='text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span>  has been created but is pending for approval.",

                                        subject_sa: 'Applabs Alert - Offer ' + resStatus.offer_name + " " + resStatus.trackier_camp_id + " " + ucwords(offerStatus),
                                        message_sa: "Account <span class= 'text_primary'> " + ucfirst(advDetails.advName) + "</span>  offer <span class= 'text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span>  has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>  by <span class='text_primary'> " + ucfirst(approved_by) + "  </span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    emailTemplateAdvertiser = fs.readFileSync(path.join("templates/adv_offer_status_pending.handlebars"), "utf-8");
                                } else if (offerStatus == 'paused' || offerStatus == 'disabled' || offerStatus == 'expired') {

                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(resStatus.trackier_adv_id),
                                        advertiser_name: ucfirst(advDetails.advertiserName),
                                        company_name: ucfirst(advDetails.advName),
                                        offer_id: resStatus.trackier_camp_id,
                                        offer_name: ucfirst(resStatus.offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Applabs Alert - New Offer ' + ucwords(offerStatus),
                                        message_adv: "This is to inform you that your offer <span class='text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span> has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>",

                                        subject_sa: 'Applabs Alert - Offer ' + resStatus.offer_name + " " + resStatus.trackier_camp_id + " " + ucwords(offerStatus),
                                        message_sa: "Account <span class= 'text_primary'> " + ucfirst(advDetails.advName) + "</span>  offer <span class= 'text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span>  has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>  by <span class='text_primary'> " + ucfirst(approved_by) + "  </span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    emailTemplateAdvertiser = fs.readFileSync(path.join("templates/adv_offer_status_paused.handlebars"), "utf-8");
                                } else {
                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(resStatus.trackier_adv_id),
                                        advertiser_name: ucfirst(advDetails.advertiserName),
                                        company_name: ucfirst(advDetails.advName),
                                        offer_id: resStatus.trackier_camp_id,
                                        offer_name: ucfirst(resStatus.offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Applabs Alert - New Offer ' + ucwords(offerStatus),
                                        message_adv: "This is to inform you that your offer <span class='text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span> has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>",

                                        subject_sa: 'Applabs Alert - Offer ' + resStatus.offer_name + " " + resStatus.trackier_camp_id + " " + ucwords(offerStatus),
                                        message_sa: "Account <span class= 'text_primary'> " + ucfirst(advDetails.advName) + "</span>  offer <span class= 'text_primary'>  " + ucfirst(resStatus.offer_name) + "[" + resStatus.trackier_camp_id + "] </span>  has been <span class='text_primary'> " + ucfirst(offerStatus) + "  </span>  by <span class='text_primary'> " + ucfirst(approved_by) + "  </span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/adv_offer_status_paused.handlebars"), "utf-8");
                                }

                                if (advDetails.advEmailPref == true) {
                                    // Send Mail to Admin if status inactive/suspended
                                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                    const messageBodyAdvetiser = (templateAdvertiser({
                                        todayDate: dateprint(),
                                        offer_name: resStatus.offer_name,
                                        advertiserName: ucwords(advDetails.advName),
                                        offer_id: resStatus.trackier_camp_id,
                                        status: offerStatus,
                                        url: process.env.APPLABS_URL + 'view_offer',
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdvertiser = {
                                        to: advDetails.email,
                                        //to: 'sudish@applabs.ai',
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        bcc: bcc_mail,
                                        subject: 'Applabs Alert - New Offer ' + ucwords(offerStatus),
                                        html: messageBodyAdvetiser
                                    };
                                    //ES6
                                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        res.status(200).send(response);
                                        return;
                                    });
                                }

                                // Send Mail to Admin if status approved
                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_status.handlebars"), "utf-8");
                                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                const messageBodyAdmin = (templateAdmin({
                                    todayDate: dateprint(),
                                    offer_name: resStatus.offer_name,
                                    advertiserName: ucwords(advDetails.advName),
                                    offer_id: resStatus.trackier_camp_id,
                                    status_by_user: approved_by,
                                    approved_by_email: approved_by_email,
                                    status: offerStatus,
                                    url: process.env.APPLABS_URL + 'view_offer',
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdmin = {
                                    to: admin_mail,
                                    //to: "sudish@applabs.ai",
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    bcc: bcc_mail,
                                    subject: 'Applabs Alert - Offer ' + resStatus.offer_name + " " + resStatus.trackier_camp_id + " " + ucwords(offerStatus),
                                    html: messageBodyAdmin
                                };
                                //ES6
                                sgMail.send(msgAdmin).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    const response = { 'success': false, 'message': error };
                                    res.status(200).send(response);
                                    return;
                                });

                            } else {
                                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                                res.status(200).send(resMsg);
                                return;
                            }

                        }
                        const response = { 'success': true, 'message': 'Status successfully updated.' };
                        res.status(200).send(response);
                        return;

                    } else {
                        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                        res.status(200).send(resMsg);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    const response = { "status": false, "message": error.message };
                    res.status(400).send(response);
                    return;
                }
            } else {
                const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
            res.status(200).send(resMsg);
            return;
        });
    } catch (error) {
        console.log(error);
        const resMsg = { "success": false, "message": "Something went wrong please try again!!" };
        res.status(200).send(resMsg);
        return;
    }
}

exports.getDashboardOfferStatus = (req, res) => {
    var filterDatas = { '$match': { 'trackier_camp_id': { '$ne': 0 } } };
    Offer.aggregate([
        filterDatas,
        {
            '$group': {
                '_id': '$status',
                'sum': { '$sum': 1 }
            }
        }
    ]).sort({ status: -1 }).exec().then((offStatus) => {
        if (offStatus) {
            //console.log(offStatus);
            const response = { 'success': true, 'results': offStatus };
            res.status(200).send(response);
            return;
        } else {
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
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

exports.getDashboardTopOffers = async (req, res) => {

    var pub_array = {};
    var adv_str = "";
    var adv_array = {};
    var off_total_budget_array = {};
    var off_icon_array = {};
    var pub_icon_array = {};
    var off_geo_array = {};
    var SDK_array = {};
    var DIRECT_array = {};
    var app_array = {};

    // check body key
    const paramSchema = { 1: 'start', 2: 'end', 3: 'camp_ids', 4: 'adv_ids' };
    var new_array = [];
    for (var key in paramSchema) {
        if (!req.body.hasOwnProperty(paramSchema[key])) {
            new_array.push(paramSchema[key]);
        }
    }

    if (new_array.length !== 0) {
        let text = new_array.toString();
        const response = { "status": false, "message": `${text} is missing!` };
        res.status(200).send(response);
        return;
    }
    const { source, camp_ids, adv_ids, start, end } = req.body;

    // Validate request
    if (!start || !end) {
        var requestVal = "";
        if (!start) {
            var requestVal = "start date";
        } else if (!end) {
            var requestVal = "end date";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    // create offer on trackier
    const axios_header = {
        headers: {
            'x-api-key': process.env.API_KEY,
            'Content-Type': 'application/json'
        }
    };

    delete req.body.source;
    const advertiserId = parseInt(req.query.advertiserId);
    let newQueryString = querystring.stringify(req.body);
    let checqueryString = newQueryString.replace("&", " ");
    var endpoint = "reports/custom"

    var cmpsIds = camp_ids;
    delete req.body.camp_ids;
    var newQueryStrings = querystring.stringify(req.body);
    var newQueryAppStrings = querystring.stringify(req.body);


    var adv_str = "";
    if (advertiserId) {
        adv_str += "adv_ids[]=" + advertiserId + "&";
        if (Array.isArray(camp_ids) && camp_ids.length > 0) {
            newQueryString = newQueryString.replaceAll("camp_ids", "camp_ids[]");
        }
    } else {
        if (Array.isArray(camp_ids) && camp_ids.length > 0) {
            newQueryString = newQueryString.replaceAll("camp_ids", "camp_ids[]");
            if (Array.isArray(adv_ids) && adv_ids.length > 0) {
                newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
            }
        } else {
            if (Array.isArray(adv_ids) && adv_ids.length > 0) {
                newQueryString = newQueryString.replaceAll("adv_ids", "adv_ids[]");
            } else {
                await Advertiser.find().sort({ _id: 1 }).exec().then((advertisers) => {
                    if (advertisers) {
                        for (let i = 0; i < advertisers.length; i++) {
                            let adv = advertisers[i];
                            if (adv.tid > 0) {
                                adv_str += ("adv_ids[]=" + adv.tid + "&");
                            }
                        }
                    }
                }).catch(error => {
                    console.error(error);
                });
            }
        }
    }


    // for SDK APPLIST 
    var sdk_str = "";
    if (advertiserId) {
        try {
            const all_SDK = await Offer.find({ '$and': [{ 'trackier_adv_id': advertiserId }, { 'source_type': "SDK" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
            if (all_SDK) {
                for (let p = 0; p < all_SDK.length; p++) {
                    let SDK = all_SDK[p];
                    SDK_array[SDK.trackier_camp_id] = SDK.trackier_camp_id;
                    if (cmpsIds.includes(SDK.trackier_camp_id)) {
                        sdk_str += ("camp_ids[]=" + SDK.trackier_camp_id + "&");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
        newQueryAppStrings += "&" + sdk_str;
    } else {
        try {
            const all_SDK = await Offer.find({ '$and': [{ 'source_type': "SDK" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
            if (all_SDK) {
                for (let p = 0; p < all_SDK.length; p++) {
                    let SDK = all_SDK[p];
                    SDK_array[SDK.trackier_camp_id] = SDK.trackier_camp_id;
                    if (cmpsIds.includes(SDK.trackier_camp_id)) {
                        sdk_str += ("camp_ids[]=" + SDK.trackier_camp_id + "&");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
        newQueryAppStrings += "&" + sdk_str;
    }

    // FOR DIRECT OFFER TOP SOURCE 
    var direct_str = "";
    if (advertiserId) {
        try {
            const all_DIRECT = await Offer.find({ '$and': [{ 'trackier_adv_id': advertiserId }, { 'source_type': "DIRECT" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
            if (all_DIRECT) {
                for (let p = 0; p < all_DIRECT.length; p++) {
                    let DIRECT = all_DIRECT[p];
                    DIRECT_array[DIRECT.trackier_camp_id] = DIRECT.trackier_camp_id;
                    if (cmpsIds.includes(DIRECT.trackier_camp_id)) {
                        direct_str += ("camp_ids[]=" + DIRECT.trackier_camp_id + "&");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
        newQueryStrings += "&" + direct_str;
    } else {
        try {
            const all_DIRECT = await Offer.find({ '$and': [{ 'source_type': "DIRECT" }, { 'trackier_camp_id': { '$ne': 0 } }] }).sort({ created_on: -1 }).exec();
            if (all_DIRECT) {
                for (let p = 0; p < all_DIRECT.length; p++) {
                    let DIRECT = all_DIRECT[p];
                    DIRECT_array[DIRECT.trackier_camp_id] = DIRECT.trackier_camp_id;
                    if (cmpsIds.includes(DIRECT.trackier_camp_id)) {
                        direct_str += ("camp_ids[]=" + DIRECT.trackier_camp_id + "&");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
        newQueryStrings += "&" + direct_str;
    }
    // END FOR DIRECT OFFER TOP SOURCE

    // get offer data
    await Offer.find({}).sort({ _id: 1 }).exec().then((offDt) => {
        if (offDt) {
            for (let k = 0; k < offDt.length; k++) {
                let off_icon = offDt[k];
                off_icon_array[off_icon.trackier_camp_id] = off_icon.icon;
                let off_geo = offDt[k];
                off_geo_array[off_geo.trackier_camp_id] = ucfirst(off_geo.country);
                off_total_budget_array[off_icon.trackier_camp_id] = off_icon.total_budget;
            }
        }
    }).catch(error => {
        console.error(error);
    });


    // get all advertisers
    await Advertiser.find({}).sort({ _id: 1 }).exec().then((all_adv) => {
        if (all_adv) {
            for (let k = 0; k < all_adv.length; k++) {
                let adv = all_adv[k];
                adv_array[adv.tid] = ucfirst(adv.organization);
            }
        }
    }).catch(error => {
        console.error(error);
    });

    // get all publishers
    await Publishers.find({}).sort({ _id: 1 }).exec().then((all_pub) => {
        if (all_pub) {
            for (let k = 0; k < all_pub.length; k++) {
                let pub = all_pub[k];
                pub_icon_array[pub.pub_id] = pub.icon;
                pub_array[pub.pub_id] = ucfirst(pub.pub_name);
            }
        }
    }).catch(error => {
        console.error(error);
    });


    // get all app name
    await Applist.find({}).sort({ _id: 1 }).exec().then((all_Applist) => {
        if (all_Applist) {
            for (let m = 0; m < all_Applist.length; m++) {
                let app = all_Applist[m];
                app_array[app.AppBundle] = app.App_Name + "||" + app.Category + "||" + app.CTR;
            }
        }
    }).catch(error => {
        console.error(error);
    })


    if (source == 'publishers') {
        console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryStrings + "zone=Asia/Kolkata");

        axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=publisher_id&" + newQueryStrings + "zone=Asia/Kolkata", axios_header).then(async (staticsPubRes) => {


            if (typeof staticsPubRes.statusText !== 'undefined' && staticsPubRes.statusText == "OK") {

                var reportData = [];
                if (Array.isArray(staticsPubRes.data.records) && staticsPubRes.data.records.length > 0) {
                    const advArrData = staticsPubRes.data.records;
                    for (let j = 0; j < advArrData.length; j++) {
                        let advTrkData = advArrData[j];


                        let offer_name = advTrkData.campaign_name.replace("AL-", "");

                        //console.log(adv_array[advTrkData.advertiser_id]);
                        // console.log(adv_array);

                        if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                            var advertiser_name = adv_array[advTrkData.advertiser_id];
                        } else {
                            var advertiser_name = advTrkData.advertiser;
                        }


                        if ((checqueryString.indexOf("app_id") !== -1)) {
                            var app_id = advTrkData.app_name;
                        } else {
                            var app_id = "";
                        }


                        if ((checqueryString.indexOf("placement") !== -1)) {
                            var source = advTrkData.source;
                        } else {
                            var source = "";
                        }

                        if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                            var publisher_name = pub_array[advTrkData.publisher_id];
                        } else {
                            var publisher_name = "";
                        }


                        var app_name = "";
                        if ((checqueryString.indexOf("app_name") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                app_name = appNameSplit[0];
                            } else {
                                app_name = advTrkData.app_name;
                            }
                        }


                        var audienc_interest = "";
                        if ((checqueryString.indexOf("audienc_int") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                var audienc_interest = appNameSplit[1];
                            } else {
                                var audienc_interest = "";
                            }
                        }

                        var impression = '';
                        if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
                            impression = 0;
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
                                impression = Math.round(clickImpC);
                            } else {
                                impression = 0;
                            }
                        }

                        if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
                            impression = 0;
                            if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
                                let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
                                impression = Math.round(cretiveImpC);
                            } else {
                                impression = 0;
                            }
                        }


                        reportData.push({
                            "campaign_name": offer_name,
                            "campaign_id": advTrkData.campaign_id,
                            "campaign_status": advTrkData.campaign_status,
                            "campaign_type": "",
                            "campaign_geo": "",
                            "camp_icon": "",
                            "campaign_os": "Android",
                            "advertiser": advertiser_name,
                            "advertiser_id": advTrkData.advertiser_id,
                            "goal_name": advTrkData.goal_name,
                            app_id,
                            source,
                            "publisher_id": advTrkData.publisher_id,
                            publisher_name,
                            app_name,
                            "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
                            impression,
                            audienc_interest,
                            "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
                            "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
                            "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
                            "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
                            "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
                            "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
                            "currency": advTrkData.currency,
                            "campaign_payout": advTrkData.campaign_payout,
                            "grossClicks": advTrkData.grossClicks,
                            "grossConversions": advTrkData.grossConversions,
                            "grossRevenue": advTrkData.grossRevenue,
                            "grossPayableConversions": 0,
                            "grossInstall": 0,
                            "total_budget": 0
                        });
                    }
                }

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
                    //uniqGoalNames = array_unique($uniqGoalNames);
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
                            newData[superKey]['audienc_int'] = r.app_name;
                        }
                    }
                    if (r.grossRevenue > 0) {
                        newData[superKey]['grossPayableConversions'] += r.grossConversions;
                    }
                    if (r.goal_name == 'install') {
                        newData[superKey]['grossInstall'] += r.grossConversions;
                    } else {
                        newData[superKey]['grossInstall'] += 0;
                    }

                    if (SDK_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_type'] = "SDK";
                    } else {
                        newData[superKey]['campaign_type'] = "DIRECT";
                    }

                    if (off_geo_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
                    } else {
                        newData[superKey]['campaign_geo'] = "";
                    }

                    if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
                    } else {
                        newData[superKey]['total_budget'] = "";
                    }


                    if (off_icon_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
                    } else {
                        newData[superKey]['camp_icon'] = "";
                    }
                }

                const data_obj_to_pub_arr = Object.values(newData);
                const newArrDataByPubClick = data_obj_to_pub_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();

                if (direct_str !== "") {
                    var objFilterDataTopsource = newArrDataByPubClick;
                } else {
                    var objFilterDataTopsource = [];
                }


                console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryAppStrings + "zone=Asia/Kolkata");

                axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=app_name&" + newQueryAppStrings + "zone=Asia/Kolkata", axios_header).then(async (staticsAppRes) => {
                    if (typeof staticsAppRes.statusText !== 'undefined' && staticsAppRes.statusText == "OK") {

                        var reportAppData = [];
                        if (Array.isArray(staticsAppRes.data.records) && staticsAppRes.data.records.length > 0) {
                            const advArrData = staticsAppRes.data.records;
                            for (let j = 0; j < advArrData.length; j++) {
                                let advTrkData = advArrData[j];


                                let offer_name = advTrkData.campaign_name.replace("AL-", "");

                                //console.log(adv_array[advTrkData.advertiser_id]);
                                // console.log(adv_array);

                                if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                                    var advertiser_name = adv_array[advTrkData.advertiser_id];
                                } else {
                                    var advertiser_name = advTrkData.advertiser;
                                }


                                if ((checqueryString.indexOf("app_id") !== -1)) {
                                    var app_id = advTrkData.app_name;
                                } else {
                                    var app_id = "";
                                }


                                if ((checqueryString.indexOf("placement") !== -1)) {
                                    var source = advTrkData.source;
                                } else {
                                    var source = "";
                                }

                                if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                                    var publisher_name = pub_array[advTrkData.publisher_id];
                                } else {
                                    var publisher_name = "";
                                }


                                var app_name = "";
                                if ((checqueryString.indexOf("app_name") !== -1)) {
                                    if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                        let appNameSplit = app_array[advTrkData.app_name].split("||");
                                        app_name = appNameSplit[0];
                                    } else {
                                        app_name = advTrkData.app_name;
                                    }
                                }


                                var audienc_interest = "";
                                if ((checqueryString.indexOf("audienc_int") !== -1)) {
                                    if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                        let appNameSplit = app_array[advTrkData.app_name].split("||");
                                        var audienc_interest = appNameSplit[1];
                                    } else {
                                        var audienc_interest = "";
                                    }
                                }

                                var impression = '';
                                if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
                                    impression = 0;
                                    if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                        let appNameSplit = app_array[advTrkData.app_name].split("||");
                                        let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
                                        impression = Math.round(clickImpC);
                                    } else {
                                        impression = 0;
                                    }
                                }

                                if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
                                    impression = 0;
                                    if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
                                        let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
                                        impression = Math.round(cretiveImpC);
                                    } else {
                                        impression = 0;
                                    }
                                }

                                reportAppData.push({
                                    "campaign_name": offer_name,
                                    "campaign_id": advTrkData.campaign_id,
                                    "campaign_status": advTrkData.campaign_status,
                                    "campaign_type": "",
                                    "campaign_geo": "",
                                    "camp_icon": "",
                                    "campaign_os": "Android",
                                    "advertiser": advertiser_name,
                                    "advertiser_id": advTrkData.advertiser_id,
                                    "goal_name": advTrkData.goal_name,
                                    app_id,
                                    source,
                                    "publisher_id": advTrkData.publisher_id,
                                    publisher_name,
                                    app_name,
                                    "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
                                    impression,
                                    audienc_interest,
                                    "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
                                    "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
                                    "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
                                    "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
                                    "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
                                    "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
                                    "currency": advTrkData.currency,
                                    "campaign_payout": advTrkData.campaign_payout,
                                    "grossClicks": advTrkData.grossClicks,
                                    "grossConversions": advTrkData.grossConversions,
                                    "grossRevenue": advTrkData.grossRevenue,
                                    "grossPayableConversions": 0,
                                    "grossInstall": 0,
                                    "total_budget": 0
                                });
                            }
                        }

                        var newAppData = {};
                        var uniqGoalNames = [];
                        var n_uniqGoalNames = [];
                        if ((checqueryString.indexOf("goal_name") !== -1)) {
                            for (let i = 0; i < reportAppData.length; i++) {
                                var r = reportAppData[i];
                                if ((uniqGoalNames.indexOf(r.goal_name) == -1)) {
                                    uniqGoalNames.push(r.goal_name);
                                }
                            }
                        }

                        if ((checqueryString.indexOf("goal_name") !== -1)) {
                            uniqGoalNames.unshift('install');
                            //uniqGoalNames = array_unique($uniqGoalNames);
                            for (var i = 0; i < uniqGoalNames.length; i++) {
                                if (n_uniqGoalNames.indexOf(uniqGoalNames[i]) == -1) n_uniqGoalNames.push(uniqGoalNames[i]);
                            }
                        }


                        for (let i = 0; i < reportAppData.length; i++) {
                            let r = reportAppData[i];

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

                            if (newAppData[superKey]) {
                                newAppData[superKey]['grossClicks'] += r.grossClicks;
                                newAppData[superKey]['grossConversions'] += r.grossConversions;
                                newAppData[superKey]['grossRevenue'] += r.grossRevenue;

                                for (let s = 0; s < n_uniqGoalNames.length; s++) {
                                    let gname = n_uniqGoalNames[s];
                                    if (r.goal_name === gname) {
                                        if (r.grossConversions > 0) {
                                            newAppData[superKey][gname] += r.grossConversions;
                                        } else {
                                            newAppData[superKey][gname] += 0;
                                        }
                                    }
                                }
                            } else {
                                newAppData[superKey] = r;
                                if (checqueryString.indexOf("audienc_int") !== -1) {
                                    newAppData[superKey]['audienc_int'] = r.app_name;
                                }
                            }
                            if (r.grossRevenue > 0) {
                                newAppData[superKey]['grossPayableConversions'] += r.grossConversions;
                            }
                            if (r.goal_name == 'install') {
                                newAppData[superKey]['grossInstall'] += r.grossConversions;
                            } else {
                                newAppData[superKey]['grossInstall'] += 0;
                            }

                            if (SDK_array.hasOwnProperty(r.campaign_id)) {
                                newAppData[superKey]['campaign_type'] = "SDK";
                            } else {
                                newAppData[superKey]['campaign_type'] = "DIRECT";
                            }

                            if (off_geo_array.hasOwnProperty(r.campaign_id)) {
                                newAppData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
                            } else {
                                newAppData[superKey]['campaign_geo'] = "";
                            }

                            if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
                                newAppData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
                            } else {
                                newAppData[superKey]['total_budget'] = "";
                            }
                            if (off_icon_array.hasOwnProperty(r.campaign_id)) {
                                newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
                            } else {
                                newData[superKey]['camp_icon'] = "";
                            }
                        }

                        const data_obj_to_app_arr = Object.values(newAppData);
                        const newArrDataByAppClick = data_obj_to_app_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice();

                        if (sdk_str !== "") {
                            var objFilterDataAppsource = newArrDataByAppClick;
                        } else {
                            var objFilterDataAppsource = [];
                        }

                        const response = { 'success': true, 'topOffers': objFilterDataTopsource, 'topsourceapp': objFilterDataAppsource };
                        res.status(200).send(response);
                        return;

                    } else {
                        const resMsg = { "success": false, "message": "No records found" };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch(err => {
                    console.log(err);
                    const errMsg = { "success": false, "errors": err.response.data.errors };
                    res.status(400).send(errMsg);
                    return;
                });

            } else {
                const resMsg = { "success": false, "message": "No records found" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });
        // END GET DATA BY GEO
        // END GET DATA BY Publisher
    } else if (source == 'geo') {
        // START GET DATA BY GEO
        console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

        axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=country&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsResByGeo) => {
            if (typeof staticsResByGeo.statusText !== 'undefined' && staticsResByGeo.statusText == "OK") {

                var reportData = [];
                if (Array.isArray(staticsResByGeo.data.records) && staticsResByGeo.data.records.length > 0) {
                    const advArrData = staticsResByGeo.data.records;
                    for (let j = 0; j < advArrData.length; j++) {
                        let advTrkData = advArrData[j];


                        let offer_name = advTrkData.campaign_name.replace("AL-", "");

                        //console.log(adv_array[advTrkData.advertiser_id]);
                        // console.log(adv_array);

                        if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                            var advertiser_name = adv_array[advTrkData.advertiser_id];
                        } else {
                            var advertiser_name = advTrkData.advertiser;
                        }


                        if ((checqueryString.indexOf("app_id") !== -1)) {
                            var app_id = advTrkData.app_name;
                        } else {
                            var app_id = "";
                        }


                        if ((checqueryString.indexOf("placement") !== -1)) {
                            var source = advTrkData.source;
                        } else {
                            var source = "";
                        }

                        if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                            var publisher_name = pub_array[advTrkData.publisher_id];
                        } else {
                            var publisher_name = "";
                        }


                        var app_name = "";
                        if ((checqueryString.indexOf("app_name") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                app_name = appNameSplit[0];
                            } else {
                                app_name = advTrkData.app_name;
                            }
                        }


                        var audienc_interest = "";
                        if ((checqueryString.indexOf("audienc_int") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                var audienc_interest = appNameSplit[1];
                            } else {
                                var audienc_interest = "";
                            }
                        }

                        var impression = '';
                        if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
                            impression = 0;
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
                                impression = Math.round(clickImpC);
                            } else {
                                impression = 0;
                            }
                        }

                        if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
                            impression = 0;
                            if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
                                let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
                                impression = Math.round(cretiveImpC);
                            } else {
                                impression = 0;
                            }
                        }


                        reportData.push({
                            "campaign_name": offer_name,
                            "campaign_id": advTrkData.campaign_id,
                            "campaign_status": advTrkData.campaign_status,
                            "campaign_type": "",
                            "campaign_geo": "",
                            "camp_icon": "",
                            "campaign_os": "Android",
                            "advertiser": advertiser_name,
                            "advertiser_id": advTrkData.advertiser_id,
                            "goal_name": advTrkData.goal_name,
                            app_id,
                            source,
                            "publisher_id": advTrkData.publisher_id,
                            publisher_name,
                            app_name,
                            "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
                            impression,
                            audienc_interest,
                            "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
                            "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
                            "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
                            "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
                            "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
                            "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
                            "currency": advTrkData.currency,
                            "campaign_payout": advTrkData.campaign_payout,
                            "grossClicks": advTrkData.grossClicks,
                            "grossConversions": advTrkData.grossConversions,
                            "grossRevenue": advTrkData.grossRevenue,
                            "grossPayableConversions": 0,
                            "grossInstall": 0,
                            "total_budget": 0
                        });
                    }
                }

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
                    //uniqGoalNames = array_unique($uniqGoalNames);
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
                            newData[superKey]['audienc_int'] = r.app_name;
                        }
                    }
                    if (r.grossRevenue > 0) {
                        newData[superKey]['grossPayableConversions'] += r.grossConversions;
                    }
                    if (r.goal_name == 'install') {
                        newData[superKey]['grossInstall'] += r.grossConversions;
                    } else {
                        newData[superKey]['grossInstall'] += 0;
                    }

                    if (SDK_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_type'] = "SDK";
                    } else {
                        newData[superKey]['campaign_type'] = "DIRECT";
                    }

                    if (off_geo_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
                    } else {
                        newData[superKey]['campaign_geo'] = "";
                    }

                    if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
                    } else {
                        newData[superKey]['total_budget'] = "";
                    }
                    if (off_icon_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
                    } else {
                        newData[superKey]['camp_icon'] = "";
                    }
                }
                const data_obj_to_arr_geo = Object.values(newData);
                const newArrDataByClickGeo = data_obj_to_arr_geo.sort((a, b) => b.grossClicks - a.grossClicks).slice();
                const objFilterDataTopGeo = newArrDataByClickGeo

                const response = { 'success': true, 'topOffers': objFilterDataTopGeo, 'topsourceapp': [] };
                res.status(200).send(response);
                return;

            } else {
                const resMsg = { "success": false, "message": "No records found" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });
        // END GET DATA BY GEO)
    } else if (source == 'cr_name') {
        // START GET DATA BY GEO
        console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=campaign_status&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=cr_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

        axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=advertiser&group[]=campaign_status&group[]=advertiser_id&group[]=goal_name&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&group[]=cr_name&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsResByGeo) => {
            if (typeof staticsResByGeo.statusText !== 'undefined' && staticsResByGeo.statusText == "OK") {

                var reportData = [];
                if (Array.isArray(staticsResByGeo.data.records) && staticsResByGeo.data.records.length > 0) {
                    const advArrData = staticsResByGeo.data.records;
                    for (let j = 0; j < advArrData.length; j++) {
                        let advTrkData = advArrData[j];


                        let offer_name = advTrkData.campaign_name.replace("AL-", "");

                        //console.log(adv_array[advTrkData.advertiser_id]);
                        // console.log(adv_array);

                        if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                            var advertiser_name = adv_array[advTrkData.advertiser_id];
                        } else {
                            var advertiser_name = advTrkData.advertiser;
                        }


                        if ((checqueryString.indexOf("app_id") !== -1)) {
                            var app_id = advTrkData.app_name;
                        } else {
                            var app_id = "";
                        }


                        if ((checqueryString.indexOf("placement") !== -1)) {
                            var source = advTrkData.source;
                        } else {
                            var source = "";
                        }

                        if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                            var publisher_name = pub_array[advTrkData.publisher_id];
                        } else {
                            var publisher_name = "";
                        }


                        var app_name = "";
                        if ((checqueryString.indexOf("app_name") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                app_name = appNameSplit[0];
                            } else {
                                app_name = advTrkData.app_name;
                            }
                        }


                        var audienc_interest = "";
                        if ((checqueryString.indexOf("audienc_int") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                var audienc_interest = appNameSplit[1];
                            } else {
                                var audienc_interest = "";
                            }
                        }

                        var impression = '';
                        if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
                            impression = 0;
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
                                impression = Math.round(clickImpC);
                            } else {
                                impression = 0;
                            }
                        }

                        if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
                            impression = 0;
                            if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
                                let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
                                impression = Math.round(cretiveImpC);
                            } else {
                                impression = 0;
                            }
                        }

                        reportData.push({
                            "campaign_name": offer_name,
                            "campaign_id": advTrkData.campaign_id,
                            "campaign_status": advTrkData.campaign_status,
                            "campaign_type": "",
                            "campaign_geo": "",
                            "camp_icon": "",
                            "campaign_os": "Android",
                            "advertiser": advertiser_name,
                            "advertiser_id": advTrkData.advertiser_id,
                            "goal_name": advTrkData.goal_name,
                            app_id,
                            source,
                            "publisher_id": advTrkData.publisher_id,
                            publisher_name,
                            app_name,
                            "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
                            impression,
                            audienc_interest,
                            "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
                            "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
                            "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
                            "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
                            "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
                            "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
                            "currency": advTrkData.currency,
                            "campaign_payout": advTrkData.campaign_payout,
                            "grossClicks": advTrkData.grossClicks,
                            "grossConversions": advTrkData.grossConversions,
                            "grossRevenue": advTrkData.grossRevenue,
                            "grossPayableConversions": 0,
                            "grossInstall": 0,
                            "total_budget": 0
                        });
                    }
                }

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
                    //uniqGoalNames = array_unique($uniqGoalNames);
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
                            newData[superKey]['audienc_int'] = r.app_name;
                        }
                    }
                    if (r.grossRevenue > 0) {
                        newData[superKey]['grossPayableConversions'] += r.grossConversions;
                    }
                    if (r.goal_name == 'install') {
                        newData[superKey]['grossInstall'] += r.grossConversions;
                    } else {
                        newData[superKey]['grossInstall'] += 0;
                    }

                    if (SDK_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_type'] = "SDK";
                    } else {
                        newData[superKey]['campaign_type'] = "DIRECT";
                    }

                    if (off_geo_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
                    } else {
                        newData[superKey]['campaign_geo'] = "";
                    }

                    if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
                    } else {
                        newData[superKey]['total_budget'] = "";
                    }
                    if (off_icon_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
                    } else {
                        newData[superKey]['camp_icon'] = "";
                    }
                }
                const data_obj_to_arr_geo = Object.values(newData);
                const newArrDataByClickGeo = data_obj_to_arr_geo.sort((a, b) => b.grossClicks - a.grossClicks).slice();
                const objFilterDataTopGeo = newArrDataByClickGeo

                const response = { 'success': true, 'topOffers': objFilterDataTopGeo, 'topsourceapp': [] };
                res.status(200).send(response);
                return;

            } else {
                const resMsg = { "success": false, "message": "No records found" };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });
        // END GET DATA BY GEO)
    } else {
        console.log(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=campaign_status&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata");

        await axios.get(process.env.API_BASE_URL + endpoint + "?group[]=campaign_name&group[]=campaign_id&group[]=campaign_status&group[]=advertiser&group[]=advertiser_id&group[]=goal_name&kpi[]=campaign_payout&kpi[]=grossClicks&kpi[]=grossConversions&kpi[]=grossRevenue&" + newQueryString + "&" + adv_str + "zone=Asia/Kolkata", axios_header).then((staticsRes) => {
            if (typeof staticsRes.statusText !== 'undefined' && staticsRes.statusText == "OK") {

                var reportData = [];
                if (Array.isArray(staticsRes.data.records) && staticsRes.data.records.length > 0) {
                    const advArrData = staticsRes.data.records;
                    for (let j = 0; j < advArrData.length; j++) {
                        let advTrkData = advArrData[j];


                        let offer_name = advTrkData.campaign_name.replace("AL-", "");

                        //console.log(adv_array[advTrkData.advertiser_id]);
                        // console.log(adv_array);

                        if (adv_array.hasOwnProperty(advTrkData.advertiser_id)) {
                            var advertiser_name = adv_array[advTrkData.advertiser_id];
                        } else {
                            var advertiser_name = advTrkData.advertiser;
                        }


                        if ((checqueryString.indexOf("app_id") !== -1)) {
                            var app_id = advTrkData.app_name;
                        } else {
                            var app_id = "";
                        }


                        if ((checqueryString.indexOf("placement") !== -1)) {
                            var source = advTrkData.source;
                        } else {
                            var source = "";
                        }

                        if (pub_array.hasOwnProperty(advTrkData.publisher_id)) {
                            var publisher_name = pub_array[advTrkData.publisher_id];
                        } else {
                            var publisher_name = "";
                        }


                        var app_name = "";
                        if ((checqueryString.indexOf("app_name") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                app_name = appNameSplit[0];
                            } else {
                                app_name = advTrkData.app_name;
                            }
                        }


                        var audienc_interest = "";
                        if ((checqueryString.indexOf("audienc_int") !== -1)) {
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                var audienc_interest = appNameSplit[1];
                            } else {
                                var audienc_interest = "";
                            }
                        }

                        var impression = '';
                        if (((checqueryString.indexOf("app_id") !== -1) || (checqueryString.indexOf("app_name") !== -1)) && (checqueryString.indexOf("cr_name") == -1)) {
                            impression = 0;
                            if (app_array.hasOwnProperty(advTrkData.app_name)) {
                                let appNameSplit = app_array[advTrkData.app_name].split("||");
                                let clickImpC = (advTrkData.grossClicks / parseFloat(appNameSplit[2])) * 100;
                                impression = Math.round(clickImpC);
                            } else {
                                impression = 0;
                            }
                        }

                        if ((checqueryString.indexOf("app_id") == -1) && (checqueryString.indexOf("app_name") == -1) && (checqueryString.indexOf("cr_name") !== -1)) {
                            impression = 0;
                            if (CTR_array.hasOwnProperty(advTrkData.cr_name)) {
                                let cretiveImpC = (advTrkData.grossClicks / parseFloat(CTR_array[advTrkData.cr_name])) * 100;
                                impression = Math.round(cretiveImpC);
                            } else {
                                impression = 0;
                            }
                        }



                        reportData.push({
                            "campaign_name": offer_name,
                            "campaign_id": advTrkData.campaign_id,
                            "campaign_status": advTrkData.campaign_status,
                            "campaign_type": "",
                            "campaign_geo": "",
                            "camp_icon": "",
                            "campaign_os": "Android",
                            "advertiser": advertiser_name,
                            "advertiser_id": advTrkData.advertiser_id,
                            "goal_name": advTrkData.goal_name,
                            app_id,
                            source,
                            "publisher_id": advTrkData.publisher_id,
                            publisher_name,
                            app_name,
                            "cr_name": (typeof advTrkData.cr_name !== 'undefined') ? advTrkData.cr_name : '',
                            impression,
                            audienc_interest,
                            "country": (typeof advTrkData.country !== 'undefined') ? advTrkData.country : '',
                            "region": (typeof advTrkData.region !== 'undefined') ? advTrkData.region : '',
                            "city": (typeof advTrkData.city !== 'undefined') ? advTrkData.city : '',
                            "month": (typeof advTrkData.month !== 'undefined') ? advTrkData.month : '',
                            "created": (typeof advTrkData.created !== 'undefined') ? advTrkData.created : '',
                            "hour": (typeof advTrkData.hour !== 'undefined') ? advTrkData.hour : '',
                            "currency": advTrkData.currency,
                            "campaign_payout": advTrkData.campaign_payout,
                            "grossClicks": advTrkData.grossClicks,
                            "grossConversions": advTrkData.grossConversions,
                            "grossRevenue": advTrkData.grossRevenue,
                            "grossPayableConversions": 0,
                            "custInstall": 0,
                            "total_budget": 0
                        });
                    }
                }

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
                    //uniqGoalNames = array_unique($uniqGoalNames);
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
                            newData[superKey]['audienc_int'] = r.app_name;
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

                    if (SDK_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_type'] = "SDK";
                    } else {
                        newData[superKey]['campaign_type'] = "DIRECT";
                    }

                    if (off_geo_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['campaign_geo'] = off_geo_array[r.campaign_id];
                    } else {
                        newData[superKey]['campaign_geo'] = "";
                    }

                    if (off_total_budget_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['total_budget'] = off_total_budget_array[r.campaign_id];
                    } else {
                        newData[superKey]['total_budget'] = "";
                    }

                    if (off_icon_array.hasOwnProperty(r.campaign_id)) {
                        newData[superKey]['camp_icon'] = off_icon_array[r.campaign_id];
                    } else {
                        newData[superKey]['camp_icon'] = "";
                    }
                }
                const data_obj_to_arr = Object.values(newData);
                const newArrDataByClick = data_obj_to_arr.sort((a, b) => b.grossClicks - a.grossClicks).slice(0, 10);

                const response = { 'success': true, 'topOffers': newArrDataByClick, 'topsourceapp': [] };
                res.status(200).send(response);
                return;
            } else {
                const resMsg = { "success": false, "message": "No records found" };
                res.status(200).send(resMsg);
                return;
            }

        }).catch(err => {
            console.log(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });
    }

}



function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}


function findDeselectedItem(CurrentArray, PreviousArray) {
    var CurrentArrSize = CurrentArray.length;
    var PreviousArrSize = PreviousArray.length;
    // loop through previous array
    var allDifVal = [];
    for (var j = 0; j < PreviousArrSize; j++) {
        // look for same thing in new array
        if (CurrentArray.indexOf(PreviousArray[j]) == -1)
            allDifVal.push(PreviousArray[j]);
    }
    return allDifVal;
}


function inArray(needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (typeof haystack[i] == 'object') {
            if (arrayCompare(haystack[i], needle)) return true;
        } else {
            if (haystack[i] == needle) return true;
        }
    }
    return false;
}



exports.updateOffer = async (req, res) => {


    const { user_type, user_name, user_email, trackier_adv_id, trackier_camp_id, offer_name, source_type, pubs, campaign_schedule, include_state_city, premium_apps, audience_id, MMP, icon, operating_system, kpi, cta_link, af_redirect_link, cta_redirect_link, vta_link, goal_budget_type, payable_event_name, payable_event_price, goal_budget, total_budget, daily_budget, country, state, state_inc_and_exc, city, city_details, city_inc_and_exc, language, interest, age_group, creatives, schedule_start_date, schedule_end_date, bundle_id, publisher_status } = req.body;

    // Validate request
    if (!user_type || !user_name || !user_email || !trackier_adv_id || !trackier_camp_id || !offer_name || !pubs || !icon || !operating_system || !cta_link || !payable_event_name || !total_budget || !daily_budget || !country || !language || !interest || !age_group || !schedule_start_date || !bundle_id) {
        var requestVal = "";
        if (!user_type) {
            var requestVal = "user_type";
        } else if (!user_name) {
            var requestVal = "user_name";
        } else if (!user_email) {
            var requestVal = "user_email";
        } else if (!trackier_adv_id) {
            var requestVal = "trackier_adv_id";
        } else if (!trackier_camp_id) {
            var requestVal = "trackier_camp_id";
        } else if (!offer_name) {
            var requestVal = "offer_name";
        } else if (!pubs) {
            var requestVal = "pubs";
        } else if (!icon) {
            var requestVal = "icon";
        } else if (!operating_system) {
            var requestVal = "operating_system";
        } else if (!cta_link) {
            var requestVal = "cta_link";
        } else if (!payable_event_name) {
            var requestVal = "payable_event_name";
        } else if (!total_budget) {
            var requestVal = "total_budget";
        } else if (!daily_budget) {
            var requestVal = "daily_budget";
        } else if (!schedule_start_date) {
            var requestVal = "schedule_start_date";
        } else if (!country) {
            var requestVal = "country";
        } else if (!language || language == []) {
            var requestVal = "language";
        } else if (!interest) {
            var requestVal = "interest";
        } else if (!age_group) {
            var requestVal = "age_group";
        }
        // console.log(requestVal);
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": requestVal + " is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (typeof daily_budget !== 'undefined' && daily_budget > total_budget) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Daily Budget must be less or equal to Total Budget" } };
        res.status(400).send(reMsg);
        return;
    }
    if (user_type == 'sa') {
        if (!trackier_adv_id) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "advertiser is not allowed to be empty" } };
            res.status(400).send(reMsg);
            return;
        }
    }
    if (user_type != 'sa') {
        if (!payable_event_price) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable event is not allowed to be empty" } };
            res.status(400).send(reMsg);
            return;
        }
        if (country.length > 1) {
            let priceValArr = await geoPayout.find({ geo: { $in: country } }).sort('-1');
            min = Math.min.apply(null, priceValArr.map(function (item) {
                return item.price;
            }));
            max = Math.max.apply(null, priceValArr.map(function (item) {
                return item.price;
            }));
            // const maxPrivceValue = max;
            const minPriceValue = min;

            if (payable_event_price < minPriceValue) {
                const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price should be Greater or equal to " + minPriceValue + " for the selected geo" } };
                res.status(400).send(reMsg);
                return;
            }
        } else {
            let priceValArr = await geoPayout.find({ geo: { $in: country } });
            const priceVal = priceValArr[0].price;
            if (payable_event_price < priceVal) {
                const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price should be Greater or equal to " + priceVal + " for the selected geo" } };
                res.status(400).send(reMsg);
                return;
            }

        }
    }
    if (MMP == 'Adjust') {
        if (goal_budget_type == 'CPA' && MMP == 'Adjust') {
            var arrNonPayableEventToken = [];
            var arrNonPayableEventName = [];
            var arrNonPayableEventPrice = [];
            if (Array.isArray(goal_budget) && goal_budget.length > 0) {
                //console.log(goal_budget);
                for (let i = 0; i < goal_budget.length; i++) {
                    let value = goal_budget[i];
                    //console.log(`${index}: ${value.non_payable_event_name}`);
                    arrNonPayableEventName.push(value.non_payable_event_name);
                    if (value.non_payable_event_token) {
                        arrNonPayableEventToken.push(value.non_payable_event_token);
                    }
                    arrNonPayableEventPrice.push(value.non_payable_event_price);
                }
                var arrNonPayableEventName = arrNonPayableEventName.filter(function (eName) {
                    return eName !== "";
                });
                var arrNonPayableEventToken = arrNonPayableEventToken.filter(function (eToken) {
                    return eToken !== "";
                });
                //console.log(arrNonPayableEventName);
                //console.log(arrNonPayableEventToken);
                const totNonPayableEventToken = arrNonPayableEventName.length;
                const totNonPayableEventName = arrNonPayableEventToken.length;

                // console.log(totNonPayableEventToken);
                // console.log(totNonPayableEventName);

                if (parseInt(totNonPayableEventToken) !== parseInt(totNonPayableEventName)) {
                    console.log("Please enter all event token for all event name!!");
                    const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Please enter all event token for all event name!!" } };
                    res.status(400).send(reMsg);
                    return;
                }
            }
        }
    } else {
        if (goal_budget_type == 'CPA') {
            var arrNonPayableEventToken = [];
            var arrNonPayableEventName = [];
            var arrNonPayableEventPrice = [];

            if (!Array.isArray(goal_budget)) {
                const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "goal_budget should be []!!" } };
                res.status(400).send(reMsg);
                return;
            } else if (Array.isArray(goal_budget) && goal_budget.length == 0) {
                const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "goal_budget is not allowed to be empty" } };
                res.status(400).send(reMsg);
                return;
            } else {
                //console.log(goal_budget);
                // goal_budget.forEach(function callback(value, index) {
                for (let i = 0; i < goal_budget.length; i++) {
                    let value = goal_budget[i];
                    //console.log(`${index}: ${value.non_payable_event_name}`);
                    arrNonPayableEventName.push(value.non_payable_event_name);
                    if (value.non_payable_event_token) {
                        arrNonPayableEventToken.push(value.non_payable_event_token);
                    }
                    arrNonPayableEventPrice.push(value.non_payable_event_price);
                    //});
                }
                var arrNonPayableEventName = arrNonPayableEventName.filter(function (eName) {
                    return eName !== "";
                });
                var arrNonPayableEventToken = arrNonPayableEventToken.filter(function (eToken) {
                    return eToken !== "";
                });
            }
        }
    }

    if (goal_budget_type == 'CPI') {
        if (!payable_event_price) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price is not allowed to be empty" } };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (goal_budget_type == 'CPI') {
        if (!payable_event_price) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "payable_event_price is not allowed to be empty" } };
            res.status(400).send(reMsg);
            return;
        }
    }

    const cta_link_check = stringIsAValidUrl(cta_link, ['https']);
    if (cta_link_check == false) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Invalid Click Through Attribution Link (CTA) URL" } };
        res.status(400).send(reMsg);
        return;

    }
    if (vta_link) {
        const vta_link_check = stringIsAValidUrl(vta_link, ['https']);
        if (vta_link_check == false) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "Invalid View Through Attribution Link( VTA) URL" } };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (!Array.isArray(pubs)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisher should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(pubs) && pubs.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "publisher is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    // if (typeof source_type !== 'undefined' && source_type == "SDK") {
    //   if (!Array.isArray(creatives)) {
    //     const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "creative should be []!!" } };
    //     res.status(400).send(reMsg);
    //     return;
    //   } else if (Array.isArray(creatives) && creatives.length == 0) {
    //     const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "creative is not allowed to be empty" } };
    //     res.status(400).send(reMsg);
    //     return;
    //   }
    // }

    if (typeof state !== "undefined" && state !== "") {
        if (!Array.isArray(state)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "state should be []!" } };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (typeof city !== "undefined" && city !== "") {
        if (!Array.isArray(city)) {
            const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "city should be []!" } };
            res.status(400).send(reMsg);
            return;
        }
    }

    if (!Array.isArray(country)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(country) && country.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "country is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(language)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(language) && language.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "language is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(interest)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(interest) && interest.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "interest is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    if (!Array.isArray(age_group)) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group should be []!!" } };
        res.status(400).send(reMsg);
        return;
    } else if (Array.isArray(age_group) && age_group.length == 0) {
        const reMsg = { "success": false, "errors": { "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": "age_group is not allowed to be empty" } };
        res.status(400).send(reMsg);
        return;
    }

    // create offer on trackier
    const axios_header = {
        headers: {
            'x-api-key': process.env.API_KEY,
            'Content-Type': 'application/json'
        }
    };


    // start ->  all publishers
    var publishers = [];
    if (Array.isArray(pubs) && pubs.length > 0) {
        let pubDataArray = await getPublisherByPubId(pubs);
        for (let i = 0; i < pubDataArray.length; i++) {
            let value = pubDataArray[i];
            publishers.push({ 'pub_id': value.pub_id, 'pub_name': value.pub_name, 'pub_details': value.pub_details, 'pub_website': value.pub_website, 'enable_s2s': value.enable_s2s, 'enable_os_targeting': value.enable_os_targeting, 'exclude_publisher': value.exclude_publisher, 'revenue_share': parseFloat(value.revenue_share), 'wl_s2s': value.wl_s2s, 'appsflyer_site_id': value.appsflyer_site_id, 'pub_status': value.pub_status, 'bid_ajustment': 100, 'bid_price': parseFloat(0.0), 'status': "active" });
        }
    }

    // Get offer by offer _id
    const _id = req.params.id;
    let offData = await Offer.findById(_id).exec();



    var pubObj = [];
    var pubStatusObj = [];
    for (var i = 0; i <= offData.publishers.length - 1; i++) {
        pubObj.push(parseInt(offData.publishers[i].pub_id));

        pubStatusObj.push({ [parseInt(offData.publishers[i].pub_id)]: offData.publishers[i].status });
    }




    var pubsActive = [];
    var pubsPaused = [];
    for (let i = 0; i < pubs.length; i++) {
        let pVal = pubs[i];
        if (typeof publisher_status[i][pVal] !== 'undefined' && publisher_status[i][pVal] == "active") {
            pubsActive.push(pVal);
        } else {
            pubsPaused.push(pVal);
        }
    }

    let urlObject = parse(offData.cta_link_basic + offData.cta_link, true);
    if (typeof urlObject.query.af_r !== 'undefined' && urlObject.query.af_r !== "") {
        var af_redirect_link_obj = urlObject.query.af_r;
    } else {
        var af_redirect_link_obj = "";
    }

    if (typeof urlObject.query.redirect !== 'undefined' && urlObject.query.redirect !== "") {
        var cta_redirect_link_obj = urlObject.query.redirect;
    } else {
        var cta_redirect_link_obj = "";
    }

    const query_cat_erid = parseQuery(offData.cta_link);
    var cta_keys = Object.keys(query_cat_erid);
    const cta_matches = cta_keys.filter(s => s.includes('event_callback_'));
    var adjustTockenArr = [];
    for (let i = 0; i < cta_matches.length; i++) {
        let expIntApp = cta_matches[i].split("_");
        adjustTockenArr.push(expIntApp[2]);
    }

    var goal_budget_obj = [];
    if (typeof offData.non_payable_event_name !== 'undefined' && offData.non_payable_event_name !== "") {
        const non_payable_event_name_arr = offData.non_payable_event_name.split(",");
        const non_payable_event_price = offData.non_payable_event_price.split(",");
        if (typeof MMP !== "undefined" && MMP == "Adjust") {
            for (let k = 0; k < non_payable_event_name_arr.length; k++) {
                goal_budget_obj.push({ "non_payable_event_name": non_payable_event_name_arr[k], "non_payable_event_price": parseFloat(non_payable_event_price[k]), "non_payable_event_token": adjustTockenArr[k] })
            }
        } else {
            for (let k = 0; k < non_payable_event_name_arr.length; k++) {
                goal_budget_obj.push({ "non_payable_event_name": non_payable_event_name_arr[k], "non_payable_event_price": parseFloat(non_payable_event_price[k]), "non_payable_event_token": "" })
            }
        }

    }
    const country_obj = offData.country.split(",");

    if (typeof offData.state !== undefined && offData.state !== "" && offData.state !== null) {
        console.log("State");
        var state_obj = offData.state.split(",");
    } else {
        var state_obj = [];
    }

    if (typeof offData.city !== undefined && offData.city !== "" && offData.city !== null) {
        console.log("City");
        var city_obj = offData.city.split(",");
    } else {
        var city_obj = [];
    }

    const language_obj = offData.language.split(",");
    const interest_obj = offData.interest.split(",");
    const age_group_obj = offData.age_group.split(",");


    const offCreative = await CreativeModel.find({ campaign_id: _id }).sort({ _id: -1 }).exec();

    var offCrArr = [];
    for (var i = 0; i <= offCreative.length - 1; i++) {
        let cr = offCreative[i];

        offCrArr.push({
            "creative": cr.creative,
            "creative_type": cr.creative_type,
            "concept_name": cr.concept_name,
            "image_dimension": cr.image_dimension,
            "ads_end_date": (cr.ads_end_date != null) ? cr.ads_end_date : '',
            "ads": cr.ads,
            "user": cr.user,
        });
    }

    const offerDataObj = {
        "user_type": user_type,
        "user_name": user_name,
        "user_email": user_email,
        "trackier_adv_id": offData.trackier_adv_id,
        "trackier_camp_id": offData.trackier_camp_id,
        "offer_name": offData.offer_name,
        "source_type": offData.source_type,
        "pubs": pubObj,
        "audience_id": offData.audience_id,
        "premium_apps": offData.premium_apps,
        "campaign_schedule": offData.campaign_schedule,
        "include_state_city": offData.include_state_city,
        "publisher_status": pubStatusObj,
        "MMP": offData.MMP,
        "icon": offData.icon,
        "operating_system": offData.operating_system,
        "kpi": (offData.kpi != null) ? offData.kpi : "",
        "bundle_id": offData.bundle_id,
        "cta_link": offData.cta_link_basic,
        "af_redirect_link": af_redirect_link_obj,
        "cta_redirect_link": cta_redirect_link_obj,
        "vta_link": (offData.vta_link_basic != null) ? offData.vta_link_basic : "",
        "payable_event_name": offData.payable_event_name,
        "payable_event_price": offData.payable_event_price,
        "goal_budget_type": offData.goal_budget_type,
        "goal_budget": goal_budget_obj,
        "total_budget": offData.total_budget,
        "daily_budget": offData.daily_budget,
        "country": country_obj,
        "state": state_obj,
        "state_inc_and_exc": offData.state_inc_and_exc,
        "city": city_obj,
        "city_inc_and_exc": offData.city_inc_and_exc,
        "language": language_obj,
        "interest": interest_obj,
        "age_group": age_group_obj,
        "creatives": offCrArr,
        "schedule_start_date": offData.schedule_start_date,
        "schedule_end_date": (offData.schedule_end_date != null) ? offData.schedule_end_date : ''
    };


    // console.log("============================Request Start=========================================");

    // console.log(req.body);
    // console.log("============================================================================");
    // console.log("=============================Request End=====================================");


    // console.log("============================Request offerDataObj=========================================");


    // console.log("=========================Request offerDataObj START=========================================");
    // console.log(offerDataObj);
    // console.log("=============================Request offerDataObj END=====================================");


    const diff = require("deep-object-diff").diff;
    let differencesReq = diff(offerDataObj, req.body);
    let differencesOld = diff(req.body, offerDataObj);


    // console.log("=========================differencesOld= START===========================");
    // console.log(differencesOld);
    // console.log("=========================differencesOld= END===========================");



    // console.log("============================differencesReq START======================================");
    // console.log(differencesReq);
    // console.log("=========================differencesReq END============================");


    //process.exit();

    var currentArrNonPayableEventName = [];
    var existArrNonPayableEventName = [];
    var currentArrNonPayableEventToken = [];
    if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPA') {
        if (Array.isArray(goal_budget) && goal_budget.length > 0) {
            for (let i = 0; i < goal_budget.length; i++) {
                let value = goal_budget[i];
                currentArrNonPayableEventName.push(value.non_payable_event_name.trim());
                if (value.non_payable_event_token !== "") {
                    currentArrNonPayableEventToken.push(value.non_payable_event_token);
                }
            }
        }
        existArrNonPayableEventName = offData.non_payable_event_name.split(",");

    }

    // AUDIENCE UPDATE
    if (typeof differencesReq.audience_id !== 'undefined' && differencesReq.audience_id !== "" || differencesReq.audience_id == "") {

        var oldAudienceName = "";
        var newAudienceName = "";
        if (differencesReq.audience_id == "") {
            const offAudId = await Offer.findOne({ _id }).exec();
            const audOldName = await Audience.findOne({ _id: offAudId.audience_id }).exec();
            oldAudienceName = audOldName.audience_name;

            newAudienceName = "";
        } else {
            const offAudId = await Offer.findOne({ _id }).exec();
            if (offAudId.audience_id == "") {
                oldAudienceName = "";
            } else {
                const audOldName = await Audience.findOne({ _id: offAudId.audience_id }).exec();
                oldAudienceName = audOldName.audience_name;
            }
            const audNewName = await Audience.findOne({ _id: audience_id }).exec();
            newAudienceName = audNewName.audience_name;
        }
        // Audience updated
        Offer.findOneAndUpdate({ _id }, { audience_id: audience_id }, { new: true }).exec().then(async (resOffer) => {
            console.log('audience_id Update Request');
            if (resOffer) {
                console.log('audience_id Update Response');
                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                // INSERT DATA INTO Tileline
                const timelineData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    type: "Audience",
                    old_value: oldAudienceName,
                    new_value: newAudienceName,
                    edited_by: user_name
                }
                // END INSERT DATA INTO Tileline
                await addTimelineData(timelineData);

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    company_name: ucfirst(advName.advName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    category: "Campaign",

                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                    message_adv: "<span class='text_primary'>Audience</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                    message_sa: "<span class='text_primary'>Audience</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                    read: 0,
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Audience",
                        old_value: oldAudienceName,
                        new_value: newAudienceName,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Audience",
                    old_value: oldAudienceName,
                    new_value: newAudienceName,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
            res.status(400).send(resMsg);
            return;
        });
    }

    // Campaign Schedule UPDATE
    if (typeof differencesReq.campaign_schedule !== 'undefined' && differencesReq.campaign_schedule !== "") {

        // CMAPIGN campaign schedule Yes or No update
        Offer.findOneAndUpdate({ _id }, { campaign_schedule: campaign_schedule }, { new: true }).exec().then(async (resOffer) => {
            console.log('Campaign schedule Update Request');
            if (resOffer) {
                console.log('Campaign schedule Update Response');
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
            res.status(400).send(resMsg);
            return;
        });
    }

    // Campaign include state scity status UPDATE
    if (typeof differencesReq.include_state_city !== 'undefined' && differencesReq.include_state_city !== "") {

        // INCLUDE STATE CITY
        Offer.findOneAndUpdate({ _id }, { include_state_city: include_state_city }, { new: true }).exec().then(async (resOffer) => {
            console.log('campaign schedule Update Request');
            if (resOffer) {
                console.log('campaign schedule Update Response');
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
            res.status(400).send(resMsg);
            return;
        });
    }

    // CITY UPDATE
    if (typeof differencesReq.city !== 'undefined' && differencesReq.city !== "" || typeof differencesReq.city_inc_and_exc !== 'undefined' && differencesReq.city_inc_and_exc !== "") {

        // CITY UPDATE
        const cityString = city.join(',');
        const cityOldString = offData.city;
        if (typeof city_inc_and_exc !== 'undefined' && city_inc_and_exc == "on") {
            var city_inc_and_exc_str = "allow";
            var city_inc_and_exc_db = "on";
        } else {
            var city_inc_and_exc_str = "deny";
            var city_inc_and_exc_db = "off";
        }

        // CITY and EXLUDE UPDATE
        Offer.findOneAndUpdate({ _id }, { city: cityString, city_details: city_details, city_inc_and_exc: city_inc_and_exc_db }, { new: true }).exec().then(async (resOffer) => {
            console.log('city Update Request');
            if (resOffer) {
                console.log('city Update Response');

                // FindAll Targetings
                await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", axios_header).then(async (getTargetings) => {
                    if (typeof getTargetings.statusText !== 'undefined' && getTargetings.statusText == "OK") {

                        if (typeof offData.city !== 'undefined' && offData.city !== "") {
                            for (let j = 0; j < getTargetings.data.ruleblocks.length; j++) {
                                let rb = getTargetings.data.ruleblocks[j];

                                // FindAll Targetings Rules
                                await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id, axios_header).then(async (getTargetingsR) => {
                                    if (typeof getTargetingsR.statusText !== 'undefined' && getTargetingsR.statusText == "OK") {
                                        for (let k = 0; k < getTargetingsR.data.ruleblock.rules.length; k++) {
                                            let rbr = getTargetingsR.data.ruleblock.rules[k];
                                            if (typeof rbr.variable !== 'undefined' && rbr.variable == 'city') {

                                                if (Array.isArray(city) && city.length > 0) {
                                                    // Targeting block rules objects
                                                    const campaignTargeting = { "variable": "city", "logic": city_inc_and_exc_str, "condition": "contains", "values": city };
                                                    console.log('API Targeting City Rule Request');
                                                    await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id, campaignTargeting, axios_header).then((resRbr) => {
                                                        if (typeof resRbr.data.success !== 'undefined' && resRbr.data.success == true) {
                                                            console.log('API Targeting City Rule Request Response');
                                                        } else {
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        }
                                                    }).catch(err => {
                                                        console.log(err);
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    });
                                                } else {
                                                    //console.log(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id);
                                                    // Delete Existing Targeting rules
                                                    console.log('API Delete existing targeting rules on trackier Request');
                                                    await axios.delete(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id, axios_header).then((dtsPayout) => {
                                                        if (typeof dtsPayout.data.success !== 'undefined' && dtsPayout.data.success == true) {
                                                            console.log('API Delete existing targeting rules on trackier Response');
                                                        } else {
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        }
                                                    }).catch(err => {
                                                        console.log(err);
                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                        res.status(200).send(resMsg);
                                                        return;
                                                    });
                                                }
                                            }
                                        }
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }

                        } else {

                            if (Array.isArray(city) && city.length > 0) {
                                for (let j = 0; j < getTargetings.data.ruleblocks.length; j++) {
                                    let targeting = getTargetings.data.ruleblocks[j];

                                    // Targeting block rules objects
                                    const cityRUlesData = [{ "variable": "city", "logic": city_inc_and_exc_str, "condition": "contains", "values": city }];
                                    const campaignTargetingAdd = { "rules": cityRUlesData };
                                    console.log('API Targeting City Rule Request');
                                    await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + targeting._id + "/rules", campaignTargetingAdd, axios_header).then((resState) => {
                                        if (typeof resState.data.success !== 'undefined' && resState.data.success == true) {
                                            console.log('API Targeting City Rule Request Response');
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });
                                }

                            }
                        }
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch(err => {
                    console.log(err);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });


                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    company_name: ucfirst(advName.advName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    category: "Campaign",

                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                    message_adv: "<span class='text_primary'>City</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                    message_sa: "<span class='text_primary'>City</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                    read: 0,
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                // INSERT DATA INTO Tileline
                const timelineData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    type: "City",
                    old_value: cityOldString,
                    new_value: cityString,
                    edited_by: user_name
                }
                // END INSERT DATA INTO Tileline
                await addTimelineData(timelineData);

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "City",
                        old_value: cityOldString,
                        new_value: cityString,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "City",
                    old_value: cityOldString,
                    new_value: cityString,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
            res.status(400).send(resMsg);
            return;
        });
    }

    // STATE UPDATE
    if (typeof country !== 'undefined' && country.length == 1) {
        if (typeof differencesReq.state !== 'undefined' && differencesReq.state !== "" || typeof differencesReq.state_inc_and_exc !== 'undefined' && differencesReq.state_inc_and_exc !== "") {

            // STATE UPDATE
            var stateString = state.join(',');
            var stateOldString = offData.state;
            if (typeof state_inc_and_exc !== 'undefined' && state_inc_and_exc == "on") {
                var state_inc_and_exc_str = "allow";
                var state_inc_and_exc_DB = "on";
            } else {
                var state_inc_and_exc_str = "deny";
                var state_inc_and_exc_DB = "off";
            }

            // STATE and EXLUDE UPDATE
            Offer.findOneAndUpdate({ _id }, { state: stateString, state_inc_and_exc: state_inc_and_exc_DB }, { new: true }).exec().then(async (resOffer) => {
                console.log('state Update Request');
                if (resOffer) {
                    console.log('state Update Response');

                    // FindAll Targetings
                    console.log("get trageting for state upadete request");
                    await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", axios_header).then(async (getTargetings) => {
                        if (typeof getTargetings.statusText !== 'undefined' && getTargetings.statusText == "OK") {
                            console.log("get trageting for state upadete request");
                            if (typeof offData.state !== 'undefined' && offData.state !== "") {
                                for (let j = 0; j < getTargetings.data.ruleblocks.length; j++) {
                                    let rb = getTargetings.data.ruleblocks[j];

                                    // FindAll Targetings Rules
                                    console.log("get trageting rules for state upadete request");
                                    await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id, axios_header).then(async (getTargetingsR) => {
                                        if (typeof getTargetingsR.statusText !== 'undefined' && getTargetingsR.statusText == "OK") {
                                            console.log("get trageting rules for state upadete Response");
                                            for (let k = 0; k < getTargetingsR.data.ruleblock.rules.length; k++) {
                                                let rbr = getTargetingsR.data.ruleblock.rules[k];
                                                if (typeof rbr.variable !== 'undefined' && rbr.variable == 'region') {

                                                    if (Array.isArray(state) && state.length > 0) {
                                                        // Targeting block rules objects
                                                        const campaignTargeting = { "variable": "region", "logic": state_inc_and_exc_str, "condition": "contains", "values": state };
                                                        console.log('API Targeting State Rule Request');
                                                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id, campaignTargeting, axios_header).then((resRbr) => {
                                                            if (typeof resRbr.data.success !== 'undefined' && resRbr.data.success == true) {
                                                                console.log('API Targeting State Rule Request Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    } else {
                                                        // Delete Existing Targeting rules
                                                        console.log('API Delete existing targeting rules on trackier Request');
                                                        await axios.delete(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id, axios_header).then((dtsPayout) => {
                                                            if (typeof dtsPayout.data.success !== 'undefined' && dtsPayout.data.success == true) {
                                                                console.log('API Delete existing targeting rules on trackier Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    }
                                                }
                                            }
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });
                                }

                            } else {

                                if (Array.isArray(state) && state.length > 0) {
                                    for (let j = 0; j < getTargetings.data.ruleblocks.length; j++) {
                                        let targeting = getTargetings.data.ruleblocks[j];

                                        // Targeting block rules objects

                                        const stateRUlesData = [{ "variable": "region", "logic": state_inc_and_exc_str, "condition": "contains", "values": state }];
                                        const campaignTargetingAdd = { "rules": stateRUlesData };

                                        console.log('API Targeting State Rule Request');
                                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + targeting._id + "/rules", campaignTargetingAdd, axios_header).then((resState) => {
                                            if (typeof resState.data.success !== 'undefined' && resState.data.success == true) {
                                                console.log('API Targeting State Rule Request Response');
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(err => {
                                            console.log(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                    }

                                }
                            }
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });


                    // Send Mail to User
                    const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                    // INSERT DATA INTO NOTIFICATIONS
                    const notificationData = {
                        advertiser_id: parseInt(trackier_adv_id),
                        advertiser_name: ucfirst(advName.advertiserName),
                        company_name: ucfirst(advName.advName),
                        offer_id: trackier_camp_id,
                        offer_name: ucfirst(offer_name),
                        category: "Campaign",

                        subject_adv: 'Offer ' + offer_name + ' has been edited',
                        message_adv: "<span class='text_primary'>State</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                        subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                        message_sa: "<span class='text_primary'>State</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                        read: 0,
                    }
                    // END INSERT DATA INTO NOTIFICATIONS
                    await addNotificationsData(notificationData);

                    // INSERT DATA INTO Tileline
                    const timelineData = {
                        advertiser_id: parseInt(trackier_adv_id),
                        advertiser_name: ucfirst(advName.advertiserName),
                        offer_id: trackier_camp_id,
                        offer_name: ucfirst(offer_name),
                        type: "State",
                        old_value: stateOldString,
                        new_value: stateString,
                        edited_by: user_name
                    }
                    // END INSERT DATA INTO Tileline
                    await addTimelineData(timelineData);

                    if (advName.email_preferences == true) {
                        // Send Mail to Admin if status inactive/suspended
                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                        const messageBodyAdvetiser = (templateAdvertiser({
                            todayDate: dateprint(),
                            adv_id: trackier_adv_id,
                            offer_id: trackier_camp_id,
                            offer_name: offer_name,
                            adv_name: ucwords(advName.advName),
                            advertiserName: ucwords(advName.advertiserName),
                            edit_filed: "State",
                            old_value: stateOldString,
                            new_value: stateString,
                            edited_by: user_name,
                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                            base_url: process.env.APPLABS_URL
                        }))
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const msgAdvertiser = {
                            to: advName.email,
                            //to: 'sudish@applabs.ai',
                            from: {
                                name: process.env.MAIL_FROM_NAME,
                                email: process.env.MAIL_FROM_EMAIL,
                            },
                            bcc: bcc_mail,
                            subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                            html: messageBodyAdvetiser
                        };
                        //ES6
                        sgMail.send(msgAdvertiser).then(() => { }, error => {
                            console.error(error);
                            if (error.response) {
                                console.error(error.response.body)
                            }
                        }).catch((error) => {
                            const response = { 'success': false, 'message': error };
                            res.status(200).send(response);
                            return;
                        });
                    }

                    // Send Mail to Admin
                    const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                    const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                    const templateAdmin = handlebars.compile(emailTemplateAdmin);
                    const messageBodyAdmin = (templateAdmin({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "State",
                        old_value: stateOldString,
                        new_value: stateString,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdmin = {
                        to: admin_mail,
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        //bcc: bcc_mail,
                        subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                        html: messageBodyAdmin
                    };
                    //ES6
                    sgMail.send(msgAdmin).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        console.log(error);
                        const response = { 'success': false, 'message': error };
                        console.error(response);
                    });
                    // End Send Mail to Admin

                } else {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                }
            }).catch((error) => {
                const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                res.status(400).send(resMsg);
                return;
            });
        }
    }


    // OFFER NAME UPDATE
    if (typeof differencesReq.offer_name !== 'undefined' && differencesReq.offer_name !== "") {

        const offerNameData = { "title": "AL-" + offer_name }
        console.log('API Offer Name Update Request');
        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, offerNameData, axios_header).then((offRes) => {

            if (typeof offRes.data.success !== 'undefined' && offRes.data.success == true) {
                console.log('API Offer Name Update Response');

                Offer.findOneAndUpdate({ _id }, { offer_name: offer_name }, { new: true }).exec().then(async (resOffer) => {
                    console.log('Offer Name Update Request');
                    if (resOffer) {
                        console.log('Offer Name Update Response');
                        // Send Mail to User

                        const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                        // INSERT DATA INTO NOTIFICATIONS
                        const notificationData = {
                            advertiser_id: parseInt(trackier_adv_id),
                            advertiser_name: ucfirst(advName.advertiserName),
                            company_name: ucfirst(advName.advName),
                            offer_id: trackier_camp_id,
                            offer_name: ucfirst(offer_name),
                            category: "Campaign",

                            subject_adv: 'Offer ' + offer_name + ' has been edited',
                            message_adv: "<span class='text_primary'>Offer Name</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                            subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                            message_sa: "<span class='text_primary'>Offer Name</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                            read: 0,
                        }
                        // END INSERT DATA INTO NOTIFICATIONS
                        await addNotificationsData(notificationData);

                        // INSERT DATA INTO Tileline
                        const timelineData = {
                            advertiser_id: parseInt(trackier_adv_id),
                            advertiser_name: ucfirst(advName.advertiserName),
                            offer_id: trackier_camp_id,
                            offer_name: ucfirst(offer_name),
                            type: "Offer Name",
                            old_value: differencesOld.offer_name,
                            new_value: differencesReq.offer_name,
                            edited_by: user_name
                        }
                        // END INSERT DATA INTO Tileline
                        await addTimelineData(timelineData);

                        if (advName.email_preferences == true) {
                            // Send Mail to Admin if status inactive/suspended
                            const bcc_mail = process.env.BCC_EMAILS.split(",");
                            var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                            const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                            const messageBodyAdvetiser = (templateAdvertiser({
                                todayDate: dateprint(),
                                adv_id: trackier_adv_id,
                                offer_id: trackier_camp_id,
                                offer_name: offer_name,
                                adv_name: ucwords(advName.advName),
                                advertiserName: ucwords(advName.advertiserName),
                                edit_filed: "Offer Name",
                                old_value: differencesOld.offer_name,
                                new_value: differencesReq.offer_name,
                                edited_by: user_name,
                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                base_url: process.env.APPLABS_URL
                            }))
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                            const msgAdvertiser = {
                                to: advName.email,
                                //to: 'sudish@applabs.ai',
                                from: {
                                    name: process.env.MAIL_FROM_NAME,
                                    email: process.env.MAIL_FROM_EMAIL,
                                },
                                bcc: bcc_mail,
                                subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                html: messageBodyAdvetiser
                            };
                            //ES6
                            sgMail.send(msgAdvertiser).then(() => { }, error => {
                                console.error(error);
                                if (error.response) {
                                    console.error(error.response.body)
                                }
                            }).catch((error) => {
                                const response = { 'success': false, 'message': error };
                                res.status(200).send(response);
                                return;
                            });
                        }

                        // Send Mail to Admin
                        const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                        const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                        const templateAdmin = handlebars.compile(emailTemplateAdmin);
                        const messageBodyAdmin = (templateAdmin({
                            todayDate: dateprint(),
                            adv_id: trackier_adv_id,
                            offer_id: trackier_camp_id,
                            offer_name: offer_name,
                            adv_name: ucwords(advName.advName),
                            advertiserName: ucwords(advName.advertiserName),
                            edit_filed: "Offer Name",
                            old_value: differencesOld.offer_name,
                            new_value: differencesReq.offer_name,
                            edited_by: user_name,
                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                            base_url: process.env.APPLABS_URL
                        }))
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const msgAdmin = {
                            to: admin_mail,
                            from: {
                                name: process.env.MAIL_FROM_NAME,
                                email: process.env.MAIL_FROM_EMAIL,
                            },
                            //bcc: bcc_mail,
                            subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                            html: messageBodyAdmin
                        };
                        //ES6
                        sgMail.send(msgAdmin).then(() => { }, error => {
                            console.error(error);
                            if (error.response) {
                                console.error(error.response.body)
                            }
                        }).catch((error) => {
                            const response = { 'success': false, 'message': error };
                            console.error(response);
                        });
                        // End Send Mail to Admin

                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch((error) => {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                    res.status(400).send(resMsg);
                    return;
                });
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    if (typeof source_type !== 'undefined' && source_type == "DIRECT") {
        // ICON UPDATE
        if (typeof differencesReq.icon !== 'undefined' && differencesReq.icon !== "") {

            await Offer.findOneAndUpdate({ _id }, { icon: icon }, { new: true }).exec().then(async (resOffer) => {
                console.log('Icon Update Request');
                if (resOffer) {
                    console.log('Icon Update Response');

                    // Start Update icon name on trackier
                    const creativeIconName = icon.split('.');
                    const creativeData = { "creativeNames": [creativeIconName[0]] };
                    const aData = new CreativeCtrModel({
                        trackier_adv_id: trackier_adv_id,
                        trackier_camp_id: trackier_camp_id,
                        creative_name: creativeIconName[0],
                        creative_ctr: 1.4514,
                    });
                    await aData.save(aData).then(ctr_data => {
                        console.log('Creative icon ctr ok');
                        // // STEP-11 push app lists on trackier
                        axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then((creativeUpload) => {
                            console.log('Trackier Creative icon Request');
                            if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                                console.log('Trackier Creative icon Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch(err => {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        });
                    }).catch(err => {
                        console.error(err);
                    });
                    // End Update icon name on trackier

                    // Send Mail to User
                    const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                    // INSERT DATA INTO NOTIFICATIONS
                    const notificationData = {
                        advertiser_id: parseInt(trackier_adv_id),
                        advertiser_name: ucfirst(advName.advertiserName),
                        company_name: ucfirst(advName.advName),
                        offer_id: trackier_camp_id,
                        offer_name: ucfirst(offer_name),
                        category: "Campaign",

                        subject_adv: 'Offer ' + offer_name + ' has been edited',
                        message_adv: "<span class='text_primary'>Icon</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                        subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                        message_sa: "<span class='text_primary'>Icon</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                        read: 0,
                    }
                    // END INSERT DATA INTO NOTIFICATIONS
                    await addNotificationsData(notificationData);

                    // INSERT DATA INTO Tileline
                    const timelineData = {
                        advertiser_id: parseInt(trackier_adv_id),
                        advertiser_name: ucfirst(advName.advertiserName),
                        offer_id: trackier_camp_id,
                        offer_name: ucfirst(offer_name),
                        type: "Icon",
                        old_value: differencesOld.icon,
                        new_value: differencesReq.icon,
                        edited_by: user_name
                    }
                    // END INSERT DATA INTO Tileline
                    await addTimelineData(timelineData);

                    if (advName.email_preferences == true) {
                        // Send Mail to Admin if status inactive/suspended
                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                        const messageBodyAdvetiser = (templateAdvertiser({
                            todayDate: dateprint(),
                            adv_id: trackier_adv_id,
                            offer_id: trackier_camp_id,
                            offer_name: offer_name,
                            adv_name: ucwords(advName.advName),
                            advertiserName: ucwords(advName.advertiserName),
                            edit_filed: "Icon",
                            old_value: differencesOld.icon,
                            new_value: differencesReq.icon,
                            edited_by: user_name,
                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                            base_url: process.env.APPLABS_URL
                        }))
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const msgAdvertiser = {
                            to: advName.email,
                            //to: 'sudish@applabs.ai',
                            from: {
                                name: process.env.MAIL_FROM_NAME,
                                email: process.env.MAIL_FROM_EMAIL,
                            },
                            bcc: bcc_mail,
                            subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                            html: messageBodyAdvetiser
                        };
                        //ES6
                        sgMail.send(msgAdvertiser).then(() => { }, error => {
                            console.error(error);
                            if (error.response) {
                                console.error(error.response.body)
                            }
                        }).catch((error) => {
                            const response = { 'success': false, 'message': error };
                            res.status(200).send(response);
                            return;
                        });
                    }

                    // Send Mail to Admin
                    const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                    const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                    const templateAdmin = handlebars.compile(emailTemplateAdmin);
                    const messageBodyAdmin = (templateAdmin({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Icon",
                        old_value: differencesOld.icon,
                        new_value: differencesReq.icon,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdmin = {
                        to: admin_mail,
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        //bcc: bcc_mail,
                        subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                        html: messageBodyAdmin
                    };
                    //ES6
                    sgMail.send(msgAdmin).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        console.error(response);
                    });
                    // End Send Mail to Admin

                } else {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                }
            }).catch((error) => {
                const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                res.status(400).send(resMsg);
                return;
            });


        }
    }

    // KPI UPDATE
    if (typeof differencesReq.kpi !== 'undefined' && differencesReq.kpi !== "") {

        const offerKpiData = { "kpi": kpi }
        console.log('API KPI Update Request');
        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, offerKpiData, axios_header).then((offKpiRes) => {

            if (typeof offKpiRes.data.success !== 'undefined' && offKpiRes.data.success == true) {
                console.log('API KPI Update Response');

                Offer.findOneAndUpdate({ _id }, { kpi: kpi }, { new: true }).exec().then(async (resOffer) => {
                    console.log('KPI Update Request');
                    if (resOffer) {
                        console.log('KPI Update Response');
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch((error) => {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                    res.status(400).send(resMsg);
                    return;
                });
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }


    // CTA LINK UPDATE
    if (typeof differencesReq.cta_link !== 'undefined' && differencesReq.cta_link !== "" || typeof differencesReq.af_redirect_link !== 'undefined' && differencesReq.af_redirect_link !== "" || typeof differencesReq.cta_redirect_link !== 'undefined' && differencesReq.cta_redirect_link !== "") {

        var cta_link_main = offData.cta_link;
        var ctaLink = cta_link;
        var normalURL = cta_link;
        var supportive_link = "";

        if (typeof MMP !== "undefined" && MMP == "Branch") {
            // Start Encode ~agency_id URL
            const query_agid = require('url').parse(cta_link, true).query;
            if (typeof query_agid['~agency_id'] !== 'undefined' && query_agid['~agency_id'] !== "") {
                const search_br_n = "&~agency_id=" + query_agid['~agency_id'];
                const search_replace_cta = { [search_br_n]: "" };
                const regex = new RegExp("" + search_br_n + "", "g");
                ctaLink = ctaLink.replace(regex, matched => search_replace_cta[matched]);
            }
            const search_replace_cta_m = { '&~agency_id=730316834393313593': "" };
            cta_link_main = cta_link_main.replace(/&~agency_id=730316834393313593/g, matched => search_replace_cta_m[matched]);
        }
        var finalCTALinks = ctaLink + cta_link_main;

        if (typeof MMP !== "undefined" && MMP == "Appsflyer") {

            const query_agid = require('url').parse(cta_link, true).query;
            var afAdId = "&af_ad_id=";
            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                afAdId += "{publisher_id}_";
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                afAdId += "{source}_";
            }
            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                afAdId += "{app_name}_";
            }
            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                afAdId += "{camp_id}_";
            }
            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                afAdId += "{publisher_id}_";
            }
            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                afAdId += "{creative_name}_";
            }

            // Start Encode ~agency_id URL
            if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                const search_replace = { '&af_sub1={publisher_id}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub1={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                const search_replace = { '&af_sub2={source}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub2={source}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                const search_replace = { '&af_sub3={app_name}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub3={app_name}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                const search_replace = { '&af_sub4={camp_id}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub4={camp_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                const search_replace = { '&af_sub5={publisher_id}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub5={publisher_id}/g, matched => search_replace[matched]);
            }
            if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                const search_replace = { '&af_sub6={creative_name}': "" };
                finalCTALinks = finalCTALinks.replace(/&af_sub6={creative_name}/g, matched => search_replace[matched]);
            }
            if (afAdId !== "&af_ad_id=") {
                finalCTALinks = finalCTALinks + afAdId.replace(/_+$/, '');
            } else {
                finalCTALinks = finalCTALinks;
            }

            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '__DEEPLINK__': "", '__CURRENCY__': 'USD', '=channel': '=AL-{publisher_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}|__DEEPLINK__|__CURRENCY__|=channel/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Branch") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '={channel_id}': '=AL-{publisher_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}|={channel_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Adjust") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Kochava") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Appmetrica") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Singular") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "MyTracker") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else if (typeof MMP !== "undefined" && MMP == "Other") {
            const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
            var finalCtaLink = finalCTALinks.replace(/{placement_id}/g, matched => search_replace[matched]);
        } else {
            var finalCtaLink = finalCTALinks;
        }

        // Start Encode af_r URL

        var parts_af = require('url').parse(finalCtaLink, true).query;

        // console.log(parts_af);

        if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
            if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {

                if (typeof parts_af.af_r !== 'undefined' && parts_af.af_r !== "") {

                    const search_br_n = "&af_r=" + encodeURIComponent(parts_af.af_r);
                    const search_replace_cta = { [search_br_n]: "" };
                    const regex = new RegExp("" + search_br_n + "", "g");
                    const removeAfdpFromCta = finalCtaLink.replace(regex, matched => search_replace_cta[matched]);

                    const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                    finalCtaLink = removeAfdpFromCta + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                } else {
                    const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                    finalCtaLink = finalCtaLink + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                }
            }
            // End Encode af_r URL
        }

        if (typeof MMP !== "undefined" && MMP == "Branch") {
            const parts_br_n = require('url').parse(normalURL, true).query;
            if (typeof parts_br_n['~agency_id'] !== 'undefined' && parts_br_n['~agency_id'] !== "") {
                finalCtaLink = finalCtaLink + "&~agency_id=" + parts_br_n['~agency_id'];
            } else {
                finalCtaLink = finalCtaLink + "&~agency_id=730316834393313593";
            }
        }

        if (typeof MMP !== "undefined" && MMP == "Adjust") {
            if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {

                if (typeof parts_af.redirect !== 'undefined' && parts_af.redirect !== "") {

                    const search_br_n = "&redirect=" + encodeURIComponent(parts_af.redirect);
                    const search_replace_cta = { [search_br_n]: "" };
                    const regex = new RegExp("" + search_br_n + "", "g");
                    const removeAfdpFromCta = finalCtaLink.replace(regex, matched => search_replace_cta[matched]);

                    const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                    finalCtaLink = removeAfdpFromCta + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                } else {
                    const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                    finalCtaLink = finalCtaLink + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                }
            }
        }

        const campaignCTA = { "url": finalCtaLink };
        console.log('API CTA MAIN Link Update Request');
        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignCTA, axios_header).then(async (offCTARes) => {
            if (typeof offCTARes.data.success !== 'undefined' && offCTARes.data.success == true) {
                console.log('API CTA MAIN Link Update Response');

                // FindAll landing pages
                await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", axios_header).then(async (getLp) => {
                    if (typeof getLp.statusText !== 'undefined' && getLp.statusText == "OK") {

                        for (let j = 0; j < getLp.data.landingPages.length; j++) {
                            let lp = getLp.data.landingPages[j];

                            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("redirect=false") !== -1) {
                                    supportive_link = finalCtaLink + "&redirect=false&af_ip={p5}&af_ua={user_agent}";
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else if (typeof MMP !== "undefined" && MMP == "Branch") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("24s2s=TRUE") !== -1) {
                                    supportive_link = finalCtaLink + "&%24s2s=TRUE&device_ip={p5}&user_agent={user_agent}";
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else if (typeof MMP !== "undefined" && MMP == "Adjust") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("s2s=1") !== -1) {
                                    supportive_link = finalCtaLink + "&s2s=1&ip_address={p5}&user_agent={user_agent}";

                                    // CHECK "IN" IN array for domain replace
                                    var inArrayCountry = country.filter(function (inC) { return inC == "IN"; })
                                    if (Array.isArray(inArrayCountry) && inArrayCountry.length > 0) {
                                        const search_replace_adj = { 'app.adjust.com': 's2s.adjust.net.in', 'app.adjust.net.in': 's2s.adjust.net.in' };
                                        supportive_link = supportive_link.replace(/app.adjust.com|app.adjust.net.in/g, matched => search_replace_adj[matched]);
                                    } else {
                                        const search_replace_adj = { 'app.adjust.com': 's2s.adjust.com', 'app.adjust.net.in': 's2s.adjust.com' };
                                        supportive_link = supportive_link.replace(/app.adjust.com|app.adjust.net.in/g, matched => search_replace_adj[matched]);
                                    }
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else if (typeof MMP !== "undefined" && MMP == "Appmetrica") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("noredirect=1") !== -1) {
                                    supportive_link = finalCtaLink + "&device_ip={p5}&device_ua={user_agent}&click_timestamp={click_time}&noredirect=1";
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else if (typeof MMP !== "undefined" && MMP == "Singular") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("redirect=FALSE") !== -1) {
                                    supportive_link = finalCtaLink + "&ve={os_version}&redirect=FALSE&ip={ip}&ua={user_agent}&p=Android&sng_ref=applabs_{click_id}";
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else if (typeof MMP !== "undefined" && MMP == "MyTracker") {
                                const parseQuery = lp.url.replace(/&amp;/g, '&');
                                if (parseQuery.indexOf("mt_no_redirect=1") !== -1) {
                                    supportive_link = finalCtaLink + "&mt_s2s=1&mt_no_redirect=1";
                                } else {
                                    supportive_link = finalCtaLink;
                                }
                            } else {
                                supportive_link = finalCtaLink;
                            }

                            let lpIds = lp.title.substring(lp.title.length - 4);
                            let pubDt = await getPublisherDataByPubId(parseInt(lpIds));

                            if (lpIds == 2705) {
                                if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                    const parseQuery = lp.url.replace(/&amp;/g, '&');
                                    if (parseQuery.indexOf("af_engagement_type=click_to_download") !== -1) {
                                        supportive_link = supportive_link + "&af_engagement_type=click_to_download&af_ad_type=installed";

                                        const search_replace = { 'AL_1{publisher_id}8_{camp_id}': 'AL127058_1' };
                                        supportive_link = supportive_link.replace(/AL_1{publisher_id}8_{camp_id}/g, matched => search_replace[matched]);
                                    } else {
                                        const search_replace = { 'AL_1{publisher_id}8_{camp_id}': 'AL127058' };
                                        supportive_link = supportive_link.replace(/AL_1{publisher_id}8_{camp_id}/g, matched => search_replace[matched]);
                                    }
                                }
                            }

                            if (lpIds == 2963) {
                                if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                    const parseQuery = lp.url.replace(/&amp;/g, '&');
                                    if (parseQuery.indexOf("af_engagement_type={p8}") !== -1) {
                                        supportive_link = supportive_link + "&af_engagement_type={p8}&af_ad_type={p9}&is_transfer={p10}";
                                    }
                                    /*} else {
                                      supportive_link = supportive_link + "&af_engagement_type={p8}&af_ad_type={p9}&is_transfer={p10}";
                                    }*/
                                }
                            }

                            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                if (typeof pubDt.pub_id !== "undefined" && lpIds == pubDt.pub_id) {
                                    const search_replace = { 'AL_1{publisher_id}8_{camp_id}': pubDt.appsflyer_site_id };
                                    supportive_link = supportive_link.replace(/AL_1{publisher_id}8_{camp_id}/g, matched => search_replace[matched]);
                                }
                            }

                            if (typeof MMP !== "undefined" && MMP == "Kochava" || typeof MMP !== "undefined" && MMP == "Other") {
                                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                                supportive_link = supportive_link.replace(/{placement_id}/g, matched => search_replace[matched]);
                            }

                            if (lpIds == 2802) {
                                if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                    if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                        const search_br_n = encodeURIComponent(decodeRedirectUrl);
                                        const search_replace_cta = { [search_br_n]: "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id };
                                        const regex = new RegExp("" + search_br_n + "", "g");
                                        supportive_link = supportive_link.replace(regex, matched => search_replace_cta[matched]);
                                    } else {
                                        supportive_link = supportive_link + "&af_r=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                    }
                                } else if (typeof MMP !== "undefined" && MMP == "Branch") {
                                    supportive_link = supportive_link + "&%24android_url=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id + "&%24mobile_web_only=true";
                                } else if (typeof MMP !== "undefined" && MMP == "Adjust") {
                                    if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                        const search_br_n = encodeURIComponent(decodeRedirectUrl);
                                        const search_replace_cta = { [search_br_n]: "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id };
                                        const regex = new RegExp("" + search_br_n + "", "g");
                                        supportive_link = supportive_link.replace(regex, matched => search_replace_cta[matched]);
                                    } else {
                                        supportive_link = supportive_link + "&redirect=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                    }
                                }
                            }

                            if (lpIds == 3631) {
                                if (typeof MMP !== "undefined" && MMP == "Branch") {
                                    supportive_link = supportive_link + "&%24android_url=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id + "&%24mobile_web_only=true";
                                } else if (typeof MMP !== "undefined" && MMP == "Adjust") {
                                    if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                        const search_br_n = encodeURIComponent(decodeRedirectUrl);
                                        const search_replace_cta = { [search_br_n]: "mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id };
                                        const regex = new RegExp("" + search_br_n + "", "g");
                                        supportive_link = supportive_link.replace(regex, matched => search_replace_cta[matched]);
                                    } else {
                                        supportive_link = supportive_link + "&redirect=mimarket%3A%2F%2Fdetails%3Fid%3D" + bundle_id;
                                    }
                                }
                            }

                            const lpData = { "title": lp.title, "url": supportive_link, "status": lp.status, "lpType": lp.lpType, "visibility": lp.visibility };
                            console.log('API Edit a Landing Page Request');
                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                    console.log('API Edit a Landing Page Response');
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });

                        }

                        var cta_link_main_link = cta_link_main;
                        var query_cta = require('url').parse(finalCTALinks, true).query;

                        if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                            if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                                if (typeof query_cta.af_r !== 'undefined' && query_cta.af_r !== "") {
                                    const search_br_n = "&af_r=" + encodeURIComponent(query_cta.af_r);
                                    const search_replace_cta = { [search_br_n]: "" };
                                    const regex = new RegExp("" + search_br_n + "", "g");

                                    const removeAfdpFromCta = cta_link_main.replace(regex, matched => search_replace_cta[matched]);

                                    const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                    cta_link_main_link = removeAfdpFromCta + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                                } else {
                                    const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                    cta_link_main_link = cta_link_main + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                                }
                            }
                        }

                        if (typeof MMP !== "undefined" && MMP == "Adjust") {
                            if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                if (typeof query_cta.redirect !== 'undefined' && query_cta.redirect !== "") {
                                    const search_br_n = "&redirect=" + encodeURIComponent(query_cta.redirect);
                                    const search_replace_cta = { [search_br_n]: "" };
                                    const regex = new RegExp("" + search_br_n + "", "g");
                                    const removeAfdpFromCta = finalCtaLink.replace(regex, matched => search_replace_cta[matched]);

                                    const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                    cta_link_main_link = removeAfdpFromCta + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                                } else {
                                    const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                    cta_link_main_link = cta_link_main + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                                }
                            }
                        }

                        var cta_link_basic_link = "";
                        if (typeof MMP !== "undefined" && MMP == "Branch") {
                            const parts_br_n = require('url').parse(normalURL, true).query;
                            if (typeof parts_br_n['~agency_id'] !== 'undefined' && parts_br_n['~agency_id'] !== "") {
                                cta_link_basic_link = ctaLink + "&~agency_id=" + parts_br_n['~agency_id'];
                            } else {
                                cta_link_basic_link = ctaLink;
                            }
                        } else {
                            cta_link_basic_link = ctaLink;
                        }

                        await Offer.findOneAndUpdate({ _id }, { cta_link_basic: cta_link_basic_link, cta_link: cta_link_main_link }, { new: true }).exec().then(async (updateRes) => {
                            console.log('DB LP Update Request');
                            if (updateRes) {
                                console.log('DB LP Update Reponse');

                                // SENDING MAIL TO EDIT CTA LINK
                                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                // INSERT DATA INTO NOTIFICATIONS
                                const notificationData = {
                                    advertiser_id: parseInt(trackier_adv_id),
                                    advertiser_name: ucfirst(advName.advertiserName),
                                    company_name: ucfirst(advName.advName),
                                    offer_id: trackier_camp_id,
                                    offer_name: ucfirst(offer_name),
                                    category: "Campaign",

                                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                                    message_adv: "<span class='text_primary'>CTA Link</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                    message_sa: "<span class='text_primary'>CTA Link</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                    read: 0
                                }
                                // END INSERT DATA INTO NOTIFICATIONS
                                await addNotificationsData(notificationData);

                                // INSERT DATA INTO Tileline
                                const timelineData = {
                                    advertiser_id: parseInt(trackier_adv_id),
                                    advertiser_name: ucfirst(advName.advertiserName),
                                    offer_id: trackier_camp_id,
                                    offer_name: ucfirst(offer_name),
                                    type: "CTA Link",
                                    old_value: differencesOld.cta_link,
                                    new_value: differencesReq.cta_link,
                                    edited_by: user_name
                                }
                                // END INSERT DATA INTO Tileline
                                await addTimelineData(timelineData);

                                if (advName.email_preferences == true) {
                                    // Send Mail to Admin if status inactive/suspended
                                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                    //console.log("differencesOld.cta_link" + differencesOld.cta_link);
                                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                    const messageBodyAdvetiser = (templateAdvertiser({
                                        todayDate: dateprint(),
                                        adv_id: trackier_adv_id,
                                        offer_id: trackier_camp_id,
                                        offer_name: offer_name,
                                        adv_name: ucwords(advName.advName),
                                        advertiserName: ucwords(advName.advertiserName),
                                        edit_filed: "CTA Link",
                                        old_value: differencesOld.cta_link,
                                        new_value: differencesReq.cta_link,
                                        edited_by: user_name,
                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdvertiser = {
                                        to: advName.email,
                                        //to: 'sudish@applabs.ai',
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        bcc: bcc_mail,
                                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                        html: messageBodyAdvetiser
                                    };
                                    //ES6
                                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        res.status(200).send(response);
                                        return;
                                    });
                                }

                                // Send Mail to Admin
                                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                const messageBodyAdmin = (templateAdmin({
                                    todayDate: dateprint(),
                                    adv_id: trackier_adv_id,
                                    offer_id: trackier_camp_id,
                                    offer_name: offer_name,
                                    adv_name: ucwords(advName.advName),
                                    advertiserName: ucwords(advName.advertiserName),
                                    edit_filed: "CTA Link",
                                    old_value: differencesOld.cta_link,
                                    new_value: differencesReq.cta_link,
                                    edited_by: user_name,
                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdmin = {
                                    to: admin_mail,
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    //bcc: bcc_mail,
                                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                    html: messageBodyAdmin
                                };
                                //ES6
                                sgMail.send(msgAdmin).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    const response = { 'success': false, 'message': error };
                                    console.error(response);
                                });
                                // End Send Mail to Admin
                            }
                        }).catch((error) => {
                            console.log(error)
                            const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                            res.status(400).send(resMsg);
                            return;
                        });

                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }

                }).catch(err => {
                    console.log(err);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });


    }

    // VTA LINK UPDATE
    if (typeof differencesReq.vta_link !== 'undefined' && differencesReq.vta_link !== "" || typeof differencesReq.cta_redirect_link !== 'undefined' && differencesReq.cta_redirect_link !== "" || typeof differencesReq.af_redirect_link !== 'undefined' && differencesReq.af_redirect_link !== "") {

        var vta_link_main = offData.vta_link;
        var vtaLink = vta_link;
        var normalURL = vta_link;
        if (typeof offData.vta_link !== 'undefined' && offData.vta_link !== null) {

            const search_replace = { '{click_id}': '{imp_id}' };
            vtaLink = vtaLink.replace(/{click_id}/g, matched => search_replace[matched]);

            if (typeof MMP !== "undefined" && MMP == "Branch") {
                // Start Encode ~agency_id URL
                const query_agid = require('url').parse(vta_link, true).query;
                if (typeof query_agid['~agency_id'] !== 'undefined' && query_agid['~agency_id'] !== "") {
                    const search_br_n = "&~agency_id=" + query_agid['~agency_id'];
                    const search_replace_vta = { [search_br_n]: "" };
                    const regex = new RegExp("" + search_br_n + "", "g");
                    vtaLink = vtaLink.replace(regex, matched => search_replace_vta[matched]);
                }
                const search_replace_vta_m = { '&~agency_id=730316834393313593': "" };
                vta_link_main = vta_link_main.replace(/&~agency_id=730316834393313593/g, matched => search_replace_vta_m[matched]);
            }
            var finalVTALinka = vtaLink + vta_link_main;


            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {

                const query_agid = require('url').parse(vta_link, true).query;
                var afAdId = "&af_ad_id=";

                if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                    afAdId += "{publisher_id}_";
                }
                if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                    afAdId += "{source}_";
                }

                if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                    afAdId += "{app_name}_";
                }

                if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                    afAdId += "{camp_id}_";
                }

                if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                    afAdId += "{publisher_id}_";
                }

                if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                    afAdId += "{creative_name}_";
                }

                // Start Encode ~agency_id URL
                if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                    const search_replace = { '&af_sub1={publisher_id}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub1={publisher_id}/g, matched => search_replace[matched]);
                }
                if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                    const search_replace = { '&af_sub2={source}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub2={source}/g, matched => search_replace[matched]);
                }
                if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                    const search_replace = { '&af_sub3={app_name}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub3={app_name}/g, matched => search_replace[matched]);
                }
                if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                    const search_replace = { '&af_sub4={camp_id}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub4={camp_id}/g, matched => search_replace[matched]);
                }
                if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                    const search_replace = { '&af_sub5={publisher_id}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub5={publisher_id}/g, matched => search_replace[matched]);
                }
                if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                    const search_replace = { '&af_sub6={creative_name}': "" };
                    finalVTALinka = finalVTALinka.replace(/&af_sub6={creative_name}/g, matched => search_replace[matched]);
                }
                if (afAdId !== "&af_ad_id=") {
                    finalVTALinka = finalVTALinka + afAdId.replace(/_+$/, '');
                } else {
                    finalVTALinka = finalVTALinka;
                }

                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '__DEEPLINK__': "", '__CURRENCY__': 'USD', '=channel': '=AL-{publisher_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}|__DEEPLINK__|__CURRENCY__|=channel/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Branch") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '={channel_id}': '=AL-{publisher_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}|={channel_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Adjust") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Kochava") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Appmetrica") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Singular") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "MyTracker") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else if (typeof MMP !== "undefined" && MMP == "Other") {
                const search_replace = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                var finalVtaLink = finalVTALinka.replace(/{placement_id}/g, matched => search_replace[matched]);
            } else {
                var finalVtaLink = finalVTALinka;
            }

            // Start Encode af_r URL
            var parts_af = require('url').parse(finalVtaLink, true).query;

            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {

                    if (typeof parts_af.af_r !== 'undefined' && parts_af.af_r !== "") {

                        const search_br_n = "&af_r=" + encodeURIComponent(parts_af.af_r);
                        const search_replace_vta = { [search_br_n]: "" };
                        const regex = new RegExp("" + search_br_n + "", "g");
                        const removeAfdpFromVta = finalVtaLink.replace(regex, matched => search_replace_vta[matched]);

                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                        finalVtaLink = removeAfdpFromVta + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                    } else {
                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                        finalVtaLink = finalVtaLink + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                    }
                }
                // End Encode af_r URL
            }

            if (typeof MMP !== "undefined" && MMP == "Branch") {
                const parts_br_n = require('url').parse(normalURL, true).query;
                if (typeof parts_br_n['~agency_id'] !== 'undefined' && parts_br_n['~agency_id'] !== "") {
                    finalVtaLink = finalVtaLink + "&~agency_id=" + parts_br_n['~agency_id'];
                } else {
                    finalVtaLink = finalVtaLink + "&~agency_id=730316834393313593";
                }
            }

            if (typeof MMP !== "undefined" && MMP == "Adjust") {
                if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {

                    if (typeof parts_af.redirect !== 'undefined' && parts_af.redirect !== "") {

                        const search_br_n = "&redirect=" + encodeURIComponent(parts_af.redirect);
                        const search_replace_vta = { [search_br_n]: "" };
                        const regex = new RegExp("" + search_br_n + "", "g");
                        const removeAfdpFromVta = finalVtaLink.replace(regex, matched => search_replace_vta[matched]);

                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                        finalVtaLink = removeAfdpFromVta + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                    } else {
                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                        finalVtaLink = finalVtaLink + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                    }
                }
            }

            // add VTA link
            // Start=> Mobile Measurement Partner(MMP) - Appsflyer
            const impressionTrackingSettig = { "allowImp": 1, "enableVta": 1 }
            console.log('API Offer Impression tracker Update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/impression-tracking", impressionTrackingSettig, axios_header).then((helperImsT) => {
                if (typeof helperImsT.data.success !== 'undefined' && helperImsT.data.success == true) {
                    console.log('API Offer Impression tracker Update Response')
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });

            const campaignVTALink = { "iurl": finalVtaLink };
            console.log('API VTA MAIN Link Update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignVTALink, axios_header).then(async (offVTARes) => {
                if (typeof offVTARes.data.success !== 'undefined' && offVTARes.data.success == true) {
                    console.log('API VTA MAIN Link Update Response');


                    // FindAll landing pages
                    await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", axios_header).then(async (getLp) => {
                        if (typeof getLp.statusText !== 'undefined' && getLp.statusText == "OK") {

                            for (let j = 0; j < getLp.data.landingPages.length; j++) {
                                let lp = getLp.data.landingPages[j];

                                const lpData = { "title": lp.title, "url": decodeHtml(lp.url), "status": lp.status, "lpType": lp.lpType, "visibility": lp.visibility, "iurl": finalVtaLink };
                                console.log('API Edit a Landing Page with VTA Request');
                                await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                    if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                        console.log('API Edit a Landing Page with VTA Response');
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }


                            var vta_link_main_link = vta_link_main;
                            var query_vta = require('url').parse(finalVTALinka, true).query;

                            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                                if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                                    if (typeof query_vta.af_r !== 'undefined' && query_vta.af_r !== "") {
                                        const search_br_n = "&af_r=" + encodeURIComponent(query_vta.af_r);
                                        const search_replace_vta = { [search_br_n]: "" };
                                        const regex = new RegExp("" + search_br_n + "", "g");
                                        const removeAfdpFromVta = vta_link_main.replace(regex, matched => search_replace_vta[matched]);

                                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                        vta_link_main_link = removeAfdpFromVta + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                                    } else {
                                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                                        vta_link_main_link = vta_link_main + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                                    }
                                }
                            }

                            if (typeof MMP !== "undefined" && MMP == "Adjust") {
                                if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                                    if (typeof query_vta.redirect !== 'undefined' && query_vta.redirect !== "") {
                                        const search_br_n = "&redirect=" + encodeURIComponent(query_vta.redirect);
                                        const search_replace_vta = { [search_br_n]: "" };
                                        const regex = new RegExp("" + search_br_n + "", "g");
                                        const removeAfdpFromVta = vta_link_main.replace(regex, matched => search_replace_vta[matched]);

                                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                        vta_link_main_link = removeAfdpFromVta + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                                    } else {
                                        const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                                        vta_link_main_link = vta_link_main + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                                    }
                                }
                            }

                            var vta_link_basic_link = "";
                            if (typeof MMP !== "undefined" && MMP == "Branch") {
                                const parts_br_n = require('url').parse(normalURL, true).query;
                                if (parts_br_n['~agency_id']) {
                                    vta_link_basic_link = vta_link;
                                } else {
                                    vta_link_basic_link = vta_link + "&~agency_id=730316834393313593";
                                }
                            } else {
                                vta_link_basic_link = vta_link;
                            }

                            Offer.findOneAndUpdate({ _id }, { vta_link_basic: vta_link_basic_link, vta_link: vta_link_main_link }, { new: true }).exec().then(async (updateRes) => {
                                console.log('DB LP VTA Update Request');
                                if (updateRes) {
                                    console.log('DB LP VTA Update Reponse');

                                    // SENDING MAIL TO EDIT CTA LINK
                                    const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(trackier_adv_id),
                                        advertiser_name: ucfirst(advName.advertiserName),
                                        company_name: ucfirst(advName.advName),
                                        offer_id: trackier_camp_id,
                                        offer_name: ucfirst(offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Offer ' + offer_name + ' has been edited',
                                        message_adv: "<span class='text_primary'>VTA Link</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                        subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                        message_sa: "<span class='text_primary'>VTA Link</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    // INSERT DATA INTO Tileline
                                    const timelineData = {
                                        advertiser_id: parseInt(trackier_adv_id),
                                        advertiser_name: ucfirst(advName.advertiserName),
                                        offer_id: trackier_camp_id,
                                        offer_name: ucfirst(offer_name),
                                        type: "VTA Link",
                                        old_value: differencesOld.vta_link,
                                        new_value: differencesReq.vta_link,
                                        edited_by: user_name
                                    }
                                    // END INSERT DATA INTO Tileline
                                    await addTimelineData(timelineData);

                                    if (advName.email_preferences == true) {
                                        // Send Mail to Admin if status inactive/suspended
                                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                                        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                        const messageBodyAdvetiser = (templateAdvertiser({
                                            todayDate: dateprint(),
                                            adv_id: trackier_adv_id,
                                            offer_id: trackier_camp_id,
                                            offer_name: offer_name,
                                            adv_name: ucwords(advName.advName),
                                            advertiserName: ucwords(advName.advertiserName),
                                            edit_filed: "VTA Link",
                                            old_value: differencesOld.vta_link,
                                            new_value: differencesReq.vta_link,
                                            edited_by: user_name,
                                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                            base_url: process.env.APPLABS_URL
                                        }))
                                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                        const msgAdvertiser = {
                                            to: advName.email,
                                            //to: 'sudish@applabs.ai',
                                            from: {
                                                name: process.env.MAIL_FROM_NAME,
                                                email: process.env.MAIL_FROM_EMAIL,
                                            },
                                            bcc: bcc_mail,
                                            subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                            html: messageBodyAdvetiser
                                        };
                                        //ES6
                                        sgMail.send(msgAdvertiser).then(() => { }, error => {
                                            console.error(error);
                                            if (error.response) {
                                                console.error(error.response.body)
                                            }
                                        }).catch((error) => {
                                            const response = { 'success': false, 'message': error };
                                            res.status(200).send(response);
                                            return;
                                        });
                                    }

                                    // Send Mail to Admin
                                    const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                    const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                    const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                    const messageBodyAdmin = (templateAdmin({
                                        todayDate: dateprint(),
                                        adv_id: trackier_adv_id,
                                        offer_id: trackier_camp_id,
                                        offer_name: offer_name,
                                        adv_name: ucwords(advName.advName),
                                        advertiserName: ucwords(advName.advertiserName),
                                        edit_filed: "VTA Link",
                                        old_value: differencesOld.vta_link,
                                        new_value: differencesReq.vta_link,
                                        edited_by: user_name,
                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdmin = {
                                        to: admin_mail,
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        //bcc: bcc_mail,
                                        subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                        html: messageBodyAdmin
                                    };
                                    //ES6
                                    sgMail.send(msgAdmin).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        console.error(response);
                                    });
                                    // End Send Mail to Admin
                                }
                            }).catch((error) => {
                                console.log(error)
                                const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                                res.status(400).send(resMsg);
                                return;
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });
        } else {

            // add VTA link
            // Start=> Mobile Measurement Partner(MMP) - Appsflyer
            const impressionTrackingSettig = { "allowImp": 1, "enableVta": 1 }
            console.log('API Offer Impression tracker Update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/impression-tracking", impressionTrackingSettig, axios_header).then((helperImsT) => {
                if (typeof helperImsT.data.success !== 'undefined' && helperImsT.data.success == true) {
                    console.log('API Offer Impression tracker Update Response')
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });

            var campaignRevenue = 0;
            if (typeof payable_event_price !== 'undefined' && payable_event_price > 0) {
                var campaignRevenue = payable_event_price;
            }

            // console.log(osVersionMins);
            if (typeof MMP !== 'undefined' && MMP == "Appsflyer") {

                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    // Remove &af_dp= form VTA link
                    const query_dp = require('url').parse(vta_link, true).query;
                    if (typeof query_dp.af_dp !== 'undefined' && query_dp.af_dp !== "") {
                        var removeAfdpFromVta = vta_link.replace("&af_dp=" + query_dp.af_dp, "");
                    } else {
                        var removeAfdpFromVta = vta_link;
                    }

                    if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                        const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                        var VTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1&af_r=" + encodeURIComponent(decodeRedirectUrl);
                    } else {
                        var VTAMacro = "&af_sub1={publisher_id}&af_sub2={source}&af_sub3={app_name}&af_sub4={camp_id}&af_sub5={publisher_id}&af_sub6={creative_name}&af_additionalpostback=1";
                    }

                    var vtaLink = removeAfdpFromVta + VTAMacro;

                    const query_agid = require('url').parse(vta_link, true).query;
                    var afAdId = "&af_ad_id=";

                    if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                        afAdId += "{publisher_id}_";
                    }
                    if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                        afAdId += "{source}_";
                    }

                    if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                        afAdId += "{app_name}_";
                    }

                    if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                        afAdId += "{camp_id}_";
                    }

                    if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                        afAdId += "{publisher_id}_";
                    }

                    if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                        afAdId += "{creative_name}_";
                    }

                    // Start Encode ~agency_id URL
                    if (typeof query_agid['af_sub1'] !== 'undefined' && query_agid['af_sub1'] !== "") {
                        const search_replace = { '&af_sub1={publisher_id}': "" };
                        vtaLink = vtaLink.replace(/&af_sub1={publisher_id}/g, matched => search_replace[matched]);
                    }
                    if (typeof query_agid['af_sub2'] !== 'undefined' && query_agid['af_sub2'] !== "") {
                        const search_replace = { '&af_sub2={source}': "" };
                        vtaLink = vtaLink.replace(/&af_sub2={source}/g, matched => search_replace[matched]);
                    }
                    if (typeof query_agid['af_sub3'] !== 'undefined' && query_agid['af_sub3'] !== "") {
                        const search_replace = { '&af_sub3={app_name}': "" };
                        vtaLink = vtaLink.replace(/&af_sub3={app_name}/g, matched => search_replace[matched]);
                    }
                    if (typeof query_agid['af_sub4'] !== 'undefined' && query_agid['af_sub4'] !== "") {
                        const search_replace = { '&af_sub4={camp_id}': "" };
                        vtaLink = vtaLink.replace(/&af_sub4={camp_id}/g, matched => search_replace[matched]);
                    }
                    if (typeof query_agid['af_sub5'] !== 'undefined' && query_agid['af_sub5'] !== "") {
                        const search_replace = { '&af_sub5={publisher_id}': "" };
                        vtaLink = vtaLink.replace(/&af_sub5={publisher_id}/g, matched => search_replace[matched]);
                    }
                    if (typeof query_agid['af_sub6'] !== 'undefined' && query_agid['af_sub6'] !== "") {
                        const search_replace = { '&af_sub6={creative_name}': "" };
                        vtaLink = vtaLink.replace(/&af_sub6={creative_name}/g, matched => search_replace[matched]);
                    }
                    if (afAdId !== "&af_ad_id=") {
                        vtaLink = vtaLink + afAdId.replace(/_+$/, '');
                    } else {
                        vtaLink = vtaLink;
                    }

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '__DEEPLINK__': "", '__COST__': campaignRevenue, '__CURRENCY__': 'USD', '=channel': '=AL-{publisher_id}', '{click_id}': '{imp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}|__DEEPLINK__|__COST__|__CURRENCY__|USD|=channel|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    // console.log('null');
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
                // Start=> Mobile Measurement Partner(MMP) - Branch
            } else if (typeof MMP !== 'undefined' && MMP == "Branch") {

                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    // Start Encode ~agency_id URL
                    const query_agid_vta = require('url').parse(vta_link, true).query;
                    // check ~agencyId
                    if ("~agency_id" in query_agid_vta) {
                        var VTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    } else {
                        var VTAMacro = "&~ad_set_id={publisher_id}&~campaign_id={camp_id}&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&~agency_id=730316834393313593";
                    }
                    const vtaLink = vta_link + VTAMacro;
                    // End Encode ~agency_id URL
                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '={channel_id}': '=AL-{publisher_id}', '{click_id}': '{imp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}|={channel_id}|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
                // Start=> Mobile Measurement Partner(MMP) - Adjust
            } else if (typeof MMP !== 'undefined' && MMP == "Adjust") {

                var event_postback = "";
                if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPA') {

                    if (Array.isArray(goal_budget) && goal_budget.length) {
                        //console.log(goal_budget);
                        // goal_budget.forEach(function callback(value, index) {
                        for (let i = 0; i < goal_budget.length; i++) {
                            let value = goal_budget[i];
                            if (value.non_payable_event_token) {
                                event_postback += "&event_callback_" + value.non_payable_event_token + "=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}%26goal_value%3D" + value.non_payable_event_name + "";
                            }
                            // });
                        }
                    }
                }


                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    var VTAReplaceClick_id = vta_link.replace("{click_id}", "{imp_id}");

                    if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                        const decodeRedirectVTAUrl = decodeURIComponent(cta_redirect_link);
                        var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback + "&redirect=" + encodeURIComponent(decodeRedirectVTAUrl);
                    } else {
                        var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}&install_callback=https%3A%2F%2Fpost.clickscot.com%2Facquisition%3Fclick_id%3D{click_id}%26security_token%3D36399a458c8980278778%26gaid%3D{gaid}%26idfa%3D{idfa}" + event_postback;
                    }
                    const vtaLink = VTAReplaceClick_id + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            } else if (typeof MMP !== 'undefined' && MMP == "Kochava") {

                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    const vtaLink = vta_link + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            } else if (typeof MMP !== 'undefined' && MMP == "Appmetrica") {

                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    const vtaLink = vta_link + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            } else if (typeof MMP !== 'undefined' && MMP == "Singular") {

                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    const vtaLink = vta_link + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' };
                    var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            } else if (typeof MMP !== 'undefined' && MMP == "MyTracker") {
                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    const vtaLink = vta_link + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' }
                    var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            } else {
                if (typeof vta_link !== 'undefined' && vta_link !== "") {
                    // VTA LINK
                    var VTAMacro = "&ex_sub1={publisher_id}&ex_sub2={source}&ex_sub3={app_name}&ex_sub4={camp_id}&ex_sub5={publisher_id}&ex_sub6={creative_name}";
                    const vtaLink = vta_link + VTAMacro;

                    const search_replace_vta = { '{placement_id}': 'AL_1{publisher_id}8_{camp_id}', '{click_id}': '{imp_id}' }

                    var finalVtaLink = vtaLink.replace(/{placement_id}|{click_id}/g, matched => search_replace_vta[matched]);
                } else {
                    var VTAMacro = "";
                    var finalVtaLink = "";
                }
            }

            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                if (typeof af_redirect_link !== 'undefined' && af_redirect_link !== "") {
                    const decodeRedirectUrl = decodeURIComponent(af_redirect_link);
                    finalVtaLink = finalVtaLink + "&af_r=" + encodeURIComponent(decodeRedirectUrl);
                }
            }

            if (typeof MMP !== "undefined" && MMP == "Appsflyer") {
                if (typeof cta_redirect_link !== 'undefined' && cta_redirect_link !== "") {
                    const decodeRedirectUrl = decodeURIComponent(cta_redirect_link);
                    finalVtaLink = finalVtaLink + "&redirect=" + encodeURIComponent(decodeRedirectUrl);
                }
            }

            const campaignVTALink = { "iurl": finalVtaLink };
            console.log('API VTA MAIN Link Update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignVTALink, axios_header).then(async (offVTARes) => {
                if (typeof offVTARes.data.success !== 'undefined' && offVTARes.data.success == true) {
                    console.log('API VTA MAIN Link Update Response');

                    // FindAll landing pages
                    await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", axios_header).then(async (getLp) => {
                        if (typeof getLp.statusText !== 'undefined' && getLp.statusText == "OK") {

                            for (let j = 0; j < getLp.data.landingPages.length; j++) {
                                let lp = getLp.data.landingPages[j];

                                const lpData = { "title": lp.title, "url": decodeHtml(lp.url), "status": lp.status, "lpType": lp.lpType, "visibility": lp.visibility, "iurl": finalVtaLink };
                                console.log('API Edit a Landing Page with VTA Request');
                                await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                    if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                        console.log('API Edit a Landing Page with VTA Response');
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }

                            Offer.findOneAndUpdate({ _id }, { vta_link_basic: vta_link, vta_link: VTAMacro }, { new: true }).exec().then(async (updateRes) => {
                                console.log('DB LP VTA Update Request');
                                if (updateRes) {
                                    console.log('DB LP VTA Update Reponse');

                                    // SENDING MAIL TO EDIT CTA LINK
                                    const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(trackier_adv_id),
                                        advertiser_name: ucfirst(advName.advertiserName),
                                        company_name: ucfirst(advName.advName),
                                        offer_id: trackier_camp_id,
                                        offer_name: ucfirst(offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Offer ' + offer_name + ' has been edited',
                                        message_adv: "<span class='text_primary'>VTA Link</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                        subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                        message_sa: "<span class='text_primary'>VTA Link</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                        read: 0,
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    if (advName.email_preferences == true) {
                                        // Send Mail to Admin if status inactive/suspended
                                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                                        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                        const messageBodyAdvetiser = (templateAdvertiser({
                                            todayDate: dateprint(),
                                            adv_id: trackier_adv_id,
                                            offer_id: trackier_camp_id,
                                            offer_name: offer_name,
                                            adv_name: ucwords(advName.advName),
                                            advertiserName: ucwords(advName.advertiserName),
                                            edit_filed: "VTA Link",
                                            old_value: differencesOld.vta_link,
                                            new_value: differencesReq.vta_link,
                                            edited_by: user_name,
                                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                            base_url: process.env.APPLABS_URL
                                        }))
                                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                        const msgAdvertiser = {
                                            to: advName.email,
                                            // to: 'sudish@applabs.ai',
                                            from: {
                                                name: process.env.MAIL_FROM_NAME,
                                                email: process.env.MAIL_FROM_EMAIL,
                                            },
                                            bcc: bcc_mail,
                                            subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                            html: messageBodyAdvetiser
                                        };
                                        //ES6
                                        sgMail.send(msgAdvertiser).then(() => { }, error => {
                                            console.error(error);
                                            if (error.response) {
                                                console.error(error.response.body)
                                            }
                                        }).catch((error) => {
                                            const response = { 'success': false, 'message': error };
                                            res.status(200).send(response);
                                            return;
                                        });
                                    }

                                    // Send Mail to Admin
                                    const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                    const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                    const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                    const messageBodyAdmin = (templateAdmin({
                                        todayDate: dateprint(),
                                        adv_id: trackier_adv_id,
                                        offer_id: trackier_camp_id,
                                        offer_name: offer_name,
                                        adv_name: ucwords(advName.advName),
                                        advertiserName: ucwords(advName.advertiserName),
                                        edit_filed: "VTA Link",
                                        old_value: differencesOld.vta_link,
                                        new_value: differencesReq.vta_link,
                                        edited_by: user_name,
                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdmin = {
                                        to: admin_mail,
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        //bcc: bcc_mail,
                                        subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                        html: messageBodyAdmin
                                    };
                                    //ES6
                                    sgMail.send(msgAdmin).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        console.error(response);
                                    });
                                    // End Send Mail to Admin
                                }
                            }).catch((error) => {
                                console.log(error)
                                const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                                res.status(400).send(resMsg);
                                return;
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });
        } // CHECK VTA LINK FIRST EMPTY
    }  // UPDATE VTA LINK END


    // OFFER TOTAL BUDGET UPDATE
    if (typeof differencesReq.total_budget !== 'undefined' && differencesReq.total_budget !== "") {

        // get campaign caps
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", axios_header).then(async (getCaps) => {
            if (typeof getCaps.statusText !== 'undefined' && getCaps.statusText == "OK") {

                if (typeof getCaps.data.caps[0]._id !== 'undefined' && getCaps.data.caps[0]._id !== "") {

                    const capsId = getCaps.data.caps[0]._id;
                    const daily = getCaps.data.caps[0].daily;

                    const campaignCaps = { "daily": parseFloat(daily), "lifetime": parseFloat(total_budget) };
                    // Update caps
                    console.log('API Total Budget Update Request');
                    await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps/" + capsId, campaignCaps, axios_header).then((totBudgetRes) => {
                        if (typeof totBudgetRes.data.success !== 'undefined' && totBudgetRes.data.success == true) {
                            console.log('API Total Budget Update Response');
                            // Update total budget in our Collection
                            Offer.findOneAndUpdate({ _id }, { total_budget: total_budget }, { new: true }).exec().then(async (resTotBudget) => {
                                console.log('Total Budget Update Request');
                                if (resTotBudget) {
                                    console.log('Total Budget Update Response');

                                    const oldTotalBudget = offData.total_budget;
                                    const currBalance = await getAdvertiserBalByAdvId(trackier_adv_id);
                                    // Update balance while campaign create subtraction  form total advertiser balance
                                    var updatedBalance = 0;
                                    if (parseFloat(total_budget) > parseFloat(oldTotalBudget)) {
                                        const oldValue = (parseFloat(total_budget) - parseFloat(oldTotalBudget));
                                        updatedBalance = (parseFloat(currBalance) - parseFloat(oldValue));
                                    } else {
                                        const oldValue = (parseFloat(oldTotalBudget) - parseFloat(total_budget));
                                        updatedBalance = (parseFloat(currBalance) + parseFloat(oldValue));
                                    }

                                    Advertiser.findOneAndUpdate({ tid: parseInt(trackier_adv_id) }, { balance: updatedBalance }, { new: true }).exec().then(async (resAdvBal) => {
                                        console.log('Advertiser Balance Update Request');
                                        if (resAdvBal) {
                                            console.log('Advertiser Balance Update Response');

                                            // Send Mail to User
                                            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                            // INSERT DATA INTO NOTIFICATIONS
                                            const notificationData = {
                                                advertiser_id: parseInt(trackier_adv_id),
                                                advertiser_name: ucfirst(advName.advertiserName),
                                                company_name: ucfirst(advName.advName),
                                                offer_id: trackier_camp_id,
                                                offer_name: ucfirst(offer_name),
                                                category: "Campaign",

                                                subject_adv: 'Offer ' + offer_name + ' has been edited',
                                                message_adv: "<span class='text_primary'>Total Budget</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                                subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                                message_sa: "<span class='text_primary'>Total Budget</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",
                                                read: 0
                                            }
                                            // END INSERT DATA INTO NOTIFICATIONS
                                            await addNotificationsData(notificationData);
                                            // INSERT DATA INTO Tileline
                                            const timelineData = {
                                                advertiser_id: parseInt(trackier_adv_id),
                                                advertiser_name: ucfirst(advName.advertiserName),
                                                offer_id: trackier_camp_id,
                                                offer_name: ucfirst(offer_name),
                                                type: "Total Budget",
                                                old_value: differencesOld.total_budget,
                                                new_value: differencesReq.total_budget,
                                                edited_by: user_name
                                            }
                                            // END INSERT DATA INTO Tileline
                                            await addTimelineData(timelineData);


                                            if (advName.email_preferences == true) {
                                                // Send Mail to Admin if status inactive/suspended
                                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                                const messageBodyAdvetiser = (templateAdvertiser({
                                                    todayDate: dateprint(),
                                                    adv_id: trackier_adv_id,
                                                    offer_id: trackier_camp_id,
                                                    offer_name: offer_name,
                                                    adv_name: ucwords(advName.advName),
                                                    advertiserName: ucwords(advName.advertiserName),
                                                    edit_filed: "Total Budget",
                                                    old_value: differencesOld.total_budget,
                                                    new_value: differencesReq.total_budget,
                                                    edited_by: user_name,
                                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                    base_url: process.env.APPLABS_URL
                                                }))
                                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                const msgAdvertiser = {
                                                    to: advName.email,
                                                    //to: 'sudish@applabs.ai',
                                                    from: {
                                                        name: process.env.MAIL_FROM_NAME,
                                                        email: process.env.MAIL_FROM_EMAIL,
                                                    },
                                                    bcc: bcc_mail,
                                                    subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                                    html: messageBodyAdvetiser
                                                };
                                                //ES6
                                                sgMail.send(msgAdvertiser).then(() => { }, error => {
                                                    console.error(error);
                                                    if (error.response) {
                                                        console.error(error.response.body)
                                                    }
                                                }).catch((error) => {
                                                    const response = { 'success': false, 'message': error };
                                                    res.status(200).send(response);
                                                    return;
                                                });
                                            }

                                            // Send Mail to Admin
                                            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                            const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                            const messageBodyAdmin = (templateAdmin({
                                                todayDate: dateprint(),
                                                adv_id: trackier_adv_id,
                                                offer_id: trackier_camp_id,
                                                offer_name: offer_name,
                                                adv_name: ucwords(advName.advName),
                                                advertiserName: ucwords(advName.advertiserName),
                                                edit_filed: "Total Budget",
                                                old_value: differencesOld.total_budget,
                                                new_value: differencesReq.total_budget,
                                                edited_by: user_name,
                                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                base_url: process.env.APPLABS_URL
                                            }))
                                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                            const msgAdmin = {
                                                to: admin_mail,
                                                from: {
                                                    name: process.env.MAIL_FROM_NAME,
                                                    email: process.env.MAIL_FROM_EMAIL,
                                                },
                                                //bcc: bcc_mail,
                                                subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                                html: messageBodyAdmin
                                            };
                                            //ES6
                                            sgMail.send(msgAdmin).then(() => { }, error => {
                                                console.error(error);
                                                if (error.response) {
                                                    console.error(error.response.body)
                                                }
                                            }).catch((error) => {
                                                const response = { 'success': false, 'message': error };
                                                console.error(response);
                                            });
                                            // End Send Mail to Admin

                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch((error) => {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                                        res.status(400).send(resMsg);
                                        return;
                                    });
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch((error) => {
                                console.error(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }
                    }).catch(err => {
                        console.error(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // OFFER TOTAL BUDGET UPDATE
    if (typeof differencesReq.daily_budget !== 'undefined' && differencesReq.daily_budget !== "") {

        // get campaign caps
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps", axios_header).then(async (getCaps) => {
            if (typeof getCaps.statusText !== 'undefined' && getCaps.statusText == "OK") {

                if (typeof getCaps.data.caps[0]._id !== 'undefined' && getCaps.data.caps[0]._id !== "") {

                    const capsId = getCaps.data.caps[0]._id;
                    const lifetime = getCaps.data.caps[0].lifetime;

                    const campaignCaps = { "daily": parseFloat(daily_budget), "lifetime": parseFloat(lifetime) };
                    // Update caps
                    console.log('API Daily Budget Update Request');
                    await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/caps/" + capsId, campaignCaps, axios_header).then((dailyBudgetRes) => {
                        if (typeof dailyBudgetRes.data.success !== 'undefined' && dailyBudgetRes.data.success == true) {
                            console.log('API Daily Budget Update Response');
                            // Update total budget in our Collection
                            Offer.findOneAndUpdate({ _id }, { daily_budget: daily_budget }, { new: true }).exec().then(async (resDailyBudget) => {
                                console.log('Daily Budget Update Request');
                                if (resDailyBudget) {
                                    console.log('Daily Budget Update Response');

                                    // Send Mail to User
                                    const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                    // INSERT DATA INTO NOTIFICATIONS
                                    const notificationData = {
                                        advertiser_id: parseInt(trackier_adv_id),
                                        advertiser_name: ucfirst(advName.advertiserName),
                                        company_name: ucfirst(advName.advName),
                                        offer_id: trackier_camp_id,
                                        offer_name: ucfirst(offer_name),
                                        category: "Campaign",

                                        subject_adv: 'Offer ' + offer_name + ' has been edited',
                                        message_adv: "<span class='text_primary'>Daily Budget</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                        subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                        message_sa: "<span class='text_primary'>Daily Budget</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                        read: 0
                                    }
                                    // END INSERT DATA INTO NOTIFICATIONS
                                    await addNotificationsData(notificationData);

                                    // INSERT DATA INTO Tileline
                                    const timelineData = {
                                        advertiser_id: parseInt(trackier_adv_id),
                                        advertiser_name: ucfirst(advName.advertiserName),
                                        offer_id: trackier_camp_id,
                                        offer_name: ucfirst(offer_name),
                                        type: "Daily Budget",
                                        old_value: differencesOld.daily_budget,
                                        new_value: differencesReq.daily_budget,
                                        edited_by: user_name
                                    }
                                    // END INSERT DATA INTO Tileline
                                    await addTimelineData(timelineData);

                                    if (advName.email_preferences == true) {
                                        // Send Mail to Admin if status inactive/suspended
                                        const bcc_mail = process.env.BCC_EMAILS.split(",");
                                        var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                        const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                        const messageBodyAdvetiser = (templateAdvertiser({
                                            todayDate: dateprint(),
                                            adv_id: trackier_adv_id,
                                            offer_id: trackier_camp_id,
                                            offer_name: offer_name,
                                            adv_name: ucwords(advName.advName),
                                            advertiserName: ucwords(advName.advertiserName),
                                            edit_filed: "Daily Budget",
                                            old_value: differencesOld.daily_budget,
                                            new_value: differencesReq.daily_budget,
                                            edited_by: user_name,
                                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                            base_url: process.env.APPLABS_URL
                                        }))
                                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                        const msgAdvertiser = {
                                            to: advName.email,
                                            //to: 'sudish@applabs.ai',
                                            from: {
                                                name: process.env.MAIL_FROM_NAME,
                                                email: process.env.MAIL_FROM_EMAIL,
                                            },
                                            bcc: bcc_mail,
                                            subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                            html: messageBodyAdvetiser
                                        };
                                        //ES6
                                        sgMail.send(msgAdvertiser).then(() => { }, error => {
                                            console.error(error);
                                            if (error.response) {
                                                console.error(error.response.body)
                                            }
                                        }).catch((error) => {
                                            const response = { 'success': false, 'message': error };
                                            res.status(200).send(response);
                                            return;
                                        });
                                    }
                                    // Send Mail to Admin
                                    const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                    const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                    const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                    const messageBodyAdmin = (templateAdmin({
                                        todayDate: dateprint(),
                                        adv_id: trackier_adv_id,
                                        offer_id: trackier_camp_id,
                                        offer_name: offer_name,
                                        adv_name: ucwords(advName.advName),
                                        advertiserName: ucwords(advName.advertiserName),
                                        edit_filed: "Daily Budget",
                                        old_value: differencesOld.daily_budget,
                                        new_value: differencesReq.daily_budget,
                                        edited_by: user_name,
                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdmin = {
                                        to: admin_mail,
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        //bcc: bcc_mail,
                                        subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                        html: messageBodyAdmin
                                    };
                                    //ES6
                                    sgMail.send(msgAdmin).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        console.error(response);
                                    });
                                    // End Send Mail to Admin
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch((error) => {
                                console.log(error);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }
                    }).catch(err => {
                        console.error(err);
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // SCHEDULE START DATE UPDATE
    if (typeof differencesReq.schedule_start_date !== 'undefined' && differencesReq.schedule_start_date !== "") {

        const now = new Date();
        currentHours = ("0" + now.getHours()).slice(-2);
        currentMinutes = ("0" + now.getMinutes()).slice(-2);
        currentSeconds = ("0" + now.getSeconds()).slice(-2);
        const time_24 = [currentHours, ':', currentMinutes, ':', currentSeconds].join('');

        const dt_start = schedule_start_date;
        const datearray = dt_start.split("/");
        const startDate = `${datearray[2]}-${datearray[1]}-${datearray[0]}T${time_24}`;

        // Update Schedule Start Data
        const campaignStartDate = { "startTime": startDate };
        // Update start date
        console.log('API Start Date update Request');
        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignStartDate, axios_header).then((resSDate) => {
            if (typeof resSDate.data.success !== 'undefined' && resSDate.data.success == true) {
                console.log('API Start Date update Response');
                // Update Schedule start date in our Collection
                Offer.findOneAndUpdate({ _id }, { schedule_start_date: schedule_start_date }, { new: true }).exec().then(async (resStartDate) => {
                    console.log('Start Date Update Request');
                    if (resStartDate) {
                        console.log('Start Date Update Response');

                        // Send Mail to User
                        const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));


                        // INSERT DATA INTO NOTIFICATIONS
                        const notificationData = {
                            advertiser_id: parseInt(trackier_adv_id),
                            advertiser_name: ucfirst(advName.advertiserName),
                            company_name: ucfirst(advName.advName),
                            offer_id: trackier_camp_id,
                            offer_name: ucfirst(offer_name),
                            category: "Campaign",

                            subject_adv: 'Offer ' + offer_name + ' has been edited',
                            message_adv: "<span class='text_primary'>Start Date</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                            subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                            message_sa: "<span class='text_primary'>Start Date</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                            read: 0
                        }
                        // END INSERT DATA INTO NOTIFICATIONS
                        await addNotificationsData(notificationData);

                        // INSERT DATA INTO Tileline
                        const timelineData = {
                            advertiser_id: parseInt(trackier_adv_id),
                            advertiser_name: ucfirst(advName.advertiserName),
                            offer_id: trackier_camp_id,
                            offer_name: ucfirst(offer_name),
                            type: "Start Date",
                            old_value: differencesOld.schedule_start_date,
                            new_value: differencesReq.schedule_start_date,
                            edited_by: user_name
                        }
                        // END INSERT DATA INTO Tileline
                        await addTimelineData(timelineData);


                        if (advName.email_preferences == true) {
                            // Send Mail to Admin if status inactive/suspended
                            const bcc_mail = process.env.BCC_EMAILS.split(",");
                            var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                            const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                            const messageBodyAdvetiser = (templateAdvertiser({
                                todayDate: dateprint(),
                                adv_id: trackier_adv_id,
                                offer_id: trackier_camp_id,
                                offer_name: offer_name,
                                adv_name: ucwords(advName.advName),
                                advertiserName: ucwords(advName.advertiserName),
                                edit_filed: "Start Date",
                                old_value: differencesOld.schedule_start_date,
                                new_value: differencesReq.schedule_start_date,
                                edited_by: user_name,
                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                base_url: process.env.APPLABS_URL
                            }))
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                            const msgAdvertiser = {
                                to: advName.email,
                                //to: 'sudish@applabs.ai',
                                from: {
                                    name: process.env.MAIL_FROM_NAME,
                                    email: process.env.MAIL_FROM_EMAIL,
                                },
                                bcc: bcc_mail,
                                subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                html: messageBodyAdvetiser
                            };
                            //ES6
                            sgMail.send(msgAdvertiser).then(() => { }, error => {
                                console.error(error);
                                if (error.response) {
                                    console.error(error.response.body)
                                }
                            }).catch((error) => {
                                const response = { 'success': false, 'message': error };
                                res.status(200).send(response);
                                return;
                            });
                        }
                        // Send Mail to Admin
                        const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                        const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                        const templateAdmin = handlebars.compile(emailTemplateAdmin);
                        const messageBodyAdmin = (templateAdmin({
                            todayDate: dateprint(),
                            adv_id: trackier_adv_id,
                            offer_id: trackier_camp_id,
                            offer_name: offer_name,
                            adv_name: ucwords(advName.advName),
                            advertiserName: ucwords(advName.advertiserName),
                            edit_filed: "Start Date",
                            old_value: differencesOld.schedule_start_date,
                            new_value: differencesReq.schedule_start_date,
                            edited_by: user_name,
                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                            base_url: process.env.APPLABS_URL
                        }))
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        const msgAdmin = {
                            to: admin_mail,
                            from: {
                                name: process.env.MAIL_FROM_NAME,
                                email: process.env.MAIL_FROM_EMAIL,
                            },
                            //bcc: bcc_mail,
                            subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                            html: messageBodyAdmin
                        };
                        //ES6
                        sgMail.send(msgAdmin).then(() => { }, error => {
                            console.error(error);
                            if (error.response) {
                                console.error(error.response.body)
                            }
                        }).catch((error) => {
                            const response = { 'success': false, 'message': error };
                            console.error(response);
                        });
                        // End Send Mail to Admin
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch((error) => {
                    console.log(error);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // SCHEDULE END DATE UPDATE
    if (typeof differencesReq.schedule_end_date !== 'undefined' && differencesReq.schedule_end_date !== "") {

        if (typeof schedule_end_date !== 'undefined' && schedule_end_date == "disabled") {

            // Update Schedule End Data
            const campaignEndDate = { "endTime": "8601" };
            // Update End date
            console.log('API End Date update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignEndDate, axios_header).then((resEDate) => {
                if (typeof resEDate.data.success !== 'undefined' && resEDate.data.success == true) {
                    console.log('API End Date update Response');
                    // Update Schedule End date in our Collection
                    Offer.findOneAndUpdate({ _id }, { schedule_end_date: "" }, { new: true }).exec().then(async (resEndDate) => {
                        console.log('End Date Update Request');
                        if (resEndDate) {
                            console.log('End Date Update Response');

                            // Send Mail to User
                            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                            // INSERT DATA INTO NOTIFICATIONS
                            const notificationData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                company_name: ucfirst(advName.advName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                category: "Campaign",

                                subject_adv: 'Offer ' + offer_name + ' has been edited',
                                message_adv: "<span class='text_primary'>End Date</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                message_sa: "<span class='text_primary'>End Date</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                read: 0
                            }
                            // END INSERT DATA INTO NOTIFICATIONS
                            await addNotificationsData(notificationData);

                            // INSERT DATA INTO Tileline
                            const timelineData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                type: "End Date",
                                old_value: differencesOld.schedule_end_date,
                                new_value: differencesReq.schedule_end_date,
                                edited_by: user_name
                            }
                            // END INSERT DATA INTO Tileline
                            await addTimelineData(timelineData);

                            if (advName.email_preferences == true) {
                                // Send Mail to Admin if status inactive/suspended
                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                const messageBodyAdvetiser = (templateAdvertiser({
                                    todayDate: dateprint(),
                                    adv_id: trackier_adv_id,
                                    offer_id: trackier_camp_id,
                                    offer_name: offer_name,
                                    adv_name: ucwords(advName.advName),
                                    advertiserName: ucwords(advName.advertiserName),
                                    edit_filed: "End Date",
                                    old_value: differencesOld.schedule_end_date,
                                    new_value: differencesReq.schedule_end_date,
                                    edited_by: user_name,
                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdvertiser = {
                                    to: advName.email,
                                    //to: 'sudish@applabs.ai',
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    bcc: bcc_mail,
                                    subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                    html: messageBodyAdvetiser
                                };
                                //ES6
                                sgMail.send(msgAdvertiser).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    const response = { 'success': false, 'message': error };
                                    res.status(200).send(response);
                                    return;
                                });
                            }
                            // Send Mail to Admin
                            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                            const templateAdmin = handlebars.compile(emailTemplateAdmin);
                            const messageBodyAdmin = (templateAdmin({
                                todayDate: dateprint(),
                                adv_id: trackier_adv_id,
                                offer_id: trackier_camp_id,
                                offer_name: offer_name,
                                adv_name: ucwords(advName.advName),
                                advertiserName: ucwords(advName.advertiserName),
                                edit_filed: "End Date",
                                old_value: differencesOld.schedule_end_date,
                                new_value: differencesReq.schedule_end_date,
                                edited_by: user_name,
                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                base_url: process.env.APPLABS_URL
                            }))
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                            const msgAdmin = {
                                to: admin_mail,
                                from: {
                                    name: process.env.MAIL_FROM_NAME,
                                    email: process.env.MAIL_FROM_EMAIL,
                                },
                                //bcc: bcc_mail,
                                subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                html: messageBodyAdmin
                            };
                            //ES6
                            sgMail.send(msgAdmin).then(() => { }, error => {
                                console.error(error);
                                if (error.response) {
                                    console.error(error.response.body)
                                }
                            }).catch((error) => {
                                const response = { 'success': false, 'message': error };
                                console.error(response);
                            });
                            // End Send Mail to Admin
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    }).catch((error) => {
                        console.log(error);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });

        } else {

            const now = new Date();
            currentHours = ("0" + now.getHours()).slice(-2);
            currentMinutes = ("0" + now.getMinutes()).slice(-2);
            currentSeconds = ("0" + now.getSeconds()).slice(-2);
            const time_24 = [currentHours, ':', currentMinutes, ':', currentSeconds].join('');

            var endDate = "";
            const dt_end = schedule_end_date;
            const datearray_end = dt_end.split("/");
            var endDate = `${datearray_end[2]}-${datearray_end[1]}-${datearray_end[0]}T${time_24}`;


            // Update Schedule End Data
            const campaignEndDate = { "endTime": endDate };
            // Update End date
            console.log('API End Date update Request');
            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignEndDate, axios_header).then((resEDate) => {
                if (typeof resEDate.data.success !== 'undefined' && resEDate.data.success == true) {
                    console.log('API End Date update Response');
                    // Update Schedule End date in our Collection
                    Offer.findOneAndUpdate({ _id }, { schedule_end_date: schedule_end_date }, { new: true }).exec().then(async (resEndDate) => {
                        console.log('End Date Update Request');
                        if (resEndDate) {
                            console.log('End Date Update Response');

                            // Send Mail to User
                            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                            // INSERT DATA INTO NOTIFICATIONS
                            const notificationData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                company_name: ucfirst(advName.advName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                category: "Campaign",

                                subject_adv: 'Offer ' + offer_name + ' has been edited',
                                message_adv: "<span class='text_primary'>End Date</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                message_sa: "<span class='text_primary'>End Date</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                read: 0
                            }
                            // END INSERT DATA INTO NOTIFICATIONS
                            await addNotificationsData(notificationData);

                            // INSERT DATA INTO Tileline
                            const timelineData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                type: "End Date",
                                old_value: differencesOld.schedule_end_date,
                                new_value: differencesReq.schedule_end_date,
                                edited_by: user_name
                            }
                            // END INSERT DATA INTO Tileline
                            await addTimelineData(timelineData);


                            if (advName.email_preferences == true) {
                                // Send Mail to Admin if status inactive/suspended
                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                const messageBodyAdvetiser = (templateAdvertiser({
                                    todayDate: dateprint(),
                                    adv_id: trackier_adv_id,
                                    offer_id: trackier_camp_id,
                                    offer_name: offer_name,
                                    adv_name: ucwords(advName.advName),
                                    advertiserName: ucwords(advName.advertiserName),
                                    edit_filed: "End Date",
                                    old_value: differencesOld.schedule_end_date,
                                    new_value: differencesReq.schedule_end_date,
                                    edited_by: user_name,
                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdvertiser = {
                                    to: advName.email,
                                    //to: 'sudish@applabs.ai',
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    bcc: bcc_mail,
                                    subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                    html: messageBodyAdvetiser
                                };
                                //ES6
                                sgMail.send(msgAdvertiser).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    const response = { 'success': false, 'message': error };
                                    res.status(200).send(response);
                                    return;
                                });
                            }
                            // Send Mail to Admin
                            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                            const templateAdmin = handlebars.compile(emailTemplateAdmin);
                            const messageBodyAdmin = (templateAdmin({
                                todayDate: dateprint(),
                                adv_id: trackier_adv_id,
                                offer_id: trackier_camp_id,
                                offer_name: offer_name,
                                adv_name: ucwords(advName.advName),
                                advertiserName: ucwords(advName.advertiserName),
                                edit_filed: "End Date",
                                old_value: differencesOld.schedule_end_date,
                                new_value: differencesReq.schedule_end_date,
                                edited_by: user_name,
                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                base_url: process.env.APPLABS_URL
                            }))
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                            const msgAdmin = {
                                to: admin_mail,
                                from: {
                                    name: process.env.MAIL_FROM_NAME,
                                    email: process.env.MAIL_FROM_EMAIL,
                                },
                                //bcc: bcc_mail,
                                subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                html: messageBodyAdmin
                            };
                            //ES6
                            sgMail.send(msgAdmin).then(() => { }, error => {
                                console.error(error);
                                if (error.response) {
                                    console.error(error.response.body)
                                }
                            }).catch((error) => {
                                const response = { 'success': false, 'message': error };
                                console.error(response);
                            });
                            // End Send Mail to Admin
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    }).catch((error) => {
                        console.log(error);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });
        }

    }

    // LANGUAGE UPDATE
    if (typeof differencesReq.language !== 'undefined' && differencesReq.language !== "") {

        // APPS LIST UPDATE WHILE SDK
        const languageString = language.join(',');
        Offer.findOneAndUpdate({ _id }, { language: languageString }, { new: true }).exec().then(async (resOffer) => {
            console.log('Language Update Request');
            if (resOffer) {
                console.log('Language Update Response');

                // START push app lists on trackier
                if (typeof source_type !== 'undefined' && source_type == "SDK") {

                    // APPS LIST UPDATE WHILE SDK
                    if (operating_system == 'android') {
                        var os = "AOS";
                    } else {
                        var os = "IOS";
                    }
                    let app_lists = await appLists.find({ '$and': [{ 'Geo': { '$in': country } }, { "OS": os }, { 'Category': { '$in': interest } }, { 'Language': { '$in': language } },] }).sort({ _id: -1 });

                    var valid_fields = [];
                    for (let i = 0; i < app_lists.length; i++) {
                        let app = app_lists[i];
                        valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio);
                    }
                    var fionalAppList = [];
                    for (let j = 0; j < valid_fields.length; j++) {

                        let expIntApp = valid_fields[j].split("__");
                        for (let k = 0; k < parseInt(expIntApp[1]); k++) {
                            fionalAppList.push(expIntApp[0]);
                        }
                    }
                    shuffle(fionalAppList);
                    n = 1000;
                    var shuffled = fionalAppList.sort(function () { return 0.5 - Math.random() });
                    var randomlyPickedappList = shuffled.slice(0, n);
                    const appListData = { "appNames": randomlyPickedappList };

                    console.log('API APP list tracker Update Request');
                    await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/app-names", appListData, axios_header).then((appRes) => {
                        if (typeof appRes.data.success !== 'undefined' && appRes.data.success == true) {
                            console.log('API APP list tracker Update Response')
                        }
                    }).catch(err => {
                        console.error(err);
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });

                }


                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Language",
                        old_value: offData.language,
                        new_value: language,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Language",
                    old_value: offData.language,
                    new_value: language,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log(error);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // INTEREST UPDATE
    if (typeof differencesReq.interest !== 'undefined' && differencesReq.interest !== "") {

        // APPS LIST UPDATE WHILE SDK
        const interestString = interest.join(',');
        Offer.findOneAndUpdate({ _id }, { interest: interestString }, { new: true }).exec().then(async (resOffer) => {
            console.log('Interest Update Request');
            if (resOffer) {
                console.log('Interest Update Response');

                // START push app lists on trackier
                if (typeof source_type !== 'undefined' && source_type == "SDK") {

                    // APPS LIST UPDATE WHILE SDK
                    if (operating_system == 'android') {
                        var os = "AOS";
                    } else {
                        var os = "IOS";
                    }
                    let app_lists = await appLists.find({ '$and': [{ 'Geo': { '$in': country } }, { "OS": os }, { 'Category': { '$in': interest } }, { 'Language': { '$in': language } },] }).sort({ _id: -1 });

                    var valid_fields = [];
                    for (let i = 0; i < app_lists.length; i++) {
                        let app = app_lists[i];
                        valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio);
                    }
                    var fionalAppList = [];
                    for (let j = 0; j < valid_fields.length; j++) {

                        let expIntApp = valid_fields[j].split("__");
                        for (let k = 0; k < parseInt(expIntApp[1]); k++) {
                            fionalAppList.push(expIntApp[0]);
                        }
                    }
                    shuffle(fionalAppList);
                    n = 1000;
                    var shuffled = fionalAppList.sort(function () { return 0.5 - Math.random() });
                    var randomlyPickedappList = shuffled.slice(0, n);
                    const appListData = { "appNames": randomlyPickedappList };

                    console.log('API APP list tracker Update Request');
                    await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/app-names", appListData, axios_header).then((appRes) => {
                        if (typeof appRes.data.success !== 'undefined' && appRes.data.success == true) {
                            console.log('API APP list tracker Update Response')
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }


                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Interest",
                        old_value: offData.interest,
                        new_value: interest,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Interest",
                    old_value: offData.interest,
                    new_value: interest,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log(error);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // AGE GROUP UPDATE
    if (typeof differencesReq.age_group !== 'undefined' && differencesReq.age_group !== "") {

        // APPS LIST UPDATE WHILE SDK
        const age_groupString = age_group.join(',');
        Offer.findOneAndUpdate({ _id }, { age_group: age_groupString }, { new: true }).exec().then(async (resOffer) => {
            console.log('Age group String Update Request');
            if (resOffer) {
                console.log('Age group Update Response');

                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Age Group",
                        old_value: offData.age_group,
                        new_value: age_group,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Age Group",
                    old_value: offData.age_group,
                    new_value: age_group,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log(error);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    // AGE GROUP UPDATE
    if (typeof differencesReq.country !== 'undefined' && differencesReq.country !== "") {

        // FindAll Targetings
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings", axios_header).then(async (getTargetings) => {
            if (typeof getTargetings.statusText !== 'undefined' && getTargetings.statusText == "OK") {

                for (let j = 0; j < getTargetings.data.ruleblocks.length; j++) {
                    let rb = getTargetings.data.ruleblocks[j];

                    // FindAll Targetings Rules
                    await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id, axios_header).then(async (getTargetingsR) => {
                        if (typeof getTargetingsR.statusText !== 'undefined' && getTargetingsR.statusText == "OK") {

                            for (let k = 0; k < getTargetingsR.data.ruleblock.rules.length; k++) {
                                let rbr = getTargetingsR.data.ruleblock.rules[k];
                                if (typeof rbr.variable !== 'undefined' && rbr.variable == 'country') {

                                    // Targeting block rules objects
                                    const campaignTargeting = { "variable": "country", "logic": "allow", "condition": "contains", "values": country };
                                    console.log('API Country Targeting Rule Request');
                                    await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/targetings/" + rb._id + "/rules/" + rbr._id, campaignTargeting, axios_header).then((resRbr) => {
                                        if (typeof resRbr.data.success !== 'undefined' && resRbr.data.success == true) {
                                            console.log('API Country Targeting Rule Request Response');
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });
                                }
                            }
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });


        // START push app lists on trackier
        if (typeof source_type !== 'undefined' && source_type == "SDK") {

            // APPS LIST UPDATE WHILE SDK
            if (operating_system == 'android') {
                var os = "AOS";
            } else {
                var os = "IOS";
            }
            let app_lists = await appLists.find({ '$and': [{ 'Geo': { '$in': country } }, { "OS": os }, { 'Category': { '$in': interest } }, { 'Language': { '$in': language } },] }).sort({ _id: -1 });

            var valid_fields = [];
            for (let i = 0; i < app_lists.length; i++) {
                let app = app_lists[i];
                valid_fields.push(app.AppBundle + "__" + app.Insert_Ratio);
            }
            var fionalAppList = [];
            for (let j = 0; j < valid_fields.length; j++) {

                let expIntApp = valid_fields[j].split("__");
                for (let k = 0; k < parseInt(expIntApp[1]); k++) {
                    fionalAppList.push(expIntApp[0]);
                }
            }
            shuffle(fionalAppList);
            n = 1000;
            var shuffled = fionalAppList.sort(function () { return 0.5 - Math.random() });
            var randomlyPickedappList = shuffled.slice(0, n);
            const appListData = { "appNames": randomlyPickedappList };

            console.log('API APP list tracker Update Request');
            await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/app-names", appListData, axios_header).then((appRes) => {
                if (typeof appRes.data.success !== 'undefined' && appRes.data.success == true) {
                    console.log('API APP list tracker Update Response')
                }
            }).catch(err => {
                console.error(err);
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });
        }

        // get Campaign Publisher Payout Geo
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", axios_header).then(async (getDPayout) => {
            if (typeof getDPayout.statusText !== 'undefined' && getDPayout.statusText == "OK") {

                for (let k = 0; k < getDPayout.data.payouts.length; k++) {
                    let pubPay = getDPayout.data.payouts[k];

                    const publisherPayouts = pubPay.payout;
                    const publisherRevenue = pubPay.revenue;

                    if (Array.isArray(pubPay.pubIds) && pubPay.pubIds.length == 0) {
                        const payoutId = pubPay._id;
                        // Update publisher goals payout on trackier
                        const publisherPayoutGeo = { "payout": parseFloat(publisherPayouts), "revenue": parseFloat(publisherRevenue), "geo": country };
                        console.log('API Update publisher goals payout on trackier Request');
                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts/" + payoutId, publisherPayoutGeo, axios_header).then((payoutUpRes) => {
                            if (typeof payoutUpRes.data.success !== 'undefined' && payoutUpRes.data.success == true) {
                                console.log('API Update publisher goals payout on trackier Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch(err => {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        });
                    }
                }

                // Delete Previous publisher payout
                for (let l = 0; l < getDPayout.data.payouts.length; l++) {
                    let pubPayD = getDPayout.data.payouts[l];
                    if (Array.isArray(pubPayD.pubIds) && pubPayD.pubIds.length > 0) {
                        const payoutId = pubPayD._id;
                        // Delete Existing publisher payouts
                        console.log('API Delete existing publisher payouts on trackier Request');
                        console.log(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts/" + payoutId);
                        await axios.delete(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts/" + payoutId, axios_header).then((dtsPayout) => {
                            if (typeof dtsPayout.data.success !== 'undefined' && dtsPayout.data.success == true) {
                                console.log('API Delete existing publisher payouts on trackier Response');
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch(err => {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        });
                    }
                }

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.error(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });



        // Delete Previous sampling
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", axios_header).then(async (getDSampling) => {
            if (typeof getDSampling.statusText !== 'undefined' && getDSampling.statusText == "OK") {

                for (let q = 0; q < getDSampling.data.samplings.length; q++) {
                    let sapm = getDSampling.data.samplings[q];

                    const samplingId = sapm._id;
                    // Delete Existing sampling
                    console.log('API Delete existing sampling on trackier Request');
                    await axios.delete(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings/" + samplingId, axios_header).then((sampPayout) => {
                        if (typeof sampPayout.data.success !== 'undefined' && sampPayout.data.success == true) {
                            console.log('API Delete existing sampling on trackier Response');
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    }).catch(err => {
                        console.log(err);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.error(err);
            const errMsg = { "success": false, "errors": err.response.data.errors };
            res.status(400).send(errMsg);
            return;
        });

        // end ->  all publishers 
        var campaignRevenue = 0;
        if (typeof payable_event_price !== 'undefined' && payable_event_price > 0) {
            var campaignRevenue = payable_event_price;
        }
        // PAYOUT AND GOALS PUSH ON TRACKIER inthe case of goal and budget type "install"
        if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPI') {
            //===================PAYOUT AND GOALS============================ 
            if (Array.isArray(publishers) && publishers.length > 0) {
                for (let i = 0; i < publishers.length; i++) {
                    let pubDt = publishers[i];

                    for (const cTry of country) {
                        let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pubDt.pub_id), cTry);
                        if (pubPayoutDt) {
                            if (isNumeric(pubPayoutDt.pub_avg_po)) {
                                const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                const publisherGoalPayout = {
                                    "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                };

                                // STEP-8 Push publisher goals payout on trackier
                                await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                    console.log('Step8 Request');
                                    if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                        console.log('Step8 Response');

                                        const sampValue = (pub_avg_payout - (payable_event_price - (payable_event_price * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                        const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                        if (samplingMinVal > 0) {
                                            var samplingMinVals = samplingMinVal;
                                        } else {
                                            var samplingMinVals = 5;
                                        }
                                        // SET publisher samplings/CutBack
                                        const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };

                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                            console.log('Step9 Request');
                                            if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                console.log('Step9 Response');
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(err => {
                                            console.log(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }

                                }).catch(err => {
                                    //console.log(err);
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });

                            } else {
                                const pub_avg_payout = parseFloat(campaignRevenue);
                                const publisherGoalPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                // STEP-8 Push publisher goals payout on trackier
                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                    console.log('Step10 Request');
                                    if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                        console.log('Step10 Response');
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }
                        } else {
                            const pubPayblePayout = ((parseFloat(payable_event_price) * parseFloat(pubDt.revenue_share)) / 100);
                            const publisherGoalPayout = { "payout": parseFloat(pubPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubDt.pub_id)] };
                            // STEP-8 Push publisher goals payout on trackier
                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                console.log('Step11 Request');
                                if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                    console.log('Step11 Response');
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });

                            // SET publisher samplings/CutBack
                            const publisherSamplings = { "pubIds": [parseInt(pubDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                console.log('Step12 Request');
                                if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                    console.log('Step12 Response');
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }
                    }
                }
            }
        }

        //PAYOUT AND GOALS PUSH ON TRACKIER inthe case of goal and budget type "Engagement/Action"
        if (typeof goal_budget_type !== 'undefined' && goal_budget_type == 'CPA') {

            // Get all goals
            await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", axios_header).then(async (campGoals) => {
                if (typeof campGoals.statusText !== 'undefined' && campGoals.statusText == "OK") {
                    for (let q = 0; q < campGoals.data.goals.length; q++) {
                        let goalBudget = campGoals.data.goals[q];

                        const goalsId = goalBudget._id;
                        const title = goalBudget.title;
                        const value = goalBudget.value;
                        const type = goalBudget.type;
                        const payout = goalBudget.payouts[0].payout;
                        const revenue = goalBudget.payouts[0].revenue;
                        const payout_model = goalBudget.payouts[0].payout_model;

                        const campaignGoalsGeo = { "title": title, "value": value, "type": type, "payout_model": payout_model, "payouts": [{ "payout": parseFloat(payout), "revenue": parseFloat(revenue), "geo": country }] };
                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals/" + goalsId, campaignGoalsGeo, axios_header).then(async (cGoalRes) => {
                            console.log('Goals Edited Request');
                            if (typeof cGoalRes.data.success !== 'undefined' && cGoalRes.data.success == true) {
                                console.log('Goals Edited Response');


                                if (typeof goalBudget.payouts[0].revenue !== 'undefined' && parseFloat(goalBudget.payouts[0].revenue) > 0) {

                                    if (Array.isArray(publishers) && publishers.length > 0) {
                                        for (let i = 0; i < publishers.length; i++) {
                                            let pCheck = publishers[i];
                                            for (const cTry of country) {
                                                //let pubPayoutDt = await publisherPayout.findOne({ '$and': [{ 'pub_id': parseInt(pCheck.pub_id) }, { 'Geo': cTry }] });
                                                let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pCheck.pub_id), cTry);
                                                if (pubPayoutDt) {
                                                    if (isNumeric(pubPayoutDt.pub_avg_po)) {

                                                        // STEP-10 Push publisher goals payout on trackier
                                                        const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                                        const publisherPayout = {
                                                            "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                                        };

                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {

                                                            console.log('Step20 Request');
                                                            if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                console.log('Step20 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });

                                                        const sampValue = (pub_avg_payout - (goalBudget.payouts[0].revenue - (goalBudget.payouts[0].revenue * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                                        const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                                        if (samplingMinVal > 0) {
                                                            var samplingMinVals = samplingMinVal;
                                                        } else {
                                                            var samplingMinVals = 5;
                                                        }
                                                        // SET publisher samplings/CutBack
                                                        const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                            console.log('Step21 Request');
                                                            if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                console.log('Step21 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    } else {
                                                        const pub_avg_payout = parseFloat(goalBudget.payouts[0].revenue);
                                                        const publisherPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                                        // STEP-10 Push publisher goals payout on trackier\
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                            console.log('Step22 Request');
                                                            if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                console.log('Step22 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    }
                                                } else {
                                                    //let pubPayoutDtG = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                                    // let pubPayoutDtG = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                                    let pubPayoutDtG = await getpublisherPayoutArr();
                                                    if (pubPayoutDtG.hasOwnProperty(pCheck.pub_id)) {
                                                        const pubNonPayblePayout = ((parseFloat(goalBudget.payouts[0].revenue) * parseFloat(pCheck.revenue_share)) / 100);
                                                        const publisherPayout = { "payout": parseFloat(pubNonPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pCheck.pub_id)] };

                                                        // STEP-10 Push publisher goals payout on trackier
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                            console.log('Step23 Request');
                                                            if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                console.log('Step23 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    } else {
                                                        const pubNonPayblePayout = ((parseFloat(goalBudget.payouts[0].revenue) * parseFloat(pCheck.revenue_share)) / 100);
                                                        const publisherPayout = {
                                                            "payout": parseFloat(pubNonPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pCheck.pub_id)], "goalId": cGoalRes.data.goal._id
                                                        };

                                                        // STEP-10 Push publisher goals payout on trackier
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherPayout, axios_header).then((pubPubpayoutRes) => {
                                                            console.log('Step24 Request');
                                                            if (typeof pubPubpayoutRes.data.success !== 'undefined' && pubPubpayoutRes.data.success == true) {
                                                                console.log('Step24 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });

                                                    }

                                                    //let pubPayoutDtByCountry = await publisherPayout.findOne({ 'pub_id': parseInt(pCheck.pub_id) });
                                                    //let pubPayoutDtByCountry = await getpublisherPayoutByPubId(parseInt(pCheck.pub_id));
                                                    let pubPayoutDtByCountry = await getpublisherPayoutArr();
                                                    if (pubPayoutDtByCountry.hasOwnProperty(pCheck.pub_id)) {
                                                        // SET publisher samplings/CutBack
                                                        const publisherSamplings = { "pubIds": [parseInt(pCheck.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                            console.log('Step25 Request');
                                                            if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                console.log('Step25 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });

                                                    } else {
                                                        // SET publisher samplings/CutBack
                                                        const publisherSamplings = { "pubIds": [parseInt(pCheck.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "goalId": cGoalRes.data.goal._id, "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };

                                                        axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                            console.log('Step26 Request');
                                                            if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                                console.log('Step26 Response');
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch(err => {
                            console.log(err);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        });
                    }
                } else {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });



            // PYABALE EVENT PRICE IS GREATER THAN 0
            if (typeof payable_event_price !== 'undefined' && parseFloat(payable_event_price) > 0) {
                //===================PAYOUT AND GOALS============================ 
                if (Array.isArray(publishers) && publishers.length > 0) {
                    for (let k = 0; k < publishers.length; k++) {
                        let pubDt = publishers[k];
                        for (const cTry of country) {
                            //let pubPayoutDt = await publisherPayout.findOne({ '$and': [{ 'pub_id': parseInt(pubDt.pub_id) }, { 'Geo': cTry }] });
                            let pubPayoutDt = await getpublisherPayoutByPubandGeo(parseInt(pubDt.pub_id), cTry);
                            if (pubPayoutDt) {
                                if (isNumeric(pubPayoutDt.pub_avg_po)) {
                                    const pub_avg_payout = parseFloat(pubPayoutDt.pub_avg_po);
                                    const publisherGoalPayout = {
                                        "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)]
                                    };
                                    // STEP-8 Push publisher goals payout on trackier
                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                        console.log('Step30 Request');
                                        if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                            console.log('Step30 Response');

                                            const sampValue = (pub_avg_payout - (payable_event_price - (payable_event_price * pubPayoutDt.profit / 100))) / pub_avg_payout;
                                            const samplingMinVal = parseFloat(sampValue * 100 % 100);
                                            if (samplingMinVal > 0) {
                                                var samplingMinVals = samplingMinVal;
                                            } else {
                                                var samplingMinVals = 5;
                                            }
                                            // SET publisher samplings/CutBack
                                            const publisherSamplings = { "pubIds": [parseInt(pubPayoutDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": Math.round(samplingMinVals, 2) };
                                            axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                                console.log('Step31 Request');
                                                if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                                    console.log('Step31 Response');
                                                } else {
                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                    res.status(200).send(resMsg);
                                                    return;
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            });
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        //console.log(err);
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });

                                } else {
                                    const pub_avg_payout = parseFloat(campaignRevenue);
                                    const publisherGoalPayout = { "payout": pub_avg_payout, "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubPayoutDt.pub_id)] };
                                    // STEP-8 Push publisher goals payout on trackier
                                    axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                        console.log('Step32 Request');
                                        if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                            console.log('Step32 Response');
                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    });
                                }
                            } else {
                                const pubPayblePayout = ((parseFloat(payable_event_price) * parseFloat(pubDt.revenue_share)) / 100);
                                const publisherGoalPayout = { "payout": parseFloat(pubPayblePayout), "revenue": 0, "geo": [cTry], "pubIds": [parseInt(pubDt.pub_id)] };
                                // STEP-8 Push publisher goals payout on trackier
                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", publisherGoalPayout, axios_header).then((pubGpayoutRes) => {
                                    console.log('Step33 Request');
                                    if (typeof pubGpayoutRes.data.success !== 'undefined' && pubGpayoutRes.data.success == true) {
                                        console.log('Step33 Response');
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });

                                // SET publisher samplings/CutBack
                                const publisherSamplings = { "pubIds": [parseInt(pubDt.pub_id)], "samplingWorking": "combined", "samplingGeo": "include", "geos": [cTry], "samplingType": "fixed", "samplingValue": 5 };
                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/samplings", publisherSamplings, axios_header).then((pubSamplingsRes) => {
                                    console.log('Step34 Request');
                                    if (typeof pubSamplingsRes.data.success !== 'undefined' && pubSamplingsRes.data.success == true) {
                                        console.log('Step34 Response');
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }
                        }
                    }
                }
            }
        }

        var countryString = country.join(',');
        Offer.findOneAndUpdate({ _id }, { country: countryString }, { new: true }).exec().then(async (resOffer) => {
            console.log('Country String Update Request');
            if (resOffer) {
                console.log('Country Update Response');

                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    company_name: ucfirst(advName.advName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    category: "Campaign",

                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                    message_adv: "<span class='text_primary'>Country</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                    message_sa: "<span class='text_primary'>Country</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                    read: 0
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                // INSERT DATA INTO Tileline
                const timelineData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    type: "Country",
                    old_value: offData.country,
                    new_value: countryString,
                    edited_by: user_name
                }
                // END INSERT DATA INTO Tileline
                await addTimelineData(timelineData);

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Country",
                        old_value: offData.country,
                        new_value: countryString,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Country",
                    old_value: offData.country,
                    new_value: countryString,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    console.log(error);
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }

    if (typeof differencesReq.payable_event_price !== 'undefined' && differencesReq.payable_event_price !== "") {

        // get Campaign Publisher Payout Geo
        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts", axios_header).then(async (getDPayout) => {
            if (typeof getDPayout.statusText !== 'undefined' && getDPayout.statusText == "OK") {

                const payoutId = getDPayout.data.payouts[0]._id;
                // Update publisher goals payout on trackier
                const campaignPayouts = { "payout": 0, "revenue": parseFloat(payable_event_price) };
                console.log('Campaign payout on trackier Request');
                await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/payouts/" + payoutId, campaignPayouts, axios_header).then((payoutUpRes) => {
                    if (typeof payoutUpRes.data.success !== 'undefined' && payoutUpRes.data.success == true) {
                        console.log('Campaign payout on trackier Response');

                        // Event prie update in collection
                        Offer.findOneAndUpdate({ _id }, { payable_event_price: payable_event_price }, { new: true }).exec().then(async (resOffer) => {
                            console.log('Payable event price Update Request');
                            if (resOffer) {
                                console.log('Payable event price Update Response');

                                // Send Mail to User
                                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                // INSERT DATA INTO NOTIFICATIONS
                                const notificationData = {
                                    advertiser_id: parseInt(trackier_adv_id),
                                    advertiser_name: ucfirst(advName.advertiserName),
                                    company_name: ucfirst(advName.advName),
                                    offer_id: trackier_camp_id,
                                    offer_name: ucfirst(offer_name),
                                    category: "Campaign",

                                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                                    message_adv: "<span class='text_primary'>Price</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                    message_sa: "<span class='text_primary'>Price</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                    read: 0
                                }
                                // END INSERT DATA INTO NOTIFICATIONS
                                await addNotificationsData(notificationData);

                                // INSERT DATA INTO Tileline
                                const timelineData = {
                                    advertiser_id: parseInt(trackier_adv_id),
                                    advertiser_name: ucfirst(advName.advertiserName),
                                    offer_id: trackier_camp_id,
                                    offer_name: ucfirst(offer_name),
                                    type: "Price",
                                    old_value: offData.payable_event_price,
                                    new_value: payable_event_price,
                                    edited_by: user_name
                                }
                                // END INSERT DATA INTO Tileline
                                await addTimelineData(timelineData);

                                if (advName.email_preferences == true) {
                                    // Send Mail to Admin if status inactive/suspended
                                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                    const messageBodyAdvetiser = (templateAdvertiser({
                                        todayDate: dateprint(),
                                        adv_id: trackier_adv_id,
                                        offer_id: trackier_camp_id,
                                        offer_name: offer_name,
                                        adv_name: ucwords(advName.advName),
                                        advertiserName: ucwords(advName.advertiserName),
                                        edit_filed: "Price",
                                        old_value: offData.payable_event_price,
                                        new_value: payable_event_price,
                                        edited_by: user_name,
                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                        base_url: process.env.APPLABS_URL
                                    }))
                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                    const msgAdvertiser = {
                                        to: advName.email,
                                        //to: 'sudish@applabs.ai',
                                        from: {
                                            name: process.env.MAIL_FROM_NAME,
                                            email: process.env.MAIL_FROM_EMAIL,
                                        },
                                        bcc: bcc_mail,
                                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                        html: messageBodyAdvetiser
                                    };
                                    //ES6
                                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                                        console.error(error);
                                        if (error.response) {
                                            console.error(error.response.body)
                                        }
                                    }).catch((error) => {
                                        const response = { 'success': false, 'message': error };
                                        res.status(200).send(response);
                                        return;
                                    });
                                }

                                // Send Mail to Admin
                                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                const messageBodyAdmin = (templateAdmin({
                                    todayDate: dateprint(),
                                    adv_id: trackier_adv_id,
                                    offer_id: trackier_camp_id,
                                    offer_name: offer_name,
                                    adv_name: ucwords(advName.advName),
                                    advertiserName: ucwords(advName.advertiserName),
                                    edit_filed: "Price",
                                    old_value: offData.payable_event_price,
                                    new_value: payable_event_price,
                                    edited_by: user_name,
                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdmin = {
                                    to: admin_mail,
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    //bcc: bcc_mail,
                                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                    html: messageBodyAdmin
                                };
                                //ES6
                                sgMail.send(msgAdmin).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    console.log(error);
                                    const response = { 'success': false, 'message': error };
                                    console.error(response);
                                });
                                // End Send Mail to Admin

                            } else {
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            }
                        }).catch((error) => {
                            console.log(error);
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        });
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch(err => {
                    console.log(err);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });

            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });
    }


    if (typeof differencesReq.goal_budget === 'object' && !Array.isArray(differencesReq.goal_budget) && differencesReq.goal_budget !== null) {


        const differenceEventName = currentArrNonPayableEventName.filter((element) => !existArrNonPayableEventName.includes(element));
        const differenceEventNameOld = existArrNonPayableEventName.filter((element) => !currentArrNonPayableEventName.includes(element));

        if (Array.isArray(differenceEventName) && differenceEventName.length > 0 && Array.isArray(differenceEventNameOld) && differenceEventNameOld.length > 0) {


            var old_ctalink = offData.cta_link;
            var old_vtaLink = offData.vta_link;

            if (typeof MMP !== 'undefined' && MMP == "Adjust") {

                // get campaign goals
                await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, axios_header).then(async (getMainLink) => {

                    if (typeof getMainLink.statusText !== 'undefined' && getMainLink.statusText == "OK") {

                        if (typeof getMainLink.data.campaign.url !== 'undefined' && getMainLink.data.campaign.url !== '') {

                            if (getMainLink.data.campaign.url.indexOf('%26goal_value%3D') !== false) {

                                var search_replace_cta = {};
                                var regexArrData = [];
                                var old_event_name_array = {};
                                var new_event_name_array = {};
                                for (let t = 0; t < differenceEventName.length; t++) {
                                    let evNewName = differenceEventName[t];
                                    let evOldName = differenceEventNameOld[t];

                                    old_event_name_array[evOldName.trim()] = evOldName.trim();
                                    new_event_name_array[evOldName.trim()] = evNewName.trim();

                                    const search_br_n = "%26goal_value%3D" + evOldName.trim();
                                    const search_br_n_replace = "%26goal_value%3D" + evNewName.trim();

                                    Object.assign(search_replace_cta, { [search_br_n]: [search_br_n_replace] });
                                    regexArrData.push(search_br_n);
                                }
                                const quotedAndCommaSeparated = regexArrData.join("|");
                                const regexData = new RegExp("" + quotedAndCommaSeparated + "", "g");

                                const mainCTAURL = getMainLink.data.campaign.url.replace(regexData, matched => search_replace_cta[matched]);

                                if (typeof getMainLink.data.campaign.iurl !== 'undefined' && getMainLink.data.campaign.iurl !== '') {
                                    const mainVTAURL = getMainLink.data.campaign.iurl.replace(regexData, matched => search_replace_cta[matched]);

                                    var campaignCTAVTA = { "url": mainCTAURL, "iurl": mainVTAURL };
                                } else {
                                    var campaignCTAVTA = { "url": mainCTAURL };
                                }

                                //Update CTA and VTA link main on trackier
                                axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id, campaignCTAVTA, axios_header).then(async (CTAVTAMainRes) => {
                                    console.log('CTA VTA OR VAT link Update Request');
                                    if (typeof CTAVTAMainRes.data.success !== 'undefined' && CTAVTAMainRes.data.success == true) {
                                        //   console.log('CTA VTA OR VAT link Update Response');
                                        const campaignCTA = "https://abc.com?i=1" + old_ctalink.replace(regexData, matched => search_replace_cta[matched]);
                                        if (typeof old_vtaLink !== 'undefined' && old_vtaLink !== '') {
                                            const campaignVTA = "https://abc.com?i=1" + old_vtaLink.replace(regexData, matched => search_replace_cta[matched]);

                                            var cta_link = campaignCTA.replace('https://abc.com?i=1', "");
                                            var vta_link = campaignVTA.replace('https://abc.com?i=1', "");
                                        } else {
                                            var cta_link = campaignCTA.replace('https://abc.com?i=1', "");
                                            var vta_link = "";
                                        }

                                        // FindAll landing pages
                                        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", axios_header).then(async (getLp) => {
                                            if (typeof getLp.statusText !== 'undefined' && getLp.statusText == "OK") {

                                                for (let j = 0; j < getLp.data.landingPages.length; j++) {
                                                    let lp = getLp.data.landingPages[j];
                                                    let LpURL = decodeHtml(lp.url);

                                                    if (LpURL.indexOf('%26goal_value%3D') !== false) {

                                                        const lpCTAReplaceEventyName = LpURL.replace(regexData, matched => search_replace_cta[matched]);

                                                        if (typeof getMainLink.data.campaign.iurl !== 'undefined' && getMainLink.data.campaign.iurl !== '') {
                                                            const lpVTAReplaceEventName = getMainLink.data.campaign.iurl.replace(regexData, matched => search_replace_cta[matched]);

                                                            var lpData = {
                                                                title: lp.title,
                                                                url: lpCTAReplaceEventyName,
                                                                status: lp.status,
                                                                lpType: lp.lpType,
                                                                visibility: lp.visibility,
                                                                iurl: lpVTAReplaceEventName
                                                            };
                                                        } else {
                                                            var lpData = {
                                                                title: lp.title,
                                                                url: lpCTAReplaceEventyName,
                                                                status: lp.status,
                                                                lpType: lp.lpType,
                                                                visibility: lp.visibility
                                                            };
                                                        }

                                                        console.log('API Edit a Landing Page with Publisher Update Request');
                                                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                                            if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                                                console.log('API Edit a Landing Page with Publisher Update Response');
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });

                                                    }
                                                }
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch(err => {
                                            console.error(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });


                                        // UPDATE DB AND GOALS EVENT ON TRACKIER

                                        var nonPayableEventNameString = currentArrNonPayableEventName.join(',');
                                        // get campaign goals
                                        await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", axios_header).then(async (resCampGoals) => {

                                            if (typeof resCampGoals.statusText !== 'undefined' && resCampGoals.statusText == "OK") {

                                                for (let k = 0; k < resCampGoals.data.goals.length; k++) {
                                                    let campGoals = resCampGoals.data.goals[k];

                                                    if (typeof campGoals.title !== 'undefined' && new_event_name_array.hasOwnProperty(campGoals.title)) {

                                                        const goalsId = campGoals._id;
                                                        const title = new_event_name_array[campGoals.title];
                                                        const type = campGoals.type;
                                                        const payout = campGoals.payouts[0].payout;
                                                        const revenue = campGoals.payouts[0].revenue;
                                                        const payout_model = campGoals.payouts[0].payout_model;
                                                        const geo = campGoals.payouts[0].geo;

                                                        const campaignGoals = { "title": title, "value": title, "type": type, "payout_model": payout_model, "payouts": [{ "payout": parseFloat(payout), "revenue": parseFloat(revenue), "geo": geo }] };

                                                        await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals/" + goalsId, campaignGoals, axios_header).then(async (cGoalRes) => {
                                                            console.log('Goals Price Edited Request');
                                                            if (typeof cGoalRes.data.success !== 'undefined' && cGoalRes.data.success == true) {
                                                                console.log('Goals Price Edited Response');

                                                                // Event Name CTA Link Main ANd VTA Link Main Update
                                                                Offer.findOneAndUpdate({ _id }, { non_payable_event_name: nonPayableEventNameString, cta_link: cta_link, vta_link: vta_link, }, { new: true }).exec().then(async (resOffer) => {
                                                                    console.log('Non Payable event name Update Request');
                                                                    if (resOffer) {
                                                                        console.log('Non Payable event name Update Response');

                                                                        // Send Mail to User
                                                                        const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                                                        // INSERT DATA INTO NOTIFICATIONS
                                                                        const notificationData = {
                                                                            advertiser_id: parseInt(trackier_adv_id),
                                                                            advertiser_name: ucfirst(advName.advertiserName),
                                                                            company_name: ucfirst(advName.advName),
                                                                            offer_id: trackier_camp_id,
                                                                            offer_name: ucfirst(offer_name),
                                                                            category: "Campaign",

                                                                            subject_adv: 'Offer ' + offer_name + ' has been edited',
                                                                            message_adv: "<span class='text_primary'>Event Name</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                                                            subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                                                            message_sa: "<span class='text_primary'>Event Name</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                                                            read: 0,
                                                                        }
                                                                        // END INSERT DATA INTO NOTIFICATIONS
                                                                        await addNotificationsData(notificationData);

                                                                        // INSERT DATA INTO Tileline
                                                                        const timelineData = {
                                                                            advertiser_id: parseInt(trackier_adv_id),
                                                                            advertiser_name: ucfirst(advName.advertiserName),
                                                                            offer_id: trackier_camp_id,
                                                                            offer_name: ucfirst(offer_name),
                                                                            type: "Event Name",
                                                                            old_value: old_event_name_array[campGoals.title],
                                                                            new_value: new_event_name_array[campGoals.title],
                                                                            edited_by: user_name
                                                                        }
                                                                        // END INSERT DATA INTO Tileline
                                                                        await addTimelineData(timelineData);

                                                                        if (advName.email_preferences == true) {
                                                                            // Send Mail to Admin if status inactive/suspended
                                                                            const bcc_mail = process.env.BCC_EMAILS.split(",");
                                                                            var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                                                            const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                                                            const messageBodyAdvetiser = (templateAdvertiser({
                                                                                todayDate: dateprint(),
                                                                                adv_id: trackier_adv_id,
                                                                                offer_id: trackier_camp_id,
                                                                                offer_name: offer_name,
                                                                                adv_name: ucwords(advName.advName),
                                                                                advertiserName: ucwords(advName.advertiserName),
                                                                                edit_filed: "Event Name",
                                                                                old_value: old_event_name_array[campGoals.title],
                                                                                new_value: new_event_name_array[campGoals.title],
                                                                                edited_by: user_name,
                                                                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                                                base_url: process.env.APPLABS_URL
                                                                            }))
                                                                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                                            const msgAdvertiser = {
                                                                                // to: advName.email,
                                                                                to: 'sudish@applabs.ai',
                                                                                from: {
                                                                                    name: process.env.MAIL_FROM_NAME,
                                                                                    email: process.env.MAIL_FROM_EMAIL,
                                                                                },
                                                                                bcc: bcc_mail,
                                                                                subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                                                                html: messageBodyAdvetiser
                                                                            };
                                                                            //ES6
                                                                            sgMail.send(msgAdvertiser).then(() => { }, error => {
                                                                                console.error(error);
                                                                                if (error.response) {
                                                                                    console.error(error.response.body)
                                                                                }
                                                                            }).catch((error) => {
                                                                                const response = { 'success': false, 'message': error };
                                                                                res.status(200).send(response);
                                                                                return;
                                                                            });
                                                                        }

                                                                        // Send Mail to Admin
                                                                        const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                                                        const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                                                        const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                                                        const messageBodyAdmin = (templateAdmin({
                                                                            todayDate: dateprint(),
                                                                            adv_id: trackier_adv_id,
                                                                            offer_id: trackier_camp_id,
                                                                            offer_name: offer_name,
                                                                            adv_name: ucwords(advName.advName),
                                                                            advertiserName: ucwords(advName.advertiserName),
                                                                            edit_filed: "Event Name",
                                                                            old_value: old_event_name_array[campGoals.title],
                                                                            new_value: new_event_name_array[campGoals.title],
                                                                            edited_by: user_name,
                                                                            url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                                            base_url: process.env.APPLABS_URL
                                                                        }))
                                                                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                                        const msgAdmin = {
                                                                            to: admin_mail,
                                                                            from: {
                                                                                name: process.env.MAIL_FROM_NAME,
                                                                                email: process.env.MAIL_FROM_EMAIL,
                                                                            },
                                                                            //bcc: bcc_mail,
                                                                            subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                                                            html: messageBodyAdmin
                                                                        };
                                                                        //ES6
                                                                        sgMail.send(msgAdmin).then(() => { }, error => {
                                                                            console.error(error);
                                                                            if (error.response) {
                                                                                console.error(error.response.body)
                                                                            }
                                                                        }).catch((error) => {
                                                                            console.log(error);
                                                                            const response = { 'success': false, 'message': error };
                                                                            console.error(response);
                                                                        });
                                                                        // End Send Mail to Admin
                                                                    } else {
                                                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                        res.status(200).send(resMsg);
                                                                        return;
                                                                    }
                                                                }).catch((error) => {
                                                                    console.log(err);
                                                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                    res.status(200).send(resMsg);
                                                                    return;
                                                                });
                                                            } else {
                                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                                res.status(200).send(resMsg);
                                                                return;
                                                            }
                                                        }).catch(err => {
                                                            console.log(err);
                                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                            res.status(200).send(resMsg);
                                                            return;
                                                        });
                                                    }
                                                }
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }

                                        }).catch(err => {
                                            console.error(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });

                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }
                        } else {
                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                            res.status(200).send(resMsg);
                            return;
                        }
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }
                }).catch(err => {
                    console.error(err);
                    const errMsg = { "success": false, "errors": err.response.data.errors };
                    res.status(400).send(errMsg);
                    return;
                });

            } else {
                var old_event_name_array = {};
                var new_event_name_array = {};
                for (let t = 0; t < differenceEventName.length; t++) {
                    let evNewName = differenceEventName[t];
                    let evOldName = differenceEventNameOld[t];
                    old_event_name_array[evOldName.trim()] = evOldName.trim();
                    new_event_name_array[evOldName.trim()] = evNewName.trim();
                }
                var nonPayableEventNameString = currentArrNonPayableEventName.join(',');
                // get campaign goals
                await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", axios_header).then(async (resCampGoals) => {

                    if (typeof resCampGoals.statusText !== 'undefined' && resCampGoals.statusText == "OK") {

                        for (let k = 0; k < resCampGoals.data.goals.length; k++) {
                            let campGoals = resCampGoals.data.goals[k];

                            if (typeof campGoals.title !== 'undefined' && new_event_name_array.hasOwnProperty(campGoals.title)) {

                                const goalsId = campGoals._id;
                                const title = new_event_name_array[campGoals.title];
                                const type = campGoals.type;
                                const payout = campGoals.payouts[0].payout;
                                const revenue = campGoals.payouts[0].revenue;
                                const payout_model = campGoals.payouts[0].payout_model;
                                const geo = campGoals.payouts[0].geo;

                                const campaignGoals = { "title": title, "value": title, "type": type, "payout_model": payout_model, "payouts": [{ "payout": parseFloat(payout), "revenue": parseFloat(revenue), "geo": geo }] };

                                await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals/" + goalsId, campaignGoals, axios_header).then(async (cGoalRes) => {
                                    console.log('Goals Price Edited Request');
                                    if (typeof cGoalRes.data.success !== 'undefined' && cGoalRes.data.success == true) {
                                        console.log('Goals Price Edited Response');

                                        // Event Name CTA Link Main ANd VTA Link Main Update
                                        Offer.findOneAndUpdate({ _id }, { non_payable_event_name: nonPayableEventNameString }, { new: true }).exec().then(async (resOffer) => {
                                            console.log('Non Payable event name Update Request');
                                            if (resOffer) {
                                                console.log('Non Payable event name Update Response');

                                                // Send Mail to User
                                                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                                // INSERT DATA INTO NOTIFICATIONS
                                                const notificationData = {
                                                    advertiser_id: parseInt(trackier_adv_id),
                                                    advertiser_name: ucfirst(advName.advertiserName),
                                                    company_name: ucfirst(advName.advName),
                                                    offer_id: trackier_camp_id,
                                                    offer_name: ucfirst(offer_name),
                                                    category: "Campaign",

                                                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                                                    message_adv: "<span class='text_primary'>Event Name</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                                    message_sa: "<span class='text_primary'>Event Name</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                                    read: 0,
                                                }
                                                // END INSERT DATA INTO NOTIFICATIONS
                                                await addNotificationsData(notificationData);

                                                // INSERT DATA INTO Tileline
                                                const timelineData = {
                                                    advertiser_id: parseInt(trackier_adv_id),
                                                    advertiser_name: ucfirst(advName.advertiserName),
                                                    offer_id: trackier_camp_id,
                                                    offer_name: ucfirst(offer_name),
                                                    type: "Event Name",
                                                    old_value: old_event_name_array[campGoals.title],
                                                    new_value: new_event_name_array[campGoals.title],
                                                    edited_by: user_name
                                                }
                                                // END INSERT DATA INTO Tileline
                                                await addTimelineData(timelineData);

                                                if (advName.email_preferences == true) {
                                                    // Send Mail to Admin if status inactive/suspended
                                                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                                                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                                    const messageBodyAdvetiser = (templateAdvertiser({
                                                        todayDate: dateprint(),
                                                        adv_id: trackier_adv_id,
                                                        offer_id: trackier_camp_id,
                                                        offer_name: offer_name,
                                                        adv_name: ucwords(advName.advName),
                                                        advertiserName: ucwords(advName.advertiserName),
                                                        edit_filed: "Event Name",
                                                        old_value: old_event_name_array[campGoals.title],
                                                        new_value: new_event_name_array[campGoals.title],
                                                        edited_by: user_name,
                                                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                        base_url: process.env.APPLABS_URL
                                                    }))
                                                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                    const msgAdvertiser = {
                                                        // to: advName.email,
                                                        to: 'sudish@applabs.ai',
                                                        from: {
                                                            name: process.env.MAIL_FROM_NAME,
                                                            email: process.env.MAIL_FROM_EMAIL,
                                                        },
                                                        bcc: bcc_mail,
                                                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                                        html: messageBodyAdvetiser
                                                    };
                                                    //ES6
                                                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                                                        console.error(error);
                                                        if (error.response) {
                                                            console.error(error.response.body)
                                                        }
                                                    }).catch((error) => {
                                                        const response = { 'success': false, 'message': error };
                                                        res.status(200).send(response);
                                                        return;
                                                    });
                                                }

                                                // Send Mail to Admin
                                                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                                const messageBodyAdmin = (templateAdmin({
                                                    todayDate: dateprint(),
                                                    adv_id: trackier_adv_id,
                                                    offer_id: trackier_camp_id,
                                                    offer_name: offer_name,
                                                    adv_name: ucwords(advName.advName),
                                                    advertiserName: ucwords(advName.advertiserName),
                                                    edit_filed: "Event Name",
                                                    old_value: old_event_name_array[campGoals.title],
                                                    new_value: new_event_name_array[campGoals.title],
                                                    edited_by: user_name,
                                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                    base_url: process.env.APPLABS_URL
                                                }))
                                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                const msgAdmin = {
                                                    to: admin_mail,
                                                    from: {
                                                        name: process.env.MAIL_FROM_NAME,
                                                        email: process.env.MAIL_FROM_EMAIL,
                                                    },
                                                    //bcc: bcc_mail,
                                                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                                    html: messageBodyAdmin
                                                };
                                                //ES6
                                                sgMail.send(msgAdmin).then(() => { }, error => {
                                                    console.error(error);
                                                    if (error.response) {
                                                        console.error(error.response.body)
                                                    }
                                                }).catch((error) => {
                                                    console.log(error);
                                                    const response = { 'success': false, 'message': error };
                                                    console.error(response);
                                                });
                                                // End Send Mail to Admin
                                            } else {
                                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                                res.status(200).send(resMsg);
                                                return;
                                            }
                                        }).catch((error) => {
                                            console.log(err);
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        });
                                    } else {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                        res.status(200).send(resMsg);
                                        return;
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                });
                            }
                        }
                    } else {
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    }

                }).catch(err => {
                    console.error(err);
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                });


            }

        } else {

            const event_price_obj = offData.non_payable_event_price.split(",");
            var prUpdateVal = [];
            var nonPayableEventPrice = 0;
            var nonPayableEventPriceOld = 0;
            for (let i = 0; i < event_price_obj.length; i++) {
                let ev_pr = event_price_obj[i];
                if (ev_pr > 0) {
                    if (typeof differencesReq.goal_budget[i] !== 'undefined' && differencesReq.goal_budget[i] !== "") {
                        prUpdateVal.push(differencesReq.goal_budget[i].non_payable_event_price);
                        nonPayableEventPrice = differencesReq.goal_budget[i].non_payable_event_price;
                        nonPayableEventPriceOld = ev_pr;
                    } else {
                        prUpdateVal.push(ev_pr);
                    }
                } else {
                    prUpdateVal.push(ev_pr);
                }
            }

            // get campaign goals
            await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals", axios_header).then(async (campGoals) => {
                if (typeof campGoals.statusText !== 'undefined' && campGoals.statusText == "OK") {

                    for (let k = 0; k < campGoals.data.goals.length; k++) {
                        let goalBudget = campGoals.data.goals[k];

                        if (typeof goalBudget.payouts[0].revenue !== 'undefined' && goalBudget.payouts[0].revenue > 0) {

                            const goalsId = goalBudget._id;
                            const title = goalBudget.title;
                            const type = goalBudget.type;
                            const revenue = nonPayableEventPrice;
                            const payout_model = goalBudget.payouts[0].payout_model;
                            const geo = goalBudget.payouts[0].geo;

                            const campaignGoals = { "title": title, "value": title, "type": type, "payout_model": payout_model, "payouts": [{ "payout": 0, "revenue": parseFloat(revenue), "geo": geo }] };

                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/goals/" + goalsId, campaignGoals, axios_header).then(async (cGoalRes) => {
                                console.log('Goals Price Edited Request');
                                if (typeof cGoalRes.data.success !== 'undefined' && cGoalRes.data.success == true) {
                                    console.log('Goals Price Edited Response');

                                    // Event prie update in collection
                                    const nonPayableEventPriceString = prUpdateVal.join(',');
                                    Offer.findOneAndUpdate({ _id }, { non_payable_event_price: nonPayableEventPriceString }, { new: true }).exec().then(async (resOffer) => {
                                        console.log('Non Payable event price Update Request');
                                        if (resOffer) {
                                            console.log('Non Payable event price Update Response');

                                            // Send Mail to User
                                            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                                            // INSERT DATA INTO NOTIFICATIONS
                                            const notificationData = {
                                                advertiser_id: parseInt(trackier_adv_id),
                                                advertiser_name: ucfirst(advName.advertiserName),
                                                company_name: ucfirst(advName.advName),
                                                offer_id: trackier_camp_id,
                                                offer_name: ucfirst(offer_name),
                                                category: "Campaign",

                                                subject_adv: 'Offer ' + offer_name + ' has been edited',
                                                message_adv: "<span class='text_primary'>Price</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                                subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                                message_sa: "<span class='text_primary'>Price</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                                read: 0,
                                            }
                                            // END INSERT DATA INTO NOTIFICATIONS
                                            await addNotificationsData(notificationData);

                                            // INSERT DATA INTO Tileline
                                            const timelineData = {
                                                advertiser_id: parseInt(trackier_adv_id),
                                                advertiser_name: ucfirst(advName.advertiserName),
                                                offer_id: trackier_camp_id,
                                                offer_name: ucfirst(offer_name),
                                                type: "Price",
                                                old_value: parseFloat(nonPayableEventPriceOld),
                                                new_value: parseFloat(nonPayableEventPrice),
                                                edited_by: user_name
                                            }
                                            // END INSERT DATA INTO Tileline
                                            await addTimelineData(timelineData);

                                            if (advName.email_preferences == true) {
                                                // Send Mail to Admin if status inactive/suspended
                                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                                const messageBodyAdvetiser = (templateAdvertiser({
                                                    todayDate: dateprint(),
                                                    adv_id: trackier_adv_id,
                                                    offer_id: trackier_camp_id,
                                                    offer_name: offer_name,
                                                    adv_name: ucwords(advName.advName),
                                                    advertiserName: ucwords(advName.advertiserName),
                                                    edit_filed: "Price",
                                                    old_value: parseFloat(nonPayableEventPriceOld),
                                                    new_value: parseFloat(nonPayableEventPrice),
                                                    edited_by: user_name,
                                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                    base_url: process.env.APPLABS_URL
                                                }))
                                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                                const msgAdvertiser = {
                                                    // to: advName.email,
                                                    to: 'sudish@applabs.ai',
                                                    from: {
                                                        name: process.env.MAIL_FROM_NAME,
                                                        email: process.env.MAIL_FROM_EMAIL,
                                                    },
                                                    bcc: bcc_mail,
                                                    subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                                    html: messageBodyAdvetiser
                                                };
                                                //ES6
                                                sgMail.send(msgAdvertiser).then(() => { }, error => {
                                                    console.error(error);
                                                    if (error.response) {
                                                        console.error(error.response.body)
                                                    }
                                                }).catch((error) => {
                                                    const response = { 'success': false, 'message': error };
                                                    res.status(200).send(response);
                                                    return;
                                                });
                                            }

                                            // Send Mail to Admin
                                            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                                            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                                            const templateAdmin = handlebars.compile(emailTemplateAdmin);
                                            const messageBodyAdmin = (templateAdmin({
                                                todayDate: dateprint(),
                                                adv_id: trackier_adv_id,
                                                offer_id: trackier_camp_id,
                                                offer_name: offer_name,
                                                adv_name: ucwords(advName.advName),
                                                advertiserName: ucwords(advName.advertiserName),
                                                edit_filed: "Price",
                                                old_value: parseFloat(nonPayableEventPriceOld),
                                                new_value: parseFloat(nonPayableEventPrice),
                                                edited_by: user_name,
                                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                                base_url: process.env.APPLABS_URL
                                            }))
                                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                            const msgAdmin = {
                                                to: admin_mail,
                                                from: {
                                                    name: process.env.MAIL_FROM_NAME,
                                                    email: process.env.MAIL_FROM_EMAIL,
                                                },
                                                //bcc: bcc_mail,
                                                subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                                html: messageBodyAdmin
                                            };
                                            //ES6
                                            sgMail.send(msgAdmin).then(() => { }, error => {
                                                console.error(error);
                                                if (error.response) {
                                                    console.error(error.response.body)
                                                }
                                            }).catch((error) => {
                                                console.log(error);
                                                const response = { 'success': false, 'message': error };
                                                console.error(response);
                                            });
                                            // End Send Mail to Admin

                                        } else {
                                            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                            res.status(200).send(resMsg);
                                            return;
                                        }
                                    }).catch((error) => {
                                        const resMsg = { "success": false, "errors": [{ "statusCode": 400, "codeMsg": "VALIDATION_ERROR", "message": error.message }] };
                                        res.status(400).send(resMsg);
                                        return;
                                    });
                                } else {
                                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                    res.status(200).send(resMsg);
                                    return;
                                }
                            }).catch(err => {
                                console.log(err);
                                const errMsg = { "success": false, "errors": err.response.data.errors };
                                res.status(400).send(errMsg);
                                return;
                            });
                        }
                    }
                } else {
                    const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                    res.status(200).send(resMsg);
                    return;
                }
            }).catch(err => {
                console.error(err);
                const errMsg = { "success": false, "errors": err.response.data.errors };
                res.status(400).send(errMsg);
                return;
            });
        }

    }



    // console.log(differencesReq.goal_budget);
    if (typeof differencesReq.pubs === 'object' && !Array.isArray(differencesReq.pubs) && differencesReq.pubs !== null || typeof differencesReq.publisher_status === 'object' && !Array.isArray(differencesReq.publisher_status) && differencesReq.publisher_status !== null) {

        if (typeof source_type !== 'undefined' && source_type == "DIRECT") {
            //var differencePubIds = findDeselectedItem(pubsActive, pubsPaused);
            var publishersMain = [];
            if (Array.isArray(pubs) && pubs.length > 0) {
                let pubDataArray = await getPublisherByPubId(pubsActive);
                for (let i = 0; i < pubDataArray.length; i++) {
                    let value = pubDataArray[i];
                    publishersMain.push({ 'pub_id': value.pub_id, 'pub_name': value.pub_name, 'pub_details': value.pub_details, 'pub_website': value.pub_website, 'enable_s2s': value.enable_s2s, 'enable_os_targeting': value.enable_os_targeting, 'exclude_publisher': value.exclude_publisher, 'revenue_share': parseFloat(value.revenue_share), 'wl_s2s': value.wl_s2s, 'appsflyer_site_id': value.appsflyer_site_id, 'pub_status': value.pub_status, 'bid_ajustment': 100, 'bid_price': parseFloat(0.0), 'status': "active" });
                }
            }


            if (Array.isArray(pubsPaused) && pubsPaused.length > 0) {
                let pubDataDiffArray = await getPublisherByPubId(pubsPaused);
                for (let i = 0; i < pubDataDiffArray.length; i++) {
                    let value = pubDataDiffArray[i];
                    publishersMain.push({ 'pub_id': value.pub_id, 'pub_name': value.pub_name, 'pub_details': value.pub_details, 'pub_website': value.pub_website, 'enable_s2s': value.enable_s2s, 'enable_os_targeting': value.enable_os_targeting, 'exclude_publisher': value.exclude_publisher, 'revenue_share': parseFloat(value.revenue_share), 'wl_s2s': value.wl_s2s, 'appsflyer_site_id': value.appsflyer_site_id, 'pub_status': value.pub_status, 'bid_ajustment': 100, 'bid_price': parseFloat(0.0), 'status': "paused" });
                }
            }

            // FindAll landing pages
            await axios.get(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps", axios_header).then(async (getLp) => {
                if (typeof getLp.statusText !== 'undefined' && getLp.statusText == "OK") {

                    for (let j = 0; j < getLp.data.landingPages.length; j++) {
                        let lp = getLp.data.landingPages[j];

                        let lpIds = lp.title.substring(lp.title.length - 4);

                        const pubIdsCheck = inArray(lpIds, pubsPaused);
                        if (pubIdsCheck) {

                            const lpData = { "title": lp.title, "url": decodeHtml(lp.url), "status": "paused", "lpType": lp.lpType, "visibility": lp.visibility };
                            console.log('API Edit a Landing Page with Publisher Update Request');
                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                    console.log('API Edit a Landing Page with Publisher Update Response');
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });

                        } else {
                            const lpData = { "title": lp.title, "url": decodeHtml(lp.url), "status": "active", "lpType": lp.lpType, "visibility": lp.visibility };
                            console.log('API Edit a Landing Page with Publisher Update Request');
                            await axios.post(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/lps/" + lp._id, lpData, axios_header).then((resLpData) => {
                                if (typeof resLpData.data.success !== 'undefined' && resLpData.data.success == true) {
                                    console.log('API Edit a Landing Page with Publisher Update Response');
                                }
                            }).catch(err => {
                                console.log(err);
                                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                                res.status(200).send(resMsg);
                                return;
                            });
                        }
                    }

                    const old_pub_String = pubObj.join(', ');
                    const new_pub_String = pubsActive.join(', ');
                    Offer.findOneAndUpdate({ _id }, { publishers: publishersMain }, { new: true }).exec().then(async (updateRes) => {
                        console.log('Update Publisher status Request');
                        if (updateRes) {
                            console.log('Update Publisher status Reponse');

                            // SENDING MAIL TO EDIT CTA LINK
                            const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                            // INSERT DATA INTO NOTIFICATIONS
                            const notificationData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                company_name: ucfirst(advName.advName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                category: "Campaign",

                                subject_adv: 'Offer ' + offer_name + ' has been edited',
                                message_adv: "<span class='text_primary'>Publisher</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                                subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                                message_sa: "<span class='text_primary'>Publisher</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                                read: 0
                            }
                            // END INSERT DATA INTO NOTIFICATIONS
                            await addNotificationsData(notificationData);

                            // INSERT DATA INTO Tileline
                            const timelineData = {
                                advertiser_id: parseInt(trackier_adv_id),
                                advertiser_name: ucfirst(advName.advertiserName),
                                offer_id: trackier_camp_id,
                                offer_name: ucfirst(offer_name),
                                type: "Publisher",
                                old_value: old_pub_String,
                                new_value: new_pub_String,
                                edited_by: user_name
                            }
                            // END INSERT DATA INTO Tileline
                            await addTimelineData(timelineData);

                            if (advName.email_preferences == true) {
                                // Send Mail to Admin if status inactive/suspended
                                const bcc_mail = process.env.BCC_EMAILS.split(",");
                                var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");

                                const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                                const messageBodyAdvetiser = (templateAdvertiser({
                                    todayDate: dateprint(),
                                    adv_id: trackier_adv_id,
                                    offer_id: trackier_camp_id,
                                    offer_name: offer_name,
                                    adv_name: ucwords(advName.advName),
                                    advertiserName: ucwords(advName.advertiserName),
                                    edit_filed: "Publisher",
                                    old_value: old_pub_String,
                                    new_value: new_pub_String,
                                    edited_by: user_name,
                                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                    base_url: process.env.APPLABS_URL
                                }))
                                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                                const msgAdvertiser = {
                                    to: advName.email,
                                    // to: 'sudish@applabs.ai',
                                    from: {
                                        name: process.env.MAIL_FROM_NAME,
                                        email: process.env.MAIL_FROM_EMAIL,
                                    },
                                    bcc: bcc_mail,
                                    subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                                    html: messageBodyAdvetiser
                                };
                                //ES6
                                sgMail.send(msgAdvertiser).then(() => { }, error => {
                                    console.error(error);
                                    if (error.response) {
                                        console.error(error.response.body)
                                    }
                                }).catch((error) => {
                                    const response = { 'success': false, 'message': error };
                                    res.status(200).send(response);
                                    return;
                                });
                            }

                            // Send Mail to Admin
                            const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                            const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                            const templateAdmin = handlebars.compile(emailTemplateAdmin);
                            const messageBodyAdmin = (templateAdmin({
                                todayDate: dateprint(),
                                adv_id: trackier_adv_id,
                                offer_id: trackier_camp_id,
                                offer_name: offer_name,
                                adv_name: ucwords(advName.advName),
                                advertiserName: ucwords(advName.advertiserName),
                                edit_filed: "Publisher",
                                old_value: old_pub_String,
                                new_value: new_pub_String,
                                edited_by: user_name,
                                url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                                base_url: process.env.APPLABS_URL
                            }))
                            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                            const msgAdmin = {
                                to: admin_mail,
                                from: {
                                    name: process.env.MAIL_FROM_NAME,
                                    email: process.env.MAIL_FROM_EMAIL,
                                },
                                //bcc: bcc_mail,
                                subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                                html: messageBodyAdmin
                            };
                            //ES6
                            sgMail.send(msgAdmin).then(() => { }, error => {
                                console.error(error);
                                if (error.response) {
                                    console.error(error.response.body)
                                }
                            }).catch((error) => {
                                const response = { 'success': false, 'message': error };
                                console.error(response);
                            });
                            // End Send Mail to Admin
                        }
                    }).catch((error) => {
                        console.log(error);
                        const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                        res.status(200).send(resMsg);
                        return;
                    });
                }
            }).catch(err => {
                console.log(err);
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            });
        }
    }

    // Creatives UPDATE
    if (typeof differencesReq.creatives !== 'undefined' && differencesReq.creatives !== "" && Array.isArray(creatives) && creatives.length > 0) {

        const creativesListOld = await CreativeModel.find({ campaign_id: _id }).sort({ _id: -1 }).exec();
        var creativeNameOld = [];
        for (let i = 0; i < creativesListOld.length; i++) {
            creativeNameOld.push(creativesListOld[i].creative);
        }

        for (let i = 0; i < creatives.length; i++) {

            //process.exit();
            const creative_data = new CreativeModel({
                campaign_id: _id,
                trackier_adv_id: trackier_adv_id,
                trackier_camp_id: trackier_camp_id,
                creative: creatives[i].creative,
                creative_type: creatives[i].creative_type,
                concept_name: creatives[i].concept_name,
                image_dimension: creatives[i].image_dimension,
                ads_end_date: creatives[i].ads_end_date,
                ads: creatives[i].ads,
                user: creatives[i].user,
                expired: "No"
            });

            //console.log(creative_data);
            // Save Creative in the database
            let saveUser = await creative_data.save(creative_data).then(data_c => {
                console.log('Creative ok');
            }).catch(err => {
                console.error(err);
            });
        }

        const creativesList = await CreativeModel.find({ campaign_id: _id }).sort({ _id: -1 }).exec();
        var creativeName = [];
        var creative_dimension = [];
        for (let i = 0; i < creativesList.length; i++) {
            creativeName.push(creativesList[i].creative);
            creative_dimension.push(creativesList[i].image_dimension);
        }

        const final_creative_list = getCreativeNameLists(creativeName, creative_dimension);
        // START INSERT DATA INTO DB WITH CREATIVE CTR
        const banner_ctr = {
            "300x250": "1.1348-1.4514",
            "320x50": "1.1348-1.4514",
            "320x480": "1.3514-1.7373",
            "480x320": "1.303-1.8345",
            "84x84": "1.1348-1.4514",
            "default": "1.1348-1.4514",
            "720x1280": "1.3514-1.7373",
            "540x960": "1.3514-1.7373",
            "1080x1920": "1.3514-1.7373",
            "640x640": "1.3514-1.7373",
            "1280x720": "1.3514-1.7373",
            "1200x628": "1.3514-1.7373",
            "960x540": "1.3514-1.7373"
        }
        var creativeArr = [];
        for (const [key, val] of Object.entries(banner_ctr)) {
            let ctrArr = val.split('-');
            let randCTR = await generateRandomNumber(parseFloat(ctrArr[0]), parseFloat(ctrArr[1]));
            creativeArr[key] = parseFloat(randCTR);
        }
        var final_creative_list_mod = [];
        for (let i = 0; i < final_creative_list.length; i++) {
            let key = Object.keys(final_creative_list[i])[0];
            let value = final_creative_list[i][key];

            final_creative_list_mod.push(value);
            let creative = value;
            for (const [size, val] of Object.entries(creativeArr)) {
                if (key.indexOf(size) !== -1) {
                    const aData = new CreativeCtrModel({
                        trackier_adv_id: trackier_adv_id,
                        trackier_camp_id: trackier_camp_id,
                        creative_name: creative,
                        creative_ctr: val,
                    });
                    let creative_ctr_exist = await CreativeCtrModel.find({ 'creative_name': creative });
                    var creative_ctr_exist_arr = [];
                    for (let n = 0; n < creative_ctr_exist.length; n++) {
                        let creative_c = creative_ctr_exist[n];
                        creative_ctr_exist_arr.push(creative_c.creative_name);
                    }
                    if (Array.isArray(creative_ctr_exist_arr) && creative_ctr_exist_arr.length == 0) {
                        await aData.save(aData).then(ctr_data => {
                            console.log('Creative ctr ok');
                        }).catch(err => {
                            console.error(err);
                        });
                    }
                }
            }
        }
        console.log("Creative");
        // END INSERT DATA INTO DB WITH CREATIVE CTR              
        const creativeData = { "creativeNames": final_creative_list_mod };

        // // STEP-11 push app lists on trackier
        await axios.put(process.env.API_BASE_URL + "campaigns/" + trackier_camp_id + "/creative-names", creativeData, axios_header).then(async (creativeUpload) => {
            console.log('Step39 Request');
            if (typeof creativeUpload.data.success !== 'undefined' && creativeUpload.data.success == true) {
                console.log('Step39 Response');

                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    company_name: ucfirst(advName.advName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    category: "Campaign",

                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                    message_adv: "<span class='text_primary'>Ads</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                    message_sa: "<span class='text_primary'>Ads</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                    read: 0,
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                const creativeNameNewString = creativeName.join(', ');
                const creativeNameOldString = creativeNameOld.join(', ');


                // INSERT DATA INTO Tileline
                const timelineData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    type: "Ads",
                    old_value: creativeNameNewString,
                    new_value: creativeNameOldString,
                    edited_by: user_name
                }
                // END INSERT DATA INTO Tileline
                await addTimelineData(timelineData);

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");


                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Ads",
                        old_value: creativeNameOldString,
                        new_value: creativeNameNewString,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Ads",
                    old_value: creativeNameOldString,
                    new_value: creativeNameNewString,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin


            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch(err => {
            console.log(err);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });

    }

    // premium_apps UPDATE
    if (typeof differencesReq.premium_apps !== 'undefined' && differencesReq.premium_apps !== "" && Array.isArray(premium_apps) && premium_apps.length > 0) {

        // UPDATE Premium patrtners          
        const premiumAppsData = { "premium_apps": premium_apps };

        Offer.findOneAndUpdate({ _id }, premiumAppsData, { new: true }).exec().then(async (resOffer) => {
            console.log('Premium Partners U Update Request');
            if (resOffer) {
                console.log('Premium Partners Update Response');

                var premiumPartnersNew = [];
                for (let i = 0; i < premium_apps.length; i++) {
                    premiumPartnersNew.push(premium_apps[i].appName);
                }

                var premiumPartnersOld = [];
                for (let i = 0; i < offData.premium_apps.length; i++) {
                    premiumPartnersOld.push(offData.premium_apps[i].appName);
                }

                // Send Mail to User
                const advName = await getAdertiseDetailsByAdvId(parseInt(trackier_adv_id));

                // INSERT DATA INTO NOTIFICATIONS
                const notificationData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    company_name: ucfirst(advName.advName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    category: "Campaign",

                    subject_adv: 'Offer ' + offer_name + ' has been edited',
                    message_adv: "<span class='text_primary'>Premium Partners</span>,  Changes have successfully been made to offer <span class='text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span>",

                    subject_sa: 'Offer ' + ucfirst(offer_name) + '[' + trackier_camp_id + '] has been edited',
                    message_sa: "<span class='text_primary'>Premium Partners</span>,  Changes have been made to offer <span class= 'text_primary'>  " + ucfirst(offer_name) + "[" + trackier_camp_id + "] </span> by the Advertiser <span class= 'text_primary'> " + ucfirst(advName.advName) + "</span>.",

                    read: 0,
                }
                // END INSERT DATA INTO NOTIFICATIONS
                await addNotificationsData(notificationData);

                const premiumPartnerNewString = premiumPartnersNew.join(',');
                const premiumPartnerOldString = premiumPartnersOld.join(',');

                // INSERT DATA INTO Tileline
                const timelineData = {
                    advertiser_id: parseInt(trackier_adv_id),
                    advertiser_name: ucfirst(advName.advertiserName),
                    offer_id: trackier_camp_id,
                    offer_name: ucfirst(offer_name),
                    type: "Premium Partners",
                    old_value: premiumPartnerNewString,
                    new_value: premiumPartnerOldString,
                    edited_by: user_name
                }
                // END INSERT DATA INTO Tileline
                await addTimelineData(timelineData);

                if (advName.email_preferences == true) {
                    // Send Mail to Admin if status inactive/suspended
                    const bcc_mail = process.env.BCC_EMAILS.split(",");
                    var emailTemplateAdvertiser = fs.readFileSync(path.join("templates/offer_edit.handlebars"), "utf-8");


                    const templateAdvertiser = handlebars.compile(emailTemplateAdvertiser);
                    const messageBodyAdvetiser = (templateAdvertiser({
                        todayDate: dateprint(),
                        adv_id: trackier_adv_id,
                        offer_id: trackier_camp_id,
                        offer_name: offer_name,
                        adv_name: ucwords(advName.advName),
                        advertiserName: ucwords(advName.advertiserName),
                        edit_filed: "Premium Partners",
                        old_value: premiumPartnerNewString,
                        new_value: premiumPartnerOldString,
                        edited_by: user_name,
                        url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                        base_url: process.env.APPLABS_URL
                    }))
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msgAdvertiser = {
                        to: advName.email,
                        //to: 'sudish@applabs.ai',
                        from: {
                            name: process.env.MAIL_FROM_NAME,
                            email: process.env.MAIL_FROM_EMAIL,
                        },
                        bcc: bcc_mail,
                        subject: 'Applabs Alert - Offer ' + offer_name + ' has been edited',
                        html: messageBodyAdvetiser
                    };
                    //ES6
                    sgMail.send(msgAdvertiser).then(() => { }, error => {
                        console.error(error);
                        if (error.response) {
                            console.error(error.response.body)
                        }
                    }).catch((error) => {
                        const response = { 'success': false, 'message': error };
                        res.status(200).send(response);
                        return;
                    });
                }

                // Send Mail to Admin
                const admin_mail = process.env.NOTIFICATION_ADMIN_EMAILS.split(",");
                const emailTemplateAdmin = fs.readFileSync(path.join("templates/offer_edit_admin.handlebars"), "utf-8");
                const templateAdmin = handlebars.compile(emailTemplateAdmin);
                const messageBodyAdmin = (templateAdmin({
                    todayDate: dateprint(),
                    adv_id: trackier_adv_id,
                    offer_id: trackier_camp_id,
                    offer_name: offer_name,
                    adv_name: ucwords(advName.advName),
                    advertiserName: ucwords(advName.advertiserName),
                    edit_filed: "Premium Partners",
                    old_value: premiumPartnerNewString,
                    new_value: premiumPartnerOldString,
                    edited_by: user_name,
                    url: process.env.APPLABS_URL + 'edit_offer/' + trackier_camp_id,
                    base_url: process.env.APPLABS_URL
                }))
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msgAdmin = {
                    to: admin_mail,
                    //to: "sudish@applabs.ai",
                    from: {
                        name: process.env.MAIL_FROM_NAME,
                        email: process.env.MAIL_FROM_EMAIL,
                    },
                    //bcc: bcc_mail,
                    subject: 'Applabs Alert - ' + offer_name + '[' + trackier_camp_id + '] has been edited',
                    html: messageBodyAdmin
                };
                //ES6
                sgMail.send(msgAdmin).then(() => { }, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }).catch((error) => {
                    const response = { 'success': false, 'message': error };
                    console.error(response);
                });
                // End Send Mail to Admin


            } else {
                const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
                res.status(200).send(resMsg);
                return;
            }
        }).catch((error) => {
            console.log(error);
            const resMsg = { "success": false, "errors": [{ "statusCode": 200, "codeMsg": "VALIDATION_ERROR", "message": "Something went wrong please try again!!" }] };
            res.status(200).send(resMsg);
            return;
        });

    }

    const response = { 'success': true, 'message': 'Offer updated successfully' };
    res.status(200).send(response);
    return;
}


// Get TImeline Data
exports.getTimeLineData = async (req, res) => {


    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = parseInt((page - 1) * limit);

    const { offer_id, sorttype, sortdirection, searchQuery } = req.body;

    if (!offer_id) {
        const reMsg = { 'success': false, 'message': "offer_id is not allowed to be empty" };
        res.status(400).send(reMsg);
        return;
    }

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
    filter['offer_id'] = parseInt(offer_id);
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
        Object.assign(filter, {
            $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'type': { '$regex': searchQuery, $options: 'i' } }, { 'date_time': { '$regex': searchQuery, $options: 'i' } }, { 'edited_by': { '$regex': searchQuery, $options: 'i' } }]
        });
    }

    var filters = {};
    filters['offer_id'] = parseInt(offer_id);
    if (typeof searchQuery !== "undefined" && searchQuery !== "") {
        Object.assign(filters, {
            $or: [{ 'offer_name': { '$regex': searchQuery, $options: 'i' } }, { 'type': { '$regex': searchQuery, $options: 'i' } }, { 'date_time': { '$regex': searchQuery, $options: 'i' } }, { 'edited_by': { '$regex': searchQuery, $options: 'i' } }]
        });
    }

    let result = await Timeline.find(filters).sort(sortObject).exec();
    var totalTimeline = parseInt(result.length);


    const filter_Datas = { '$match': filter };
    await Timeline.aggregate([
        filter_Datas,
        {
            '$lookup': {
                'foreignField': 'trackier_camp_id',
                'localField': 'offer_id',
                'as': 'Offer',
                'from': 'campaign_manager'
            }
        },
        { $unwind: { path: '$Offer', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                'campaign_manager.icon': '$Offer.icon',
            }
        }, {
            $project: {
                'Offer': 0
            }
        }
    ]).sort(sortObject).skip(skipIndex).limit(limit).exec().then((notRes) => {
        var timeArray = [];
        for (let i = 0; i < notRes.length; i++) {
            let value = notRes[i];
            timeArray.push({
                advertiser_id: value.advertiser_id,
                advertiser_name: value.advertiser_name,
                offer_name: value.offer_name,
                offer_id: value.offer_id,
                type: value.type,
                old_value: value.old_value,
                new_value: value.new_value,
                date_time: value.date_time,
                edited_by: value.edited_by,
                icon: value.campaign_manager.icon
            });
        }
        if (notRes) {
            const response = { 'success': true, 'totoalRecords': totalTimeline, 'results': timeArray };
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

