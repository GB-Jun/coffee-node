const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const extMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
};

function fileFilter(req, file, cb) {
    cb(null, !!extMap[file.mimetype]);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + "/../public/avatar");
    },
    filename: (req, file, cb) => {
        const filename = file.originalname;
        cb(null, filename);
    },
});

module.exports = multer({ fileFilter, storage });
