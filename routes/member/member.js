const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

router.post('/login',(req, res)=>{

    const output = {
        success: false,
        error: '',
        code: 0,
    };
    const sql = "SELECT * FROM member WHERE member_account=?";
    const [result1] = db.query(sql, [req.body.member_account]);

    if(! result1.length){
        // 沒有陣列長度代表比對不到資料庫裡的帳號，帳號錯誤
        output.code = 401;
        output.error = '帳密錯誤'
        return res.json(output)
    }

    output.success = bcrypt.compare(req.body.member_password, result1[0].pass_hash);
    console.log( bcrypt.compare(req.body.member_password, result1[0].pass_hash));
    if(! output.success){
        // 密碼錯誤
        output.code = 402;
        output.error = '帳密錯誤'
    }else {
        // 成功登入
        const token = jwt.sign({
            sid: result1[0].member_sid,
            account: result1[0].member_account,
        }, process.env.JWT_SECRET);

        // 前端無法解密token，所以要把需要呈現到頁面上的東西(帳號之類的)一起傳給前端
        output.data = {
            sid: result1[0].member_sid,
            token,
            account: result1[0].member_account,
        };

    }

    res.json(output);
});

module.exports = router;
