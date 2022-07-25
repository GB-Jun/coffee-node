const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/upload-images");

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");



router.post('/login', upload.none(), async(req, res) => {

    const output = {
        success: false,
        error: '',
        code: 0,
    };
    const sql = "SELECT * FROM `member` WHERE `member_account`=?";
    const [result] = await db.query(sql, [req.body.member_account]);


    if (!result.length) {
        output.code = 401;
        output.error = '帳密錯誤';
        return res.json(output);
    }

    output.success = bcrypt.compare(req.body.member_password, result[0].member_password);

    if (!output.success) {
        // 密碼錯誤
        output.code = 402;
        output.error = '帳密錯誤';
    } else {
        // 成功登入
        const token = jwt.sign({
            sid: result[0].member_sid,
            account: result[0].member_account,
        }, process.env.JWT_SECRET);

        output.data = {
            sid: result[0].member_sid,
            token,
            account: result[0].member_account,
        };
        output.success = true;
    }

    res.json(output);
});



router.post('/sign-up', async (req, res) => {

    const output = {
        success: false,
        error: '',
    };

    const sql = "INSERT INTO `member`(`member_name`, `member_account`, `member_password`) VALUES (?, ?, ?)";
    const {member_name, member_account, member_password} = req.body;
    const [result] = await db.query(sql, [member_name, member_account, member_password]);

    req.body.member_password = bcrypt.hashSync(req.body.member_password, 10);

    if (!result.length) {
        output.error = '註冊失敗';
        return res.json(output);
    }else{
        output.success = true;
    }


});



router.get('/order-history', async (req, res) => {
    const sql = "SELECT `order_sid`, `order_time`, `order_member_id`, `order_price`, `order_id` FROM `order` WHERE 1";
    const [results] = await db.query(sql);

    res.json(results);
});


module.exports = router;
