const Oppo = require("../models/oppoModel");
const axios = require('axios');

exports.addCampaign = async (req, res, next) => {

  const { country, trackier_camp_id, bundle_id, app_name, icon, preview_url, descriptions, VTAExist} = req.body;

  var length = 249;
  var trimmedDesc = descriptions.substring(0, length);
  var todayDateTime = new Date();
  const schedule_start_date = todayDateTime.toISOString().slice(0, 10);
  var nextOneYearDatetime = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); 
  const schedule_end_date = nextOneYearDatetime.toISOString().slice(0, 10);
  var countryArrTostring = country.join('-');
  // actual ids
  var vta_link = "";
  if (VTAExist == "Yes") {
    vta_link = "https://t.clickscot.com/imp?campaign_id=" + trackier_camp_id + "&pub_id=3221&gaid={ifa}&p1={conversion}&source={tagid}&p2=3221_{tagid}&p5={ip}&p6={user_agent}";
  } else {
    vta_link = "";
  }
  const remotefeed_id_IN = 457917;
  const remotefeed_id_OTHER = 457917;
  const remotefeedId = (countryArrTostring.indexOf('IN') !== -1) ? remotefeed_id_IN : remotefeed_id_OTHER;
  const advertiser_id = 198528;
  const remotefeed_id = remotefeedId;

  const pricing_model = "CPM";
  const description = trimmedDesc;
  const impressions_per_ip_requests_only = true;
  const type = "DISPLAY";
  const is_active = false;
  const start_date = schedule_start_date;
  const end_date = schedule_end_date;
  const clicks_per_ip = 10;
  const impressions_per_ip = 1;
  const budget_limiter_type = "ASAP";

  const tracking_link_pid = 3221;

  const name = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-BL";
  const budget_daily = 5.00;
  const e_cpm = 0.10;
  const min_bid = 0.01;
  const max_bid = 1.00;

  const budget_dailyTier1 = 10.00;
  const nameTier1 = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-Tier1";
  const e_cpmTier1 = 0.095;
  const min_bidTier1 = 0.01;
  const max_bidTier1 = 1.00;

  const budget_dailyTier2 = 5.00;
  const nameTier2 = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-Tier2";
  const e_cpmTier2 = 0.01;
  const min_bidTier2 = 0.01;
  const max_bidTier2 = 1.00;

  let image = await axios.get(icon, { responseType: 'arraybuffer' });
  let ICON_image = Buffer.from(image.data).toString('base64');

  var offer_geo_arr = [];
  for (let i = 0; i < country.length; i++) {
    let offerGeoData = {
      id: country[i].toLowerCase(),
      type: "COUNTRY",
      enabled: true,
      bid_adjustment: 1.0
    }
    offer_geo_arr.push(offerGeoData);
  }

  try {
    const oppo = await Oppo.create({
      advertiser_id,
      remotefeed_id,
      name,
      pricing_model,
      description,
      impressions_per_ip_requests_only,
      type,
      is_active,
      start_date,
      end_date,
      budget_daily,
      clicks_per_ip,
      impressions_per_ip,
      budget_limiter_type
    });

    const adkCampaingData = {
      adkernalCampaignDataBL: {
        advertiser_id: advertiser_id,
        remotefeed_id: remotefeed_id,
        name: name,
        pricing_model: "CPM",
        description: description,
        impressions_per_ip_requests_only: impressions_per_ip_requests_only,
        type: type,
        is_active: is_active,
        start_date: start_date,
        end_date: end_date,
        budget_daily: budget_daily,
        clicks_per_ip: clicks_per_ip,
        impressions_per_ip: impressions_per_ip,
        budget_limiter_type: budget_limiter_type,
        tagid_list_mode: "BLACKLIST",
        tagid_list: "1510\n18\n266\n28\n309\n17\n01\n296\n295\n315\n301\n313\n503\n307\n302\n308\n92845\n1003838\n1003839\n210893\n1002726\n1002727\n210892"
      },
      adkernalCampaignDataTier1: {
        advertiser_id: advertiser_id,
        remotefeed_id: remotefeed_id,
        name: nameTier1,
        pricing_model: "CPM",
        description: description,
        impressions_per_ip_requests_only: impressions_per_ip_requests_only,
        type: type,
        is_active: is_active,
        start_date: start_date,
        end_date: end_date,
        budget_daily: budget_dailyTier1,
        clicks_per_ip: clicks_per_ip,
        impressions_per_ip: impressions_per_ip,
        budget_limiter_type: budget_limiter_type,
        tagid_list_mode: "WHITELIST",
        tagid_list: "1510\n18\n266\n28"
      },
      adkernalCampaignDataTier2: {
        advertiser_id: advertiser_id,
        remotefeed_id: remotefeed_id,
        name: nameTier2,
        pricing_model: "CPM",
        description: description,
        impressions_per_ip_requests_only: impressions_per_ip_requests_only,
        type: type,
        is_active: is_active,
        start_date: start_date,
        end_date: end_date,
        budget_daily: budget_dailyTier2,
        clicks_per_ip: clicks_per_ip,
        impressions_per_ip: impressions_per_ip,
        budget_limiter_type: budget_limiter_type,
        tagid_list_mode: "WHITELIST",
        tagid_list: "309\n17\n01\n296\n295\n315\n301\n313\n503\n307\n302\n308\n92845\n210893\n1002726\n1002727\n210892"

      }
    }

    // create compaing on adkernal
    const axios_header = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    let cmapignDatas = [
      adkCampaingData.adkernalCampaignDataBL,
      adkCampaingData.adkernalCampaignDataTier1,
      adkCampaingData.adkernalCampaignDataTier2
    ];
    var campaignUrl = process.env.ADKERNEL_API_URL + "api/Campaign/?userToken=" + process.env.ADKERNEL_UTOKEN;
    var offerUrl = process.env.ADKERNEL_API_URL + "api/OfferNew/?userToken=" + process.env.ADKERNEL_UTOKEN;
    // Return our response in the allData variable as an array
    Promise.all(cmapignDatas.map((cmapignData) => axios.post(campaignUrl, cmapignData, axios_header))).then(async ([{ data: CampaignDataBL }, { data: CampaignDataTier1 }, { data: CampaignDataTier2 }]) => {
      //console.log({ CampaignDataBL, CampaignDataTier1, CampaignDataTier2 });

      if (CampaignDataBL.status == 'OK' && CampaignDataTier1.status == 'OK' && CampaignDataTier2.status == 'OK') {

        const blCampid = CampaignDataBL.response.created;
        const t1Campid = CampaignDataTier1.response.created;
        const t2Campid = CampaignDataTier2.response.created;
        const adkofferData = {
          bl: {
            ad_campaign_id: blCampid,
            advertiser_id: advertiser_id,
            name: name,
            e_cpm: e_cpm,
            min_bid: min_bid,
            max_bid: max_bid,
            imp_trackers: vta_link,
            click_tracking_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=3221_{tagid}&p5={ip}&p6={user_agent}",
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: preview_url,
                  app_bundle: bundle_id,
                  images: [
                    {
                      width: 80,
                      height: 80,
                      type: "ICON",
                      image: ICON_image
                    }
                  ]
                }
              ]
            },
            Location: {
              mode: "REPLACE",
              edit: offer_geo_arr
            },
            BrowserNew: {
              mode: "UPDATE",
              edit: [
                {
                  id: 1,
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            OpsysNew: {
              mode: "UPDATE",
              edit: [
                {
                  os: "ANDROID",
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            Conversions: {
              mode: "REPLACE",
              create: [
                {
                  name: "Oppo-RTB",
                  cost_per_value: 1
                }
              ]
            }
          },
          t1: {
            ad_campaign_id: t1Campid,
            advertiser_id: advertiser_id,
            name: nameTier1,
            e_cpm: e_cpmTier1,
            min_bid: min_bidTier1,
            max_bid: max_bidTier1,
            imp_trackers: vta_link,
            click_tracking_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=3221_{tagid}&p5={ip}&p6={user_agent}",
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: preview_url,
                  app_bundle: bundle_id,
                  images: [
                    {
                      width: 80,
                      height: 80,
                      type: "ICON",
                      image: ICON_image
                    }
                  ]
                }
              ]
            },
            Location: {
              mode: "REPLACE",
              edit: offer_geo_arr
            },
            BrowserNew: {
              mode: "UPDATE",
              edit: [
                {
                  id: 1,
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            OpsysNew: {
              mode: "UPDATE",
              edit: [
                {
                  os: "ANDROID",
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            Conversions: {
              mode: "REPLACE",
              create: [
                {
                  name: "Oppo-RTB",
                  cost_per_value: 1
                }
              ]
            },
            "TagIds": {
              "mode": "REPLACE",
              "create": [
                {
                  "tag_id": '1510',
                  "enabled": true,
                  "bid_adjustment": 2.11
                },
                {
                  "tag_id": '18',
                  "enabled": true,
                  "bid_adjustment": 1.05
                },
                {
                  "tag_id": '266',
                  "enabled": true,
                  "bid_adjustment": 1.05
                },
                {
                  "tag_id": '28',
                  "enabled": true,
                  "bid_adjustment": 1.05
                }
              ]
            }
          },
          t2: {
            ad_campaign_id: t2Campid,
            advertiser_id: advertiser_id,
            name: nameTier2,
            e_cpm: e_cpmTier2,
            min_bid: min_bidTier2,
            max_bid: max_bidTier2,
            imp_trackers: vta_link,
            click_tracking_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=3221_{tagid}&p5={ip}&p6={user_agent}",
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: preview_url,
                  app_bundle: bundle_id,
                  images: [
                    {
                      width: 80,
                      height: 80,
                      type: "ICON",
                      image: ICON_image
                    }
                  ]
                }
              ]
            },
            Location: {
              mode: "REPLACE",
              edit: offer_geo_arr
            },
            BrowserNew: {
              mode: "UPDATE",
              edit: [
                {
                  id: 1,
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            OpsysNew: {
              mode: "UPDATE",
              edit: [
                {
                  os: "ANDROID",
                  enabled: true,
                  bid_adjustment: 1
                }
              ]
            },
            Conversions: {
              mode: "REPLACE",
              create: [
                {
                  name: "Oppo-RTB",
                  cost_per_value: 1
                }
              ]
            },
            "TagIds": {
              "mode": "REPLACE",
              "create": [
                {
                  "tag_id": '309',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '17',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '01',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '296',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '295',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '315',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '301',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '313',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '503',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '307',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '302',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '308',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '92845',
                  "enabled": true,
                  "bid_adjustment": 5.00
                },
                {
                  "tag_id": '210893',
                  "enabled": true,
                  "bid_adjustment": 2.00
                },
                {
                  "tag_id": '1002726',
                  "enabled": true,
                  "bid_adjustment": 2.00
                },
                {
                  "tag_id": '1002727',
                  "enabled": true,
                  "bid_adjustment": 2.00
                },
                {
                  "tag_id": '210892',
                  "enabled": true,
                  "bid_adjustment": 2.00
                }
              ]
            }
          }
        }
        const offerdatas = [
          adkofferData.bl,
          adkofferData.t1,
          adkofferData.t2
        ];

        // Promise.all(offerdatas.map((offerdata) => axios.post(offerUrl, offerdata, axios_header))).then(([{ data: CampaignDataBLOffer }, { data: CampaignDataTier1Offer }, { data: CampaignDataTier2Offer }]) => {
        //   if (CampaignDataBLOffer.status == 'OK' && CampaignDataTier1Offer.status == 'OK' && CampaignDataTier2Offer.status == 'OK') {

        //     let adkernalUpdateData = {
        //       offersBLId: CampaignDataBLOffer.response.created,
        //       offersTier1Id: CampaignDataTier1Offer.response.created,
        //       offersTier2Id: CampaignDataTier2Offer.response.created
        //     }
        //     let _id = oppo._id;
        //     const adkernalData = Oppo.findByIdAndUpdate(_id, adkernalUpdateData, { new: true, upsert: true }).exec().then((resDb) => {
        //       const resData = { 'success': true, 'message': "Campaign created successfully", 'results': adkernalData };
        //       res.status(200).send(resData);
        //     })
        //   } else {
        //     const reMsg = { "status": false, CampaignDataBLOffer, CampaignDataTier1Offer, CampaignDataTier2Offer };
        //     res.status(200).send(reMsg);
        //   }
        // });


        const CampaignDataBLOffer = await axios.post(offerUrl, adkofferData.bl, axios_header);
        const CampaignDataTier1Offer = await axios.post(offerUrl, adkofferData.t1, axios_header);
        const CampaignDataTier2Offer = await axios.post(offerUrl, adkofferData.t2, axios_header);

        if (CampaignDataBLOffer.data.status == 'OK' && CampaignDataTier1Offer.data.status == 'OK' && CampaignDataTier2Offer.data.status == 'OK') {

          const adkernalUpdateData = {
            offersBLId: CampaignDataBLOffer.data.response.created,
            offersTier1Id: CampaignDataTier1Offer.data.response.created,
            offersTier2Id: CampaignDataTier2Offer.data.response.created
          }

          const _id = oppo._id;
          await Oppo.findByIdAndUpdate(_id, adkernalUpdateData, { new: true, upsert: true }).exec().then((resDb) => {
            const resData = { 'success': true, 'message': "Campaign created successfully", 'results': resDb };
            res.status(200).send(resData);
          })
        } else {
          const reMsg = { "status": false, 'message': "Something went wrong, Please try again", 'results': '' };
          res.status(200).send(reMsg);
        }






      } else {
        const reMsg = { "status": false, CampaignDataBL, CampaignDataTier1, CampaignDataTier2 };
        res.status(200).send(reMsg);
      }
    });
  } catch (error) {
    const reMsg = { "status": false, "message": error.message };
    res.status(200).send(reMsg);
  }
};