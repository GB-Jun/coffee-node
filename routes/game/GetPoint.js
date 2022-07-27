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
const fake_user = 1;
// ====================


const getListHandler = async (req, res)=>{
    let output = {
        code: 0, 
        error: '',
        query: {},
        rows: [],
        PointResult:"",
        rows2: [],

    };
    const sql=`SELECT sid,coupon_name FROM coupon `;
    const [r] = await db.query(sql);
    output.rows = r;
    output.code = 200;


    const sql2=`select * from coupon_receive where member_sid=? AND to_days(create_time) = to_days(now());`;
    const {member_sid}=req.body;
    const [r2] = await db.query(sql2, [
        fake_user
    ]);
    output.rows2 = r2;
    console.log(r2);
    // if(r2.length>0){
    //     output.error="今天已抽過獎項"
    //     output = {...output};
    //     return output;
    //     return
    // }
// ========================================================

output.lotteryResult =
output = {...output};
return output;
};
// ====================

router.post('/Api-point-result', upload.none(), async(req, res)=>{
    const output = await getListHandler(req, res);
    const sql = "INSERT INTO points_record (`member_sid`,`type`,`points_get`,`create_at`) VALUES (?, 1, ?, NOW())"; 
    const {member_sid,ScoreResult}=req.body;
    const [r] = await db.query(sql, [
        fake_user,
        ScoreResult
    ]);
    res.json(output);
    console.log(123);
    console.log(r);
    console.log(ScoreResult);
});


module.exports = router;