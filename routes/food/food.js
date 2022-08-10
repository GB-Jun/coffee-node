const express = require('express');
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const nodemailer = require("nodemailer");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { verify } = require("crypto");

router.get('/', async (req, res) => {
    const sql = "SELECT * FROM menu";
    const [r] = await db.query(sql);

    res.json(r);
});

// 訂位成功的通知信
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.EMAIL_ACCOUNT,
        pass: process.env.EMAIL_PASS,
    },
});

router.post('/send_mail', async (req, res) => {
    const output = {
        success: false,
        error: '',
    };
    output.success = true;

    const { branch, people, checkedDate, mail, name } = req.body;


    transporter.sendMail({
        from: '"來拎嘎逼" <mfee26Coffee@gmail.com>',
        to: `${mail}`,
        subject: '【來拎+B-訂位成功信】',
        html: `<table style="border:1px solid #000;border-radius:5px; font-size:16px;color:rgb(37, 57, 69)">
        <tr style="border:1px solid #000">
            <td style="border:1px solid #000"><h3>用餐分店</h3></td>
            <td style="border:1px solid #000"><h3>${branch}</h3></td>
        </tr>
        <tr style="border:1px solid #000">
            <td style="border:1px solid #000"><h3>用餐人數</h3></td>
            <td style="border:1px solid #000"><h3>${people}位</h3></td>
        </tr>
        <tr style="border:1px solid #000">
            <td style="border:1px solid #000"><h3>用餐日期</h3></td>
            <td style="border:1px solid #000"><h3>${checkedDate}</h3></td>
        </tr>
    </table>`
        ,
    }).then(() => {
        // console.log(hashRandom);
    }).catch();
    return res.json(output);
}

);

// SELECT * FROM`主表單`
// JOIN 要連結的表單
// ON `主表單`.`主表的外鍵欄位` = `要連結的表單`.`要連結的表單的PK`


const sendCartData = async (req, res) => {
    let output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
        cartDataRows: [],
    };

    const cartDataSql = `SELECT food_id FROM food_choice WHERE food_member_id = ${req.body.member.sid} AND food_order_id = 0`;
    const cartData = await db.query(cartDataSql);
    output.cartDataRows = cartData;
    console.log(output.cartDataRows[0]);

    if (output.cartDataRows[0].map((v, i) => {
        return v.cart_product_id;
    }).indexOf(+req.params.sid) >= 0) {
        const updateSql = `UPDATE cart SET food_quantity = ? WHERE food_member_id = ${req.body.member.sid} AND food_order_id = 0 AND food_food_id = ${req.params.sid}`;
        await db.query(updateSql, [req.body.quantity]);
    } else {
        const insertSql = `INSERT INTO food_choice(food_id, food_price, food_ice_id, food_sugar_id, food_quantity, food_member_id, food_order_id, food_time_id, food_store_id) VALUES (?,?,?,?,?,?,?,?,?)`;
        await db.query(insertSql, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        output.query = insertSql;
    }
    return output;
};

router.post('/addfooddata', async (req, res) => {
    const insertSql = `INSERT INTO food_choice(food_id, food_price, food_ice_id, food_sugar_id, food_quantity, food_member_id, food_order_id, food_time_id, food_store_id) VALUES ?`;
    const createItem = (item) => ([
        item.menu_sid,
        Number(item.menu_price_m),
        Number(item.ice),
        Number(item.sugar),
        item.foodCount,
        `${req.body.member.sid}`, `${0}`,
        req.body.standardTime,
        req.body.store_sid
    ]);

    const values = req.body.dataFromFoodDetail.map(createItem);

    const r1 = await db.query(insertSql, [values], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
    });
    res.json({ success: true });
});

module.exports = router;