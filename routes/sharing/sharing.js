const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


router.use('/post/:post_sid', require('./postDetail'));
router.use('/post', require('./post'));
router.use('/comment', require('./comment'));
router.use('/reply', require('./reply'));




module.exports = router;