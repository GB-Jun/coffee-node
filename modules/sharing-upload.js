const multer = require('multer');
const moment = require('moment-timezone');
const { v4 } = require('uuid');

const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
};

function fileFilter(req, file, cb) {
    cb(null, !!extMap[file.mimetype]);
}

// const uuidArr = uuidv4().split('-').join('');
// console.log(uuidArr);
// const newTime = parseInt(new Date() / 100);
// console.log(newTime);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/sharing/');
    },
    filename: function (req, file, cb) {
        // const filename = moment(new Date()).format('YYYY-MM-DD-ss') + extMap[file.mimetype];
        const filename = 'p'+moment(new Date()).format('YYYYMMDD-')+v4() + extMap[file.mimetype];
        cb(null, filename);
    }
});

module.exports = multer({ fileFilter, storage });