const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const { now } = require("moment-timezone");
const {
    toDateString,
    toDatetimeString
} = require(__dirname + '/../../modules/date-tools');
const moment = require('moment-timezone');
const router = express.Router(); 

const getListHandler = async (req, res)=>{
    let output = {
        code: 0, 
        error: '',
        query: {},
        rows: [],
        lotteryResult:"",
        rows2: [],
        member_sid:0
    };
    if (!res.locals.loginUser) {
        return;
    }
    const { sid } = res.locals.loginUser;
    output.member_sid=sid;
    const sql=`SELECT sid,coupon_name FROM coupon WHERE coupon_status =1`;
    const [r] = await db.query(sql);
    output.rows = r;
    output.code = 200;

    //const sql2=`select * from coupon_receive where member_sid=? AND to_days(create_time) = to_days(now())`;
    const sql2=`select * from coupon_receive where member_sid=1 AND category=1 AND to_days(create_time) = to_days(now())`;
    const [r2] = await db.query(sql2, [
        output.member_sid,
    ]);
    output.rows2 = r2;
    if(r2.length>0){
        output.error="今天已抽過獎項"
        output = {...output};
        return output;
        return
    }
    let lotteryArray=r;
    let rand =Math.floor(Math.random()*lotteryArray.length);
    output.lotteryResult =lotteryArray[rand];
    output = {...output};
    return output;
    
};

router.get('/api', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});

router.get('/api-lottery-result', async (req, res)=>{
    const output = await getListHandler(req, res);
    if(!(output.error)){
        // const sql = "INSERT INTO coupon_receive (`member_sid`,`coupon_sid`,`create_time`,`end_time`,`status`) VALUES (?, ?, NOW(), NOW()+365, 0)"; 
        const sql = "INSERT INTO coupon_receive (`member_sid`,`coupon_sid`,`create_time`,`end_time`,`status`,`category`) VALUES (?, ?, NOW(), NOW()+ 365, 0, 1)"; 

        const {coupon_sid}=req.body;
        const [r] = await db.query(sql, [
            output.member_sid,
            output.lotteryResult.sid
        ]);
    }
    res.json(output);
});

module.exports = router;