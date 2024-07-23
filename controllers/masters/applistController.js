const Applist = require("../../models/applistModel");
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const fs = require('fs-extra')
const randomBytes = require('randombytes');
const axios = require('axios');
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

function base64Mime(encoded) {
    var result = null;
    if (typeof encoded !== 'string') {
        return result;
    }
    var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (mime && mime.length) {
        result = mime[1];
    }
    return result;
}

// Define valid headers
const validHeaders = ['AppBundle', 'App_Name', 'CTR', 'Category', 'Google_Play_Rating', 'Insert_Ratio', 'Installs', 'Language', 'OS', 'Playstore_URL', 'Reach', 'Region', 'Tier'];

// Function to validate CSV headers
function validateHeaders(headers) {
    return headers.length === validHeaders.length && headers.every((header, index) => header === validHeaders[index]);
}

function getHeadersFromBuffer(buffer) {
    const lines = buffer.toString().split('\n');
    if (lines.length === 0) {
        throw new Error('Empty buffer');
    }

    const linedat = lines[0].replace(/"/g, '');
    const headers = linedat.split(',').map(header => header.trim());
    return headers;
}

exports.addApplist = async (req, res) => {
    if (req.file) {
        const buffer = req.file.buffer.toString();
        const headers = getHeadersFromBuffer(buffer);
        if (!validateHeaders(headers)) {
            const resData = { 'success': false, 'message': "Invalid CSV headers" };
            res.status(400).send(resData);
            return;
        }

        const readable = Readable.from(buffer);
        const results = [];

        readable
            .pipe(parse({ delimiter: ',', columns: true }))
            .on('data', row => {
                results.push(row);
                results.forEach(item => (item.Geo = req.body.country));
            })
            .on('end', async () => {

                for (let i = 0; i < results.length; i++) {
                    const bytes = randomBytes(10);
                    let cnvData = results[i];
                    let bundleName = cnvData.AppBundle

                    try {
                        const setHeader = {
                            headers: {
                                Accept: 'application/json'
                            }
                        };

                        let res = await fetch('https://data.42matters.com/api/v2.0/android/apps/lookup.json?p=' + bundleName + '&access_token=c14e1687306458df9f786143f2b7abb3e7cd5057', setHeader);
                        let data = await res.json();

                        // get image from URL
                        let imgUrl = data.icon
                        let image = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                        let ICON_image = Buffer.from(image.data).toString('base64');

                        let data_val = ICON_image.replace(/^data:image\/[a-z]+;base64,/, "");
                        let icon_name = cnvData.App_Name;
                        let data_name = icon_name.replace(/[^A-Z0-9]+/ig, "_") + ".png";
                        let mimetype = detectMimeType(ICON_image);
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
                        // end get image form URL

                    } catch (error) {
                        console.log(error);
                    }

                }

                try {
                    await Applist.insertMany(results);
                    const resData = { 'success': true, 'message': "File processed successfully", 'results': results };
                    res.status(200).send(resData);
                    return;
                } catch (error) {
                    const resData = { 'success': false, 'message': error.message, 'results': results };
                    res.status(400).send(resData);
                    return;
                }
            })
            .on('error', err => {
                const resData = { 'success': false, 'message': err.message, 'results': results };
                res.status(400).send(resData);
                return;
            });
    } else {
        const resData = { 'success': false, 'message': "File not found!" };
        res.status(400).send(resData);
        return;
    }


};