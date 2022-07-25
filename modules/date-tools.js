const moment = require("moment-timezone");

const dateFormat = 'YYYY-MM-DD'
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'

const toDateString = t => moment(t).format(dateFormat);
const toDateTimeString = t => moment(t).format(dateTimeFormat);

module.exports = {
    toDateString,
    toDateTimeString,
}