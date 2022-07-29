const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/upload-images");

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");


// --------------------- 登入 ---------------------
router.post('/login', upload.none(), async(req, res) => {

    const output = {
        success: false,
        error: '',
        code: 0,
    };
    const sql = "SELECT * FROM `member` WHERE `member_account`=? ";
    const [result] = await db.query(sql, [req.body.member_account]);


    // 比對資料庫裡有沒有使用者輸入的帳密
    if (!result.length) {
        output.code = 401;
        output.error = '帳密錯誤';
        
        return res.json(output);
    }

    // 比對密碼
    output.success = bcrypt.compareSync(req.body.member_password,result[0].member_password);
    console.log(bcrypt.compareSync(req.body.member_password,result[0].member_password));
    
    if (!output.success) {
        // 密碼錯誤
        output.code = 402;
        output.error = '帳密錯誤';
        output.success = false;
        
    } else {
        // 成功登入
        const token = jwt.sign({
            sid: result[0].member_sid,
            account: result[0].member_account,
            name: result[0].member_name,
            birthday: result[0].member_birthday,
            mobile: result[0].member_mobile,
            address: result[0].member_address,
            mail: result[0].member_mail,
            level: result[0].member_level,
            avatar: result[0].avatar,
        }, process.env.JWT_SECRET);

        output.data = {
            sid: result[0].member_sid,
            token,
            account: result[0].member_account,
            name: result[0].member_name,
            birthday: result[0].member_birthday,
            mobile: result[0].member_mobile,
            address: result[0].member_address,
            mail: result[0].member_mail,
            level: result[0].member_level,
            avatar: result[0].avatar,
        };
        output.success = true;
    }

    res.json(output);
});


// --------------------- 註冊 ---------------------
router.post('/sign-up', async (req, res) => {

    const output = {
        success: false,
        error: '',
    };

    const sql = "INSERT INTO `member`(`member_name`, `member_account`, `member_password`) VALUES (?, ?, ?)";
    const sqlAccount = "SELECT `member_account` FROM `member` WHERE `member_account` = ? ";
    
    const {member_name, member_account, member_password} = req.body;

    const [result2] = await db.query(sqlAccount, [member_account]);


    // 比對有沒有資料庫裡的帳號
    if ( result2.length>0) {
        console.log(result2);
        output.error = "註冊失敗";
        return res.json(output);
    }
    else if(!member_name){
        output.error = "沒有姓名";
        res.json(output);
    }else if(!member_password){
        output.error = "沒有密碼";
        res.json(output);
    }else{
        const hashPass = await bcrypt.hash(req.body.member_password, 10);
        db.query(sql, [member_name, member_account, hashPass]);
        output.success = true;
        return res.json(output);
    }

});

// --------------------- 讀取會員資料 ---------------------
router.get('/api/user-list', async (req, res) => {

    const sid = res.locals.loginUser.sid;

    const sql = "SELECT `member_sid`,`member_name`, `member_nickname`, `member_account`, `member_password`, `member_birthday`, `member_mobile`, `member_address`, `member_mail`, `avatar` FROM `member` WHERE `member_sid` = ";
    const sqlSid = `${sid}`;
    const getUser = `${sql}${sqlSid}`
    const [results] = await db.query(getUser);

    res.json(results);
});

// --------------------- 修改密碼 ---------------------
router.post('/api/edit-password', async (req, res) => {

    const output = {
        success: false,
        error: '',
    };

    const sqlSid = `${res.locals.loginUser.sid}`;
    console.log(res.locals.loginUser.sid);

    const sql = ` SELECT member_password FROM member WHERE member_sid = ${sqlSid} `;
    const [result] = await db.query(sql);

    const newSql = ` UPDATE member SET member_password= ? WHERE member_sid = ${sqlSid} `;

    const password = bcrypt.compareSync(req.body.member_password,result[0].member_password);
    output.success = password;
    console.log(password);

    if( !output.success ){
        output.error = '舊密碼錯誤';
        output.success = false;
    }else if( req.body.member_password === req.body.confirm_password){
        output.error = '新舊密碼相同';
        output.success = false;
    }else{
        const newHashPass = await bcrypt.hash(req.body.confirm_password, 10);
        db.query(newSql, [newHashPass]);
        output.success = true;
    }

    res.json(output);
});

// --------------------- 歷史訂單 ---------------------
router.get('/order-history', async (req, res) => {
    const sql = "SELECT `order_sid`, `order_time`, `order_member_id`, `order_price`, `order_id` FROM `order` WHERE 1";
    const [results] = await db.query(sql);

    res.json(results);
});


module.exports = router;
