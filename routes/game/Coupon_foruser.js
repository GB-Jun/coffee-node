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
        rows: [],
        type:1,
        toDateString,
        rows2: [],
        sid:req.query.sid,
        member_sid:0
    };
    const {sid}=res.locals.loginUser;

    output.member_sid=sid;
    
    let page = +req.query.page || 1;
    let type = +req.query.type || 1;

    if(type==1){
        if(page<1) {
            output.code = 410;
            output.error = '頁碼太小';
            return output
        }
        const t_sql = `SELECT COUNT(1) totalRows FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid WHERE coupon_receive.end_time> NOW() AND coupon_receive.status=0 AND coupon_receive.member_sid=?`;
        const [[{totalRows}]] = await db.query(t_sql,[output.member_sid]);
    
        let totalPages = 0;
    
        if (totalRows) {
            totalPages = Math.ceil(totalRows/output.perPage);
            if(page>totalPages){
                output.totalPages = totalPages;
                output.code = 420;
                output.error = '頁碼太大';
                return output;
            }
            const sql = `SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.status FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid WHERE coupon_receive.end_time >NOW() AND coupon_receive.status =0 AND coupon_receive.member_sid=? ORDER BY end_time DESC `;
            // LIMIT ${(page-1)*output.perPage}, ${output.perPage}
            const [r2] = await db.query(sql,[output.member_sid]);
            output.rows = r2;
        }
        const sql_points =`SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.status,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.member_sid=?`;
    
        const [r3] = await db.query(sql_points,[output.member_sid]);
        output.rows2 = r3;
        return output;
    
    }else{
        if(page<1) {
            output.code = 410;
            output.error = '頁碼太小';
            return output
        }
        const t_sql = `SELECT COUNT(1) totalRows FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.end_time <NOW() OR  coupon_logs.used_time >0  AND coupon_receive.member_sid=?`;
        const [[{totalRows}]] = await db.query(t_sql,[output.member_sid]);
        let totalPages = 0;
    
        if (totalRows) {
            totalPages = Math.ceil(totalRows/output.perPage);
            if(page>totalPages){
                output.totalPages = totalPages;
                output.code = 420;
                output.error = '頁碼太大';
                return output;
            }
            const sql4 = `SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.status,coupon_logs.used_time,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE  coupon_receive.end_time < NOW() OR coupon_logs.used_time >0 AND coupon_receive.member_sid=? `;
            // LIMIT ${(page-1)*output.perPage}, ${output.perPage}
            const [r4] = await db.query(sql4,[output.member_sid]);
            output.rows = r4;
        }
        
        const sql_points = `SELECT coupon.coupon_name,coupon.coupon_money,coupon_receive.end_time,coupon_receive.status,coupon_logs.used_time,coupon_receive.member_sid FROM coupon_receive JOIN coupon ON coupon_receive.coupon_sid=coupon.sid LEFT JOIN coupon_logs ON coupon_receive.sid=coupon_logs.coupon_receive_sid JOIN member ON coupon_receive.member_sid=member.member_sid WHERE coupon_receive.member_sid=?`;
    
        const [r5] = await db.query(sql_points,[output.member_sid]);
        output.rows2 = r5;
        output.code = 200;
        output = {...output, page, totalRows, totalPages,type};
        return output;
    }

};

router.get('/API', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});

module.exports = router;