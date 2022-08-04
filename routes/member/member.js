const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/upload-images");

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");


// --------------------- 登入 ---------------------
router.post('/api/login', upload.none(), async(req, res) => {

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
            nickname: result[0].member_nickname,
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
            nickname: result[0].member_nickname,
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
router.post('/api/sign-up', async (req, res) => {

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

    const output = {
        success: false,
        error: '',
    };

    if (!res.locals.loginUser){
        output.error = "沒登入";
        return;
    }
    const sid = res.locals.loginUser.sid;

    const sql = "SELECT `member_sid`,`member_name`, `member_nickname`, `member_account`, `member_password`, `member_birthday`, `member_mobile`, `member_address`, `member_mail`, `member_level`, `avatar` FROM `member` WHERE `member_sid` = ";
    const sqlSid = `${sid}`;
    const getUser = `${sql}${sqlSid}`
    const [results] = await db.query(getUser);

    res.json(results);
});
// --------------------- 編輯會員資料 ---------------------
router.post('/api/edit-user-list', async (req, res)=>{
    const output = {
        success: false,
        error: '',
    };
    
    const sqlSid = `${res.locals.loginUser.sid}`;
    const sql = `UPDATE member SET member_name=?,member_nickname=?,member_birthday=?,member_mobile=?,member_address=?,member_mail=? WHERE member_sid = ${sqlSid}`;

    if (!res.locals.loginUser){
        output.error = "沒登入";
        return;
    }
        // console.log(req.body);
        const { member_name, member_nickname, member_birthday,member_mobile,member_address, member_mail } = req.body;
        const [result] = await db.query(sql, [member_name, member_nickname, member_birthday, member_mobile, member_address, member_mail]);

    // UPDATE之後若成功影響rows，要把編輯完的資料 editResult 回傳給前端
    if(result.affectedRows >= 1 ){

        const newSql = "SELECT `member_sid`,`member_name`, `member_nickname`, `member_account`, `member_password`, `member_birthday`, `member_mobile`, `member_address`, `member_mail` FROM `member` WHERE `member_sid` = ";
        const getUserList = `${newSql}${sqlSid}`;
    
        const [[editResult]] = await db.query(getUserList);
    
        console.log(editResult);
        output.success = "true";
        output.data = editResult;
        res.json(output);
        return;
    }
    res.json(output);

})

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
        output.passError = '舊密碼錯誤';
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

// --------------------- 上傳頭貼 ---------------------
router.post('/api/avatar-upload', upload.single('avatar'), async(req, res) => {
    const sqlSid = `${res.locals.loginUser.sid}`;
    const sql = ` UPDATE member SET avatar= ? WHERE member_sid = ${sqlSid} `;

    // 有沒有重複？
    const sqlAvatar = ` SELECT avatar FROM member WHERE member_sid = ${sqlSid} `;
    const [[preAvatar]] = await db.query(sqlAvatar, [req.file.filename]);

    const output = {
        success: false,
        error: '頭貼重複',
    };

    // console.log(preAvatar.avatar !== req.file.filename);

    if( preAvatar.avatar == req.file.filename ){
        console.log(preAvatar.avatar);
        console.log(req.file.filename);
        res.json(output);
        console.log(1);
    }else{
        const [avatarResult] =  await db.query(sql, [req.file.filename]);
        if(avatarResult.affectedRows >= 1){
            output.success = true;
        }
        res.json(output);
        console.log(2);
    }

    // console.log(req.file); // 存到 public的avatar資料夾裡拿到的檔名會是req.file.filename
});

// --------------------- 歷史訂單 ---------------------
router.get('/api/order-history', async (req, res) => {
    const sqlSid = `${res.locals.loginUser.sid}`;
    const sql = "SELECT `order_sid`, `order_time`, `order_member_id`, `order_price`, `order_id` FROM `order` WHERE `order_member_id` = ";
    const orderSql = `${sql}${sqlSid}`

    const [results] = await db.query(orderSql);
    res.json(results);
});

// --------------------- 歷史訂單詳細 ---------------------



// --------------------- 會員收藏 ---------------------
router.get('/api/member-likes', async (req, res) => {

    // const output = {
    //     success: false,
    //     error: '沒有收藏',
    // };

    const sqlSid = `${res.locals.loginUser.sid}`;
    const sql = `SELECT products_sid FROM user_like WHERE member_sid = ${sqlSid}`;

    const [results] = await db.query(sql);
    // console.log(results[0].products_sid);
    if(!results[0]){
        res.json(false);
        return;
    }

    const sqlBase = "SELECT products_sid, products_name, products_price, products_with_products_categories_sid, products_pic FROM products WHERE "
    const sqlMap = results.map((item)=>{
        return `products_sid = ${item.products_sid}`
    }).join(" OR ")

    const sql2 = sqlBase+sqlMap;
    console.log(sql2);

    const [results2] = await db.query(sql2);

    res.json(results2);
});

router.delete('/api/member-delete-likes', async (req, res) => {

    const output = {
        success: false,
        error: '',
    };

    console.log(req.query.data);
    const sqlSid = `${res.locals.loginUser.sid}`;
    const delLikeSql = `DELETE FROM user_like WHERE member_sid = ${sqlSid} AND products_sid = ${req.query.data}`;
    const [delResult] = await db.query(delLikeSql);

    if(delResult.affectedRows >= 1){
        output.success=true;
    }
    res.json(output);
});


module.exports = router;
