const Applist = require("../../models/applistModel");
const { parse } = require('csv-parse');
const { Readable } = require('stream');

// request.bod

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
                try {
                    await Applist.insertMany(results);
                    const resData = { 'success': true, 'message': "File processed successfully", 'results': results };
                    res.status(200).send(resData);
                    return;
                } catch (error) {
                    const resData = { 'success': false, 'message': error.message, 'results': results };
                    res.status(500).send(resData);
                    return;
                }
            })
            .on('error', err => {
                const resData = { 'success': false, 'message': err.message, 'results': results };
                res.status(200).send(resData);
                return;
            });
    } else {
        const resData = { 'success': false, 'message': "File not found!" };
        res.status(200).send(resData);
        return;
    }


};