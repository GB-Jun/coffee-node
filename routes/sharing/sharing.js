const express = require("express");
const router = express.Router();

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


// Post
router.use('/post/:post_sid', require('./postModified'));
router.use('/post', require('./post'));
router.use('/post/new', require('./newpost'));
// Search
router.use('/search/previewAPI', require('./search/previewAPI'));
router.use('/search/popTag', require('./search/popTag'));
router.use('/search/searchPost', require('./search/searchPost'));

router.use('/comment', require('./comment'));
router.use('/reply', require('./replyAPI'));
router.use('/memberlike/:post_sid', require('./memberlike'));



module.exports = router;