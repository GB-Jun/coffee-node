const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const { now } = require("moment-timezone");
const {
    toDateString,
    toDatetimeString
} = require(__dirname + '/../../modules/date-tools');
const moment = require('moment-timezone');
const upload = require(__dirname + "/../../modules/upload-images");
const router = express.Router(); 

const getListHandler = async (req, res)=>{
    let output = {
        code: 0, 
        error: '',
        query: {},
        rows: [],
        rows2: [],
        member_sid:0
    };
    if (!res.locals.loginUser) {
        return;
    }
    const { sid } = res.locals.loginUser;
    output.member_sid=sid;

    const sql=`SELECT total_points FROM points_user WHERE member_sid=?;`;
    const [r] = await db.query(sql, [
        output.member_sid
    ]);
    output.rows = r;
    // SELECT voucher_amount FROM points_user WHERE member_sid=1;
    const sql2=`SELECT voucher_amount FROM points_user WHERE member_sid=?;`;
    const [r2] = await db.query(sql2, [
        output.member_sid
    ]);
    output.rows2 = r2;
    output = {...output};
    return output;
};


router.get('/API', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});

router.post('/Api-Points-To-Coupon-result', upload.none(), async(req, res)=>{
    const output = await getListHandler(req, res);
    const sql = "INSERT INTO coupon_receive (`member_sid`,`coupon_sid`,`create_time`,`end_time`,`status`,`category`) VALUES (?, 3, NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY),0, 2)"; 
    const [r] = await db.query(sql, [
        output.member_sid
    ]);
    const sql2 = "UPDATE points_user SET `total_points`=?,`voucher_amount`=? WHERE `member_sid`=?"; 
    const {theLeftPoints,theAmount}=req.body;
    const [r2] = await db.query(sql2, [
        theLeftPoints,theAmount,output.member_sid
    ]);
    const sql3 ="INSERT INTO points_record (`member_sid`,`type`,`points_get`,`create_at`) VALUES (?, 2, -300, NOW())";
    const [r3] = await db.query(sql3, [
        output.member_sid
    ]);
    res.json(output);
});
module.exports = router;
