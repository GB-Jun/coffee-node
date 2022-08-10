const express = require("express");
const router = express.Router();

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


router.use('/post/:post_sid', require('./postDetail'));
router.use('/post', require('./post'));
router.use('/comment', require('./comment'));
router.use('/reply', require('./reply'));
router.use('/memberlike', require('./memberlike'));

// search
router.use('/search/previewAPI', require('./search/previewAPI'));
router.use('/search/popTag', require('./search/popTag'));
router.use('/search/searchPost', require('./search/searchPost'));



module.exports = router;