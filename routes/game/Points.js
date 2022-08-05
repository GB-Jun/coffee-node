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
        perPage: 10,
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
        member_sid:0
    };
    const {sid}=res.locals.loginUser;
    output.member_sid=sid;
    let page = +req.query.page || 1;
    let type = +req.query.type || 1;

    if(page<1) {
        output.code = 410;
        output.error = '頁碼太小';
        return output;
    }

    const sql01 = `SELECT COUNT(1) totalRows FROM points_record JOIN member ON points_record.member_sid=member.member_sid WHERE points_record.type =? AND points_record.member_sid=?`;
    
    
    const [[{totalRows}]] = await db.query(sql01,[type,output.member_sid]);

    let totalPages = 0;

    if(totalRows) {
        totalPages = Math.ceil(totalRows/output.perPage);
        if(page>totalPages){
            output.totalPages = totalPages;
            output.code = 420;
            output.error = '頁碼太大';
            return output;
        }

        const sql02 = `SELECT points_record.create_at,points_record.points_get,member.member_sid FROM points_record JOIN member ON points_record.member_sid = member.member_sid WHERE points_record.type =? AND points_record.member_sid=? ORDER BY create_at DESC LIMIT ${(page-1)*output.perPage}, ${output.perPage}`;

        const [r2] = await db.query(sql02,[type,output.member_sid]);
        r2.forEach(el=> el.create_at = toDateString(el.create_at));
        output.rows = r2;
    }

    const sql03=`SELECT points_user.total_points,member.member_sid FROM points_user JOIN member ON points_user.member_sid=member.member_sid WHERE points_user.member_sid=?`;

    const [r3] = await db.query(sql03,[output.member_sid]);
    output.rows2 = r3;
    output.code = 200;
    output = {...output, page, totalRows, totalPages,type};


    return output;
};

router.get('/', async (req, res)=>{
    
    const output = await getListHandler(req, res);
    switch(output.code){
        case 410:
            return res.redirect(`?page=1`);
            break;
        case 420:
            return res.redirect(`?page=${output.totalPages}`);
            break;
    }
    res.render('points/main', output);
});

router.get('/API', async (req, res)=>{
    const output = await getListHandler(req, res);
    res.json(output);
});


module.exports = router;