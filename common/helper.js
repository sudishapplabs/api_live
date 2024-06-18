const { URL, parse } = require('url');

const stringIsAValidUrl = (s, protocols) => {
    try {
        new URL(s);
        const parsed = parse(s);
        return protocols
            ? parsed.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(parsed.protocol)
                : false
            : true;
    } catch (err) {
        return false;
    }
}

const isNumeric = (str) => {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
};

function isNumericVal(value) {
    return /^-?\d+$/.test(value);
}

const generateOTP = (length = 4) => {
    let otp = ''
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10)
    }
    return otp;
};

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

function generateRandomNumber(min, max) {
    highlightedNumber = (Math.random() * (max - min) + min).toFixed(4);
    return highlightedNumber;
};

function generateRandomString(length) {
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function bin2hex(s) {
    //  discuss at: https://locutus.io/php/bin2hex/
    // original by: Kevin van Zonneveld (https://kvz.io)
    // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
    // bugfixed by: Linuxworld
    // improved by: ntoniazzi (https://locutus.io/php/bin2hex:361#comment_177616)
    //   example 1: bin2hex('Kev')
    //   returns 1: '4b6576'
    //   example 2: bin2hex(String.fromCharCode(0x00))
    //   returns 2: '00'
    let i
    let l
    let o = ''
    let n
    s += ''
    for (i = 0, l = s.length; i < l; i++) {
        n = s.charCodeAt(i)
            .toString(16)
        o += n.length < 2 ? '0' + n : n
    }
    return o
}

const getCreativeLists = (creativeName) => {
    var all_sizes = { "320x50": [], "300x250": [], "320x480": [], "480x320": [], "720x1280": [], "540x960": [], "1080x1920": [], "640x640": [], "1280x720": [], "1200x628": [],"960x540": [], "default": [] };

    for (let i = 0; i < creativeName.length; i++) {
        var creative = creativeName[i];
        for (const [key, value] of Object.entries(all_sizes)) {
            var pushed = false;
            if (creative.indexOf(key) !== -1) {
                all_sizes[key].push(creative);
                pushed = true;
                break;
            }
        }
        if (pushed == false) {
            all_sizes['default'].push(creative);
        }
    }

    // console.log(all_sizes);
    var m = 1;
    var final_creative_list = [];
    for (const [key, value] of Object.entries(all_sizes)) {
        if (value.length) {
            switch (key) {
                case "320x50":
                    m = Math.ceil(25 / value.length);
                    break;
                case "300x250":
                    m = Math.ceil(20 / value.length);
                    break;
                case "320x480":
                    m = Math.ceil(15 / value.length);
                    break;
                case "480x320":
                    m = Math.ceil(10 / value.length);
                    break;
                case "720x1280":
                    m = Math.ceil(5 / value.length);
                    break;
                case "540x960":
                    m = Math.ceil(5 / value.length);
                    break;
                case "1080x1920":
                    m = Math.ceil(5 / value.length);
                    break;
                case "640x640":
                    m = Math.ceil(5 / value.length);
                    break;
                case "1280x720":
                    m = Math.ceil(5 / value.length);
                    break;
				case "1200x628":
                    m = Math.ceil(5 / value.length);
                    break;
                case "960x540":
                    m = Math.ceil(5 / value.length);
                    break;
                default:
                    m = 1;
                    break;
            }
            for (const [keys, values] of Object.entries(value)) {
                for (let i = 0; i < m; i++) {
                    final_creative_list.push(values);
                }
            }
        }
    }
    return final_creative_list;
}


function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
function getOrdinalNum(n) {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}


function dateprint() {
    var htmlDate = new Date();
    const year = htmlDate.getUTCFullYear();
    const month = htmlDate.toLocaleString('default', { month: 'long' });
    const day = padTo2Digits(htmlDate.getUTCDate());
    const mailDateFormat = [getOrdinalNum(day), month, year].join(' ');
    return mailDateFormat;
}


function number_format(number, decimals, dec_point, thousands_sep) {
    // Strip all characters but numerical ones.
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}


function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}


function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}


module.exports = { stringIsAValidUrl, isNumeric, shuffle, generateRandomNumber, getCreativeLists, generateOTP, isNumericVal, generateRandomString, bin2hex, padTo2Digits, number_format, isEmpty, dateprint, timeSince }
