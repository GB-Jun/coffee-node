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
        member_sid:0
    };
    if (!res.locals.loginUser) {
        return;
    }
    const { sid } = res.locals.loginUser;
    output.member_sid=sid;
    const sql=`select * from points_record where member_sid=1 AND to_days(create_at) = to_days(now());`;
    const [r] = await db.query(sql, [
        output.member_sid
    ]);
    output.rows = r;
    if(r.length>0){
        output.error="今天已獲得積分"
        output = {...output};
        return output;
        return
    }
output = {...output};
return output;
};


router.post('/Api-point-result', upload.none(), async(req, res)=>{
    // if(!(output.error)){
        const output = await getListHandler(req, res);
        const sql = "INSERT INTO points_record (`member_sid`,`type`,`points_get`,`create_at`) VALUES (?, 1, ?, NOW())"; 
        const {ScoreResult}=req.body;
        const [r] = await db.query(sql, [
            output.member_sid,
            ScoreResult
        ]);
    // }
    res.json(output);
});
router.get('/Api-check-point-result', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});

module.exports = router;