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


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/test');
    },
    filename: function (req, file, cb) {
        const filename = 'p'+moment(new Date()).format('YYYYMMDD-')+v4() + extMap[file.mimetype];
        cb(null, filename);
    }
});

module.exports = multer({ fileFilter, storage });