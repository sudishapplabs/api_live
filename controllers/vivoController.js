const Vivo = require("../models/vivoModel");
const axios = require('axios');

exports.addCampaign = async (req, res, next) => {

  const { country, trackier_camp_id, bundle_id, app_name, descriptions, VTAExist } = req.body;
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
    vta_link = "https://t.clickscot.com/imp?campaign_id=" + trackier_camp_id + "&pub_id=2835&gaid={ifa}&p1={conversion}&source={tagid}&p2=2835_{tagid}&p5={ip}&p6={user_agent}";
  } else {
    vta_link = "";
  }
  const remotefeed_id_IN = 353675;
  const remotefeed_id_OTHER = 374380;
  const remotefeedId = (countryArrTostring.indexOf('IN') !== -1) ? remotefeed_id_IN : remotefeed_id_OTHER;
  const advertiser_id = 176662;
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

  const tracking_link_pid = 2835;

  const name = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-BL";
  const budget_daily = 5.00;
  const e_cpm = 0.05;
  const min_bid = 0.01;
  const max_bid = 2.00;

  const budget_dailyTier1 = 10.00;
  const nameTier1 = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-Tier1";
  const e_cpmTier1 = 0.21;
  const min_bidTier1 = 0.01;
  const max_bidTier1 = 2.00;

  const budget_dailyTier2 = 5.00;
  const nameTier2 = countryArrTostring + "-" + trackier_camp_id + "-" + bundle_id + "-Tier2";
  const e_cpmTier2 = 0.11;
  const min_bidTier2 = 0.01;
  const max_bidTier2 = 2.00;

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
    const vivo = await Vivo.create({
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
        tagid_list: "78401ac9c042402194964014810a8689\nef65ec8510f647bf846b092cfbba9e6d\nb5c717c60189470eba819ceb9361e62e\n9926df797793413a82fed50ea79c81e2\ndc7a4fae81124266914193f0f838006c\n0b9dac87c8ae45149d77f4efd3dbcdd1\n8475863bfba84338ab5c680772bb1505\n201b170e17794e9385af95fc00bdda97\n11ef8a0b3ec94502b1eab06bdf8ffccd\n186199374986476a85e7344086a4c47e\n19fa711693424f418f89b7e95a2be140\n55e08384a78b43269bc677fbd3de8043\nbbbb2d8467d04773b4d64cb4d67e6c0f\nded67efd492c40e2a0f9cba636daeba4\n4d9391aef3e84bab98d99246b0ce16ac\ne040523e6ef841fab340b812f8b14f0b\n8987e628a42441a39068de84550271d5\n08fce905dce24224ad96d23061028615\n1be4c1f4197a4ea8860ded480ff01cdf\n6db6204fdf0041059895eb81f50b81a3\n3a3d8a52583e45ab87249064e9dd76a5\n5b06c7ff91fc4af4a6939276a2e24807\n85ad0489a1fa444bad5799ddd839bcbe\nd87b46b5f1dd41518af93f37a282caec\nfb3712c0904e4f0a95f528a2e9075a95\n5f2d6ff01a9d47e99386291bee65f299\na29953ee1b064079a6a3c4a6c99aac40\nab5d28e344df41c4b722cd5ab05b6042\nbede8a1cb23642428e9d8b4571053550\nf68da7df64b5455f9f710fcdabdda904\nf878fbc6a1814fd4a24247a9057a175e\n38fdd26680ca468cb5a55b3214f7edde\n485625d0676a47f5b6398dd60f8cb916\ne28330cd6fe34e81a0ae11f13f9d4d53\ne2ee3371bbdb48febb153174814189df\nec0a07fa925d4fd4a16f4f90faa186ee\n491067942e3a40aab4d74878f040928f\n77d9506cd5344c67a29f21f9d728346c\nc901c78f7d644b4ea22f8346c0a03405\nfd08796e8a7946cc92ddfec40fd1e411\n1b943b4c94a94e3ea6c3928f16aca042\na1a8a2cbc804404582a8ca0a1ca11387\n623bcd75e04d4a288e458b4a12b84363\n9a42e72e22e146ad9089e118b917f154\na79e124995a548adade63dbf3c09b851\naf02ad752f084b799af1ddff7f390eb6\nc70f0a3a130642cfa8fc611ef249eda3\nd3a00c7b848f4bf0b627eee651666303\nedcde6d4820b447f892b3dc1f8ac07e7\nfe72d2720a9c4a1db0784eb86188ed84"
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
        tagid_list: "623bcd75e04d4a288e458b4a12b84363\n9a42e72e22e146ad9089e118b917f154\na79e124995a548adade63dbf3c09b851\naf02ad752f084b799af1ddff7f390eb6\nc70f0a3a130642cfa8fc611ef249eda3\nd3a00c7b848f4bf0b627eee651666303\nedcde6d4820b447f892b3dc1f8ac07e7\nfe72d2720a9c4a1db0784eb86188ed84"
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
        tagid_list: "78401ac9c042402194964014810a8689\nef65ec8510f647bf846b092cfbba9e6d\nb5c717c60189470eba819ceb9361e62e\n9926df797793413a82fed50ea79c81e2\ndc7a4fae81124266914193f0f838006c\n0b9dac87c8ae45149d77f4efd3dbcdd1\n8475863bfba84338ab5c680772bb1505\n201b170e17794e9385af95fc00bdda97\n11ef8a0b3ec94502b1eab06bdf8ffccd\n186199374986476a85e7344086a4c47e\n19fa711693424f418f89b7e95a2be140\n55e08384a78b43269bc677fbd3de8043\nbbbb2d8467d04773b4d64cb4d67e6c0f\nded67efd492c40e2a0f9cba636daeba4\n4d9391aef3e84bab98d99246b0ce16ac\ne040523e6ef841fab340b812f8b14f0b\n8987e628a42441a39068de84550271d5\n08fce905dce24224ad96d23061028615\n1be4c1f4197a4ea8860ded480ff01cdf\n6db6204fdf0041059895eb81f50b81a3\n3a3d8a52583e45ab87249064e9dd76a5\n5b06c7ff91fc4af4a6939276a2e24807\n85ad0489a1fa444bad5799ddd839bcbe\nd87b46b5f1dd41518af93f37a282caec\nfb3712c0904e4f0a95f528a2e9075a95\n5f2d6ff01a9d47e99386291bee65f299\na29953ee1b064079a6a3c4a6c99aac40\nab5d28e344df41c4b722cd5ab05b6042\nbede8a1cb23642428e9d8b4571053550\nf68da7df64b5455f9f710fcdabdda904\nf878fbc6a1814fd4a24247a9057a175e\n38fdd26680ca468cb5a55b3214f7edde\n485625d0676a47f5b6398dd60f8cb916\ne28330cd6fe34e81a0ae11f13f9d4d53\ne2ee3371bbdb48febb153174814189df\nec0a07fa925d4fd4a16f4f90faa186ee\n491067942e3a40aab4d74878f040928f\n77d9506cd5344c67a29f21f9d728346c\nc901c78f7d644b4ea22f8346c0a03405\nfd08796e8a7946cc92ddfec40fd1e411\n1b943b4c94a94e3ea6c3928f16aca042\na1a8a2cbc804404582a8ca0a1ca11387"

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
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=2835_{tagid}&p5={ip}&p6={user_agent}",
                  app_bundle: bundle_id
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
                  name: "Vivo-RTB",
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
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=2835_{tagid}&p5={ip}&p6={user_agent}",
                  app_bundle: bundle_id
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
                  name: "Vivo-RTB",
                  cost_per_value: 1
                }
              ]
            },
            "TagIds": {
              "mode": "REPLACE",
              "create": [
                {
                  "tag_id": "623bcd75e04d4a288e458b4a12b84363",
                  "enabled": true,
                  "bid_adjustment": 0.19047619
                },
                {
                  "tag_id": "9a42e72e22e146ad9089e118b917f154",
                  "enabled": true,
                  "bid_adjustment": 0.142857143
                },
                {
                  "tag_id": "a79e124995a548adade63dbf3c09b851",
                  "enabled": true,
                  "bid_adjustment": 1.904761905
                },
                {
                  "tag_id": "af02ad752f084b799af1ddff7f390eb6",
                  "enabled": true,
                  "bid_adjustment": 0.19047619
                },
                {
                  "tag_id": "c70f0a3a130642cfa8fc611ef249eda3",
                  "enabled": true,
                  "bid_adjustment": 0.095238095
                },
                {
                  "tag_id": "d3a00c7b848f4bf0b627eee651666303",
                  "enabled": true,
                  "bid_adjustment": 0.19047619
                },
                {
                  "tag_id": "edcde6d4820b447f892b3dc1f8ac07e7",
                  "enabled": true,
                  "bid_adjustment": 0.476190476
                },
                {
                  "tag_id": "fe72d2720a9c4a1db0784eb86188ed84",
                  "enabled": true,
                  "bid_adjustment": 0.095238095
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
            Ad: {
              mode: "REPLACE",
              create: [
                {
                  type: "NATIVE",
                  title: app_name,
                  desc: description,
                  display: "play.google.com",
                  dest_url: "https://t.clickscot.com/click?campaign_id=" + trackier_camp_id + "&pub_id=" + tracking_link_pid + "&gaid={ifa}&p1={conversion}&source={tagid}&p2=2835_{tagid}&p5={ip}&p6={user_agent}",
                  app_bundle: bundle_id
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
                  name: "Vivo-RTB",
                  cost_per_value: 1
                }
              ]
            },
            "TagIds": {
              "mode": "REPLACE",
              "create": [
                {
                  "tag_id": "78401ac9c042402194964014810a8689",
                  "enabled": true,
                  "bid_adjustment": 9.090909091
                },
                {
                  "tag_id": "ef65ec8510f647bf846b092cfbba9e6d",
                  "enabled": true,
                  "bid_adjustment": 0.909090909
                },
                {
                  "tag_id": "b5c717c60189470eba819ceb9361e62e",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                },
                {
                  "tag_id": "9926df797793413a82fed50ea79c81e2",
                  "enabled": true,
                  "bid_adjustment": 0.909090909
                },
                {
                  "tag_id": "dc7a4fae81124266914193f0f838006c",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "0b9dac87c8ae45149d77f4efd3dbcdd1",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "8475863bfba84338ab5c680772bb1505",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                },
                {
                  "tag_id": "201b170e17794e9385af95fc00bdda97",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "11ef8a0b3ec94502b1eab06bdf8ffccd",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "186199374986476a85e7344086a4c47e",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "19fa711693424f418f89b7e95a2be140",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "55e08384a78b43269bc677fbd3de8043",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "bbbb2d8467d04773b4d64cb4d67e6c0f",
                  "enabled": true,
                  "bid_adjustment": 0.545454545
                },
                {
                  "tag_id": "ded67efd492c40e2a0f9cba636daeba4",
                  "enabled": true,
                  "bid_adjustment": 0.545454545
                },
                {
                  "tag_id": "4d9391aef3e84bab98d99246b0ce16ac",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                },
                {
                  "tag_id": "e040523e6ef841fab340b812f8b14f0b",
                  "enabled": true,
                  "bid_adjustment": 0.363636364
                },
                {
                  "tag_id": "8987e628a42441a39068de84550271d5",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                },
                {
                  "tag_id": "08fce905dce24224ad96d23061028615",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "1be4c1f4197a4ea8860ded480ff01cdf",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "6db6204fdf0041059895eb81f50b81a3",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "3a3d8a52583e45ab87249064e9dd76a5",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "5b06c7ff91fc4af4a6939276a2e24807",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },
                {
                  "tag_id": "85ad0489a1fa444bad5799ddd839bcbe",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "d87b46b5f1dd41518af93f37a282caec",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "fb3712c0904e4f0a95f528a2e9075a95",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "5f2d6ff01a9d47e99386291bee65f299",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                }, {
                  "tag_id": "a29953ee1b064079a6a3c4a6c99aac40",
                  "enabled": true,
                  "bid_adjustment": 0.272727273
                }, {
                  "tag_id": "ab5d28e344df41c4b722cd5ab05b6042",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "bede8a1cb23642428e9d8b4571053550",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "f68da7df64b5455f9f710fcdabdda904",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "f878fbc6a1814fd4a24247a9057a175e",
                  "enabled": true,
                  "bid_adjustment": 0.454545455
                }, {
                  "tag_id": "38fdd26680ca468cb5a55b3214f7edde",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "485625d0676a47f5b6398dd60f8cb916",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "e28330cd6fe34e81a0ae11f13f9d4d53",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "e2ee3371bbdb48febb153174814189df",
                  "enabled": true,
                  "bid_adjustment": 2.727272727
                }, {
                  "tag_id": "ec0a07fa925d4fd4a16f4f90faa186ee",
                  "enabled": true,
                  "bid_adjustment": 0.363636364
                }, {
                  "tag_id": "491067942e3a40aab4d74878f040928f",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "77d9506cd5344c67a29f21f9d728346c",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "c901c78f7d644b4ea22f8346c0a03405",
                  "enabled": true,
                  "bid_adjustment": 0.090909091
                }, {
                  "tag_id": "fd08796e8a7946cc92ddfec40fd1e411",
                  "enabled": true,
                  "bid_adjustment": 0.318181818
                }, {
                  "tag_id": "1b943b4c94a94e3ea6c3928f16aca042",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                }, {
                  "tag_id": "a1a8a2cbc804404582a8ca0a1ca11387",
                  "enabled": true,
                  "bid_adjustment": 0.181818182
                },

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
        //     let _id = vivo._id;
        //     const adkernalData = Vivo.findByIdAndUpdate(_id, adkernalUpdateData, { new: true, upsert: true }).exec().then((resDb) => {
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

          const _id = vivo._id;
          await Vivo.findByIdAndUpdate(_id, adkernalUpdateData, { new: true, upsert: true }).exec().then((resDb) => {
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