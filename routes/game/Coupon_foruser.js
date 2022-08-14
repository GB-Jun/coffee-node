const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const {
    toDateString,
    toDatetimeString
} = require(__dirname + '/../../modules/date-tools');
const moment = require('moment-timezone');
const router = express.Router(); 

const getListHandler = async (req, res)=>{
    let output = {
        perPage: 5,
        page: 1,
        totalRows: 0,
        totalPages: 0,
        code: 0, 
        error: '',
        query: {},
        rows_type1:[],
        // type:1,
        toDateString,
        rows_type2_expired:[],
        rows_type2_used:[],
        sid:req.query.sid,
        member_sid:0
    };
    const {sid}=res.locals.loginUser;

    output.member_sid=sid;


        const sql=`SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.member_sid=? AND coupon_receive.status=0 AND coupon_receive.end_time> NOW() ORDER BY end_time DESC;`;
        const [rows_type1]=await db.query(sql,[output.member_sid]);
        output.rows_type1=rows_type1;
        
        const sql1=`SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.status,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.member_sid=1 AND coupon_receive.end_time <NOW() AND coupon_receive.status=0 AND coupon_receive.end_time>0 ORDER BY end_time DESC;`;
        const [rows_type2_expired]=await db.query(sql1,[output.member_sid]);
        output.rows_type2_expired=rows_type2_expired;


        const sql2=`SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.status,coupon_logs.used_time,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.member_sid=1 AND coupon_receive.status=1 and coupon_logs.used_time>0 ORDER BY used_time DESC;`;
        const [rows_type2_used]=await db.query(sql2,[output.member_sid]);
        output.rows_type2_used=rows_type2_used;
        return output;
    

};

router.get('/API', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});

module.exports = router;