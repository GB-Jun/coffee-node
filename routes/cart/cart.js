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

router.get("/read_product/api", async (req, res) => {
    const sql = `
        SELECT
            \`cart\`.\`cart_product_id\` AS 'id',
            \`cart\`.\`cart_price\` AS 'price',
            \`cart\`.\`cart_quantity\` AS 'quantity',
            \`products\`.\`products_pic\` AS 'picture',
            \`products\`.\`products_name\` AS 'name',
            \`products_with_products_categories_sid\` AS 'category'
        FROM\`cart\`
        JOIN \`products\` ON \`cart\`.\`cart_product_id\` = \`products\`.\`products_sid\`
        WHERE \`cart_member_id\` = ? AND \`cart_order_id\` = 0;
    `;
    const [result] = await db.query(sql, [1]);
    if(result.length >= 1) {
        result.forEach(item => {
            item.name = [item.name];
            item.picture = `http://localhost:3500/images/products/${item.category}/${item.picture}`;
            delete item.category;
        });
    }
    res.json(result);
});

router.get("/read_food/api", async (req, res) => {
    const sql = `
        SELECT
            \`food_id\` AS 'id',
            \`food_price\` AS 'price',
            \`food_ice\` AS 'ice',
            \`food_sugar\` AS 'sugar',
            \`food_quantity\` AS 'quantity',
            \`menu\`.\`menu_name\` AS 'name',
            \`menu\`.\`menu_photo\` AS 'picture'
        FROM \`food_choice\`
        JOIN \`menu\` ON \`food_id\` = \`menu\`.\`menu_sid\`
        WHERE \`food_member_id\` = ? AND \`food_order_id\` = 0;
    `;
    const [result] = await db.query(sql, [1]);
    result.forEach(item => {
        item.name = [item.name, item.ice, item.sugar];
        item.picture = `http://localhost:3500/images/food/${item.picture}`;
        delete item.ice;
        delete item.sugar;
    })
    
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
