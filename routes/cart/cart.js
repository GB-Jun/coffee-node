const express = require("express");
require("dotenv").config({ path: __dirname + "/../../.env" });
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const moment = require("moment-timezone");
const Joi = require("joi");
const sqlstring = require("sqlstring");
const _ = require("lodash");

const { DB_HOST, EXPRESS_PORT } = process.env;

// product------------------------------------------------------------------------
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
    const { sid } = res.locals.loginUser;
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
            cart_sid AS 'id',
            cart_product_id AS 'product_id',
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
                item.picture = `http://${DB_HOST}:${EXPRESS_PORT}/images/products/${item.category}/${item.picture}`;
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

router.put("/read_product/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to update product list .",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser;
    const { data } = req.body;
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
    // 一行sql
    const sql = `
        UPDATE cart SET cart_quantity = ? WHERE cart_sid = ? AND cart_member_id = ?;
    `;
    // 多行sql
    const sqls = data.map(() => sql).join("");
    // 填入 ? 的陣列
    const variables = [];
    data.forEach(item => {
        variables.push(item.quantity);
        variables.push(item.id);
        variables.push(sid);
    })
    const sqlsWithVariable = sqlstring.format(sqls, variables);
    try {
        const [result] = await db.query(sqlsWithVariable);
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

router.delete("/read_product/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to delete product list .",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser;
    const { data } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to delete product list .",
            },
        });
        return;
    }
    // 一行sql
    const sql = `
        DELETE FROM cart WHERE cart_sid = ? AND cart_member_id = ?;
    `;
    const sqlsWithVariable = sqlstring.format(sql, [data, sid]);
    try {
        const [result] = await db.query(sqlsWithVariable);
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

// food------------------------------------------------------------------------
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
    const { sid } = res.locals.loginUser;
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
            food_choice_sid AS 'id',
            food_id,
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
                item.picture = `http://${DB_HOST}:${EXPRESS_PORT}/images/food/${item.picture}`;
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

router.put("/read_food/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to update food list .",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser;
    const { data } = req.body;
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
    // 一行sql
    const sql = `
        UPDATE food_choice SET food_quantity = ? WHERE food_choice_sid = ? AND food_member_id = ?;
    `;
    // 多行sql
    const sqls = data.map(() => sql).join("");
    // 填入 ? 的陣列
    const variables = [];
    data.forEach(item => {
        variables.push(item.quantity);
        variables.push(item.id);
        variables.push(sid);
    })
    const sqlsWithVariable = sqlstring.format(sqls, variables);
    try {
        const [result] = await db.query(sqlsWithVariable);
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find food",
                errorMessage: error,
            },
        });
        return;
    }
});

router.delete("/read_food/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to delete food list .",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser;
    const { data } = req.query;
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to delete food list .",
            },
        });
        return;
    }
    // 一行sql
    const sql = `
        DELETE FROM food_choice WHERE food_choice_sid = ? AND food_member_id = ?;
    `;
    const sqlsWithVariable = sqlstring.format(sql, [data, sid]);
    try {
        const [result] = await db.query(sqlsWithVariable);
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find food .",
                errorMessage: error,
            },
        });
        return;
    }
});

// product_coupon------------------------------------------------------------------------
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
    const { sid } = res.locals.loginUser;
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
        WHERE member_sid = ? AND status = 0 AND end_time >= NOW() AND NOT menu_sid != 0;
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        result.forEach(coupon => {
            coupon.expire = moment.parseZone(coupon.expire).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        });
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find product coupon .",
                errorMessage: error,
            },
        });
        return;
    }
});

// food_coupon------------------------------------------------------------------------
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
    const { sid } = res.locals.loginUser;
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
        WHERE member_sid = ? AND status = 0 AND end_time >= NOW() AND NOT products_sid != 0;
    `;

    try {
        const [result] = await db.query(sql, [sid]);
        result.forEach(coupon => {
            coupon.expire = moment.parseZone(coupon.expire).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        });
        res.json(result);
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't find food coupon .",
                errorMessage: error,
            },
        });
        return;
    }
});

// 購物車數量

router.get("/cart_count/api", async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify to get quantity .",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser || { sid: 1 };
    // 檢查sid
    if (sid === undefined) {
        res.status(401).send({
            error: {
                status: 401,
                message: "There's no sid to get quantity .",
            },
        });
        return;
    }
    const sqlProduct = `
        SELECT COUNT(1) AS productCount FROM cart WHERE cart_member_id = ? AND cart_order_id = 0;
    `;

    const sqlFood = `
        SELECT COUNT(1) AS foodCount FROM food_choice WHERE food_member_id = 1 AND food_order_id = 0;
    `;

    try {
        const productResult = db.query(sqlProduct, [sid]);
        const foodResult = db.query(sqlFood, [sid]);

        const [[[{ productCount }]], [[{ foodCount }]]] = await Promise.all([productResult, foodResult]);
        const cartTotalCount = productCount + foodCount
        res.json({ cartTotalCount });
        return;
    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response . Can't get quantity .",
                errorMessage: error,
            },
        });
        return;
    }
});



// 測試連線用 記得刪除
router.get("/order/api", async (req, res) => {
    const sql = "SELECT * FROM `order` WHERE 1"
    const [result] = await db.query(sql);
    res.json(result);
});

module.exports = router;
