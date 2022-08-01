const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const { toDateString, toDateTimeString } = require(__dirname + "/../../modules/date-tools");
const moment = require("moment-timezone");
const Joi = require("joi");
const { exit } = require("process");
const uploads = require(__dirname + "/../../modules/upload-images");

router.get("/order/api", async (req, res) => {
    const sql = "SELECT * FROM `order` WHERE 1"
    const [result] = await db.query(sql);
    res.json(result);
});

router.get("/read_product/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to get product list .",
            },
        });
        return;
    }
    const { sid } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to get product list .",
            },
        });
        return;
    }
    const sql = `
        SELECT
            cart_product_id AS 'id',
            cart_price AS 'price',
            cart_quantity AS 'quantity',
            products.products_pic AS 'picture',
            products.products_name AS 'name',
            products.products_stack AS 'stocks',
            products_with_products_categories_sid AS 'category'
        FROM cart
        JOIN products ON cart_product_id = products.products_sid
        WHERE cart_member_id = ? AND cart_order_id = 0;
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        if (result.length >= 1) {
            result.forEach(item => {
                item.name = [item.name];
                item.picture = `http://localhost:3500/images/products/${item.category}/${item.picture}`;
                delete item.category;
            });
        }
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find produts",
                errorMessage: error,
            },
        });
        return;
    }
});

router.get("/read_food/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to get food list .",
            },
        });
        return;
    }
    const { sid } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to get food list .",
            },
        });
        return;
    }
    const sql = `
        SELECT
            food_id AS 'id',
            food_price AS 'price',
            food_ice AS 'ice',
            food_sugar AS 'sugar',
            food_quantity AS 'quantity',
            menu.menu_name AS 'name',
            menu.menu_photo AS 'picture'
        FROM food_choice
        JOIN menu ON food_id = menu.menu_sid
        WHERE food_member_id = ? AND food_order_id = 0;
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        if (result.length >= 1) {
            result.forEach(item => {
                item.name = [item.name, item.ice, item.sugar];
                item.picture = `http://localhost:3500/images/food/${item.picture}`;
                item.stocks = 9999;
                delete item.ice;
                delete item.sugar;
            })
        }
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find foods",
                errorMessage: error,
            },
        });
        return;
    }
});

router.get("/product_coupon/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to get product coupon .",
            },
        });
        return;
    }
    const { sid } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to get product coupon .",
            },
        });
        return;
    }
    const sql = `
        SELECT
            coupon_receive.sid AS id,
            end_time AS expire,
            coupon_name AS name,
            coupon_money AS discount,
            menu_sid AS menuId,
            products_sid AS productId
        FROM coupon_receive
        JOIN coupon ON coupon_sid = coupon.sid
        WHERE member_sid = ? AND status = 0 AND end_time >= NOW();
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        const output = result.filter(coupon => {
            if(coupon.menuId !== 0) return false;
            return true;
        })
        output.forEach(coupon => {
            coupon.expire = moment.parseZone(coupon.expire).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        });
        res.json(output);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find product coupon",
                errorMessage: error,
            },
        });
        return;
    }
});

router.get("/food_coupon/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to get food coupon .",
            },
        });
        return;
    }
    const { sid } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to get food coupon .",
            },
        });
        return;
    }
    const sql = `
        SELECT
            coupon_receive.sid AS id,
            end_time AS expire,
            coupon_name AS name,
            coupon_money AS discount,
            menu_sid AS menuId,
            products_sid AS productId
        FROM coupon_receive
        JOIN coupon ON coupon_sid = coupon.sid
        WHERE member_sid = ? AND status = 0 AND end_time >= NOW();
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        const output = result.filter(coupon => {
            if(coupon.productId !== 0) return false;
            return true;
        })
        output.forEach(coupon => {
            coupon.expire = moment.parseZone(coupon.expire).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        });
        res.json(output);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find food coupon",
                errorMessage: error,
            },
        });
        return;
    }
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
