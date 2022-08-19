const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const router = express.Router(); 


const getListHandler = async (req, res)=>{
    let output = {
        code: 0, 
        error: '',
        query: {},
        rows: [],
    };

    let search = req.query.account || '';
    let where = ' ';

    if(search){
        where += ` WHERE member.member_account= ${ db.escape(search) } `;
        output.query.search = search;
    }

    const sql=`SELECT points_user.total_points,points_user.voucher_amount,member.member_sid,member.member_account FROM points_user JOIN member ON points_user.member_sid=member.member_sid ${where}`;

    // console.log(sql)

    const [r] = await db.query(sql);


    output.rows = r;

    // =======
    output.code = 200;
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
    res.render('points_formanager/main', output);
});



module.exports = router;