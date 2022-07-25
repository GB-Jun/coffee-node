const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const { toDateString, toDateTimeString } = require(__dirname + "/../../modules/date-tools");
const moment = require("moment-timezone");
const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");

router.get("/order/api", async (req, res) => {
    const sql = "SELECT * FROM `order` WHERE 1"
    const [result] = await db.query(sql);
    res.json(result);
});


// 有 token 才給過
// router.get('/api-auth', async (req, res)=>{
//     let output = {
//         success: false,
//         error: ''
//     };

//     if(res.locals.loginUser && res.locals.loginUser.account){
//         output = {...(await getListHandler(req, res)), success: true};

//     } else {
//         output.error = '沒有授權';
//     }
//     output.loginUser = res.locals.loginUser;
//     res.json(output);
// });
module.exports = router;
