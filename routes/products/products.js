const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const { toDateString, toDateTimeString } = require(__dirname +
    "/../../modules/date-tools");
const moment = require("moment-timezone");
const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");

const getListHandler = async (req, res) => {
    let output = {
        perPage: 5,
        page: 1,
        totalRows: 0,
        totalPages: 0,
        code: 0,
        error: "",
        query: {},
        rows: [],
        search: "",
        showTest: "",
    };
    let page = +req.query.page || 1;

    // let beginDate = req.query.beginDate || "";
    // let endDate = req.query.endDate || "";
    let search = req.query.search || "";
    let where = " WHERE 1 ";
    if (search) {
        where += ` AND name LIKE ${db.escape("%" + search + "%")} `; // bug
        output.query.search = search;
        output.showTest = db.escape("%" + search + "%");
    }
    // if (beginDate) {
    //     const mo = moment(beginDate);
    //     if (mo.isValid()) {
    //         where += ` AND birthday >= '${mo.format("YYYY-MM-DD")}'  `;
    //         output.query.beginDate = mo.format("YYYY-MM-DD");
    //     }
    // }
    // if (endDate) {
    //     const mo = moment(endDate);
    //     if (mo.isValid()) {
    //         where += ` AND birthday <= '${mo.format("YYYY-MM-DD")}'  `;
    //         output.query.endDate = mo.format("YYYY-MM-DD");
    //     }
    // }
    output.showTest = where; // 用於檢查篩選的結果, 可以在api查看資訊來除錯

    if (page < 1) {
        output.code = 410;
        output.error = 頁碼太小;
        return output;
        // 中間如果用了會回傳的res.動作, 要在if裡面return來結束func
        // 如果用?來寫, 代表前面的路徑都一樣
    }

    const sqlnum = `SELECT COUNT(1) totalRows FROM products ${where} ORDER BY products_sid DESC `;
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

        const sqlData = `SELECT * FROM products ${where} ORDER BY products_sid DESC LIMIT ${
            (page - 1) * output.perPage
        }, ${output.perPage}`;
        const [result02] = await db.query(sqlData);

        // 也能在主層index.js那邊寫template helper function, 讓function大家都能用
        // result02.forEach((el) => (el.birthday2 = toDateString(el.birthday)));
        output.rows = result02;
    }

    output.code = 200;
    output.error = "無錯誤發生";
    output = { ...output, page, totalRows, totalPages };

    return output;
};

router.use((req, res, next) => {
    // 直接用top-level來擋沒有登入管理者
    /*
    if(! req.session.admin){
        return res.redirect('/');
    }
    */

    next();
});

// router.get("/add", async (req, res) => {
//     if (!req.session.admin) {
//         return res.redirect("/");
//     }
//     res.render("address-book/add");
// });
// router.post("/add", uploads.none(), async (req, res) => {
//     if (!req.session.admin) {
//         return res.json({ success: false, error: "請先登入" });
//         // 要記得post也要擋
//     }
    // const schema = Joi.object({
    //     name: Joi.string().min(3).max(30).required().label("姓名必填"),
    //     email: Joi.string().email().required(),
    //     mobile: Joi.string(),
    //     birthday: Joi.any(),
    //     // any 後面還可以設定optional()
    //     address: Joi.string(),
    // });

    // console.log(schema.validate(req.body, { abortEarly: false }));

    // const sql =
    //     "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?, NOW())";
    // const { name, email, mobile, birthday, address } = req.body;
    // const [result] = await db.query(sql, [
    //     name,
    //     email,
    //     mobile,
    //     birthday,
    //     address,
    // ]);

//     const sql = "INSERT INTO `address_book` SET ?";
//     const inserData = { ...req.body, created_at: new Date() };
//     const [result] = await db.query(sql, [inserData]);
// });

// router.get("/", async (req, res) => {
//     const output = await getListHandler(req, res);
//     switch (output.code) {
//         case 410:
//             return res.redirect(`?page=1`);
//             break;
//         case 420:
//             return res.redirect(`?page=${output.totalPages}`);
//             break;
//     }
//     // 在不同的權限(有沒有登入) 能看到的東西不一樣
//     if (!req.session.admin) {
//         res.render("address-book/main-noadmin", output);
//     } else {
//         res.render("address-book/main", output);
//     }
// });

router.get("/api", async (req, res) => {
    const output = await getListHandler(req, res);
    output.payload = res.locals.payload
    res.json(output);
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
