const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

router.post('/login', (req, res) => {

    const output = {
        success: false,
        error: '',
        code: 0,
    };
    const sql = "SELECT * FROM member WHERE member_account=?";
    const [result] = db.query(sql, [req.body.member_account]);

    if (!result.length) {
        // 沒有陣列長度代表比對不到資料庫裡的帳號，帳號錯誤
        output.code = 401;
        output.error = '帳密錯誤';
        return res.json(output);
    }

    output.success = bcrypt.compare(req.body.member_password, result[0].pass_hash);
    console.log(bcrypt.compare(req.body.member_password, result[0].pass_hash));
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

    }

    res.json(output);
});

// ------------------ 頭貼上傳 ------------------ 
// router.post('/upload', upload.single('avatar'),(req,res)=>{
//     res.json(req.file);
// })

module.exports = router;
