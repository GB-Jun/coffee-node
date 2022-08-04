const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require("joi");
const { exit } = require("process");
const uploads = require(__dirname + "/../../modules/upload-images");

const getListHandler = async (req, res) => {
    let output = {
        perPage: 8,
        page: 1,
        totalRows: 0,
        totalPages: 0,
        code: 0,
        error: "",
        query: {},
        rows: [],
        totalData: [],
        search: "",
        showTest: "",
        sid: 0,
    };

    let page = +req.query.page || 1;
    let search = req.query.search || "";
    let where = " WHERE 1 ";

    if (search) {
        where += ` AND name LIKE ${db.escape("%" + search + "%")} `; // bug
        output.query.search = search;
        output.showTest = db.escape("%" + search + "%");
    }
    output.showTest = where; // 用於檢查篩選的結果, 可以在api查看資訊來除錯

    if (page < 1) {
        output.code = 410;
        output.error = 頁碼太小;
        return output;
        // 中間如果用了會回傳的res.動作, 要在if裡面return來結束func
        // 如果用?來寫, 代表前面的路徑都一樣
    }

    const sqlnum = `SELECT COUNT(1) totalRows FROM products ${where} ORDER BY products_sid ASC `;
    // const [result01] = await db.query(sqlnum);
    // const [[result01]] = await db.query(sqlnum);
    const [[{ totalRows }]] = await db.query(sqlnum);

    let totalPages = 0;
    if (totalRows) {
        totalPages = Math.ceil(totalRows / output.perPage);
        if (page > totalPages) {
            output.totalPages = totalPages;
            output.code = 420;
            output.error = "頁碼太大";
            return output;
        }

        const sqlData = `SELECT * FROM products ${where} ORDER BY products_sid ASC LIMIT ${
            (page - 1) * output.perPage
        }, ${output.perPage}`;
        const [result02] = await db.query(sqlData);

        // 也能在主層index.js那邊寫template helper function, 讓function大家都能用
        // result02.forEach((el) => (el.birthday2 = toDateString(el.birthday)));
        output.rows = result02;
        const totoalDataSql = `SELECT * FROM products AS p ORDER BY products_sid ASC`;
        const [resultTotal] = await db.query(totoalDataSql);
        output.totalData = resultTotal;
    }

    output.code = 200;
    output.error = "無錯誤發生";
    output = { ...output, page, totalRows, totalPages };

    return output;
};

const getCouponList = async (req, res) => {
    let output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
    };

    output.reqData = req.params.sid;
    const page_sid = req.params.sid;
    const whereSql = `WHERE (menu_sid = 0 AND products_sid = 0) OR (menu_sid <= 0 AND products_sid > 0 AND products_sid = ${page_sid}) AND coupon_status = 1`;
    const couponSql = `SELECT * FROM coupon AS c ${whereSql} ORDER BY sid ASC`;
    const [couponResult] = await db.query(couponSql);

    output.rows = couponResult;
    output.query = couponSql;

    return output;
};

const getUserLike = async (req, res) => {
    let output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
    };
    const userLikeSql = `SELECT * FROM user_like WHERE products_sid = ${req.params.sid}`;
    const [userLikeresult] = await db.query(userLikeSql);
    // console.log("getUserLike req.params",req.params.sid)
    output.query = userLikeSql;
    output.rows = userLikeresult;

    return output;
};

const sendCartData = async (req, res) => {
    let output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
        cartDataRows: [],
    };

    const cartDataSql = `SELECT cart_product_id FROM cart WHERE cart_member_id = ${req.body.member.sid} AND cart_order_id = 0`;
    const cartData = await db.query(cartDataSql);
    output.cartDataRows = cartData;
    // console.log(output.cartDataRows[0]);

    if (
        output.cartDataRows[0]
            .map((v, i) => {
                return v.cart_product_id;
            })
            .indexOf(+req.params.sid) >= 0
    ) {
        const updateSql = `UPDATE cart SET cart_quantity = ? WHERE cart_member_id = ${req.body.member.sid} AND cart_order_id = 0 AND cart_product_id = ${req.params.sid}`;
        await db.query(updateSql, [req.body.quantity]);
    } else {
        const insertSql = `INSERT INTO cart(cart_product_id, cart_price, cart_quantity, cart_member_id) VALUES (?,?,?,?)`;

        await db.query(insertSql, [
            req.params.sid,
            req.body[0].products_price,
            req.body.quantity,
            req.body.member.sid,
        ]);
        // console.log({
        //     sid: req.params.sid,
        //     price: req.body[0].products_price,
        //     quantity: req.body.quantity,
        //     membersid: req.body.member.sid,
        // });
        output.query = insertSql;
    }

    return output;
};

const sendUserLikeData = async (req, res) => {
    output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
    };

    // console.log("req.body", req.body);
    // console.log("req.params", req.params);

    const userLikeSql =
        "INSERT INTO `user_like`(`member_sid`, `products_sid`) VALUES (?,?)";
    await db.query(userLikeSql, [req.body.member.sid, req.params.sid]);
    output.query = userLikeSql;

    return output;
};

const deleteUserLike = async (req, res) => {
    output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
    };

    const delLikeSql = `DELETE FROM user_like WHERE member_sid = ${req.body.member.sid} AND products_sid = ${req.params.sid}`;
    console.log(req.body);
    await db.query(delLikeSql);
    output.query = delLikeSql;

    return output;
};

//----------------------------------------------------------------------------------

router.use((req, res, next) => {
    // top-level middleware
    next();
});

router.get("/api", async (req, res) => {
    const output = await getListHandler(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.get("/api/detail/:sid", async (req, res) => {
    const output = await getListHandler(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.get("/api/coupon/:sid", async (req, res) => {
    const output = await getCouponList(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.get("/api/userLike/:sid", async (req, res) => {
    const output = await getUserLike(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.post("/api", async (req, res) => {
    const output = await getListHandler(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.post("/api/detail/:sid", async (req, res) => {
    const output = await sendCartData(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.post("/api/userLike/:sid", async (req, res) => {
    const output = await sendUserLikeData(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

router.post("/api/delUserLike/:sid", async (req, res) => {
    const output = await deleteUserLike(req, res);
    output.payload = res.locals.payload;
    res.json(output);
});

//------------------------------------------------------------------------

module.exports = router;
