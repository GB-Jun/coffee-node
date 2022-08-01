require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const app = express();
const multer = require("multer");
// const upload = multer({ dest: "tmp-uploads" });
const upload = require(__dirname + "/modules/upload-images");
const session = require("express-session");
const moment = require("moment-timezone");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require(__dirname + "/modules/mysql-connect");
const MysqlStore = require("express-mysql-session")(session);
const sessionStore = new MysqlStore({}, db);
const { toDateString, toDateTimeString } = require(__dirname +
    "/modules/date-tools");

const cors = require("cors");

app.set("view engine", "ejs");
// 設定網址的大小寫是否有差異
app.set("case sensitive routing", true);

// ---------- Top-level middleware -----------------------------
// cors設定
const corsOptions = {
    credential: true,
    origin: (origin, cb) => {
        // console.log({ origin });
        cb(null, true);
    },
};
app.use(cors(corsOptions));

// session 的 secret是加密用的字串, 可以直接寫或是從別的地方引(像是env)
app.use(
    session({
        saveUninitialized: false,
        resave: false,
        secret: "qobdxpziehpfqhqaaodmmvlshvnbdoxf",
        store: sessionStore,
        cookie: {
            maxAge: 60000, // 1 mins
            httpOnly: false, // 限制是否只能用http的擋頭寫入
            // domain: 現在domain不能設定第三方cookie了
            // expires: expires和maxAge只會使用一個, 看誰是最後定義的來決定
        },
    })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// 做一個middleware但cb不結束他用next把資料繼續傳下去, 就會讓全部的都帶有中間插入的資訊, 或是處理過的資料
app.use((req, res, next) => {
    res.locals.topMiddleWare = "提前設定";

    // template helper functions
    res.locals.toDateString = toDateString;
    res.locals.toDateTimeString = toDateTimeString;
    res.locals.session = req.session;

    const auth = req.get("Authorization");
    res.locals.loginUser = null;
    if (auth && auth.indexOf("Bearer ") === 0) {
        const token = auth.slice(7);
        res.locals.loginUser = jwt.verify(token, process.env.JWT_SECRET);
    }

    next();
});

// ---------- route -----------------------------------------------


// middleware 中介軟體(function), 他有順序,在使用時如果要多個要用array
const bodyParser = express.urlencoded({ extended: false });
app.post("/try-post", bodyParser, (req, res) => {
    res.json(req.body);
});


// single:單一檔案, array:一個input多個檔案, fields: 多個input多個檔案, none:不上傳檔案
// app.post("/post-uploaded", upload.single("avator"), (req, res) => {
//     res.json(req.file);
// });

// app.post("/post-uploadeds", upload.array("photos"), (req, res) => {
//     res.json(req.files);
// });

// router的使用

// app.use('/frontPage', require(__dirname +'/routes/frontPage'))
app.use('/member', require(__dirname + '/routes/member/member'));
app.use('/products', require(__dirname + '/routes/products/products'));
app.use('/food', require(__dirname + '/routes/food/food'));
// app.use('/mapapi', require(__dirname + '/routes/food/mapapi'));
app.use('/course', require(__dirname + '/routes/course/course'));
app.use('/cart', require(__dirname + '/routes/cart/cart'));
app.use('/sharing', require(__dirname + '/routes/sharing/sharing'));
app.use('/Points', require(__dirname + '/routes/game/Points'));
app.use('/Points_formanager', require(__dirname + '/routes/game/Points_formanager'));
app.use('/Coupon_record_list', require(__dirname + '/routes/game/Coupon_record_list'));
app.use('/Coupon_foruser', require(__dirname + '/routes/game/Coupon_foruser'));
app.use('/SendCoupon', require(__dirname + '/routes/game/SendCoupon'));
app.use('/GetPoint', require(__dirname + '/routes/game/GetPoint'));


const path = require('path');
const dir = path.join(__dirname, 'public');
app.use(express.static(dir));

app.get("/", (req, res) => {
    res.render("main", { name: "001" });
});

// ----------- static folder --------------------------------------
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use("/joi", express.static("node_modules/joi/dist"));

// ----------- 404 ------------------------------------------------
app.use((req, res) => {
    res.send(`<h2>404 - Not Found 找不到頁面</h2>
    <img src="#" alt=""/>`);
});

// ------------ listen -----------
console.log({ port: process.env.EXPRESS_PORT });
app.listen(process.env.EXPRESS_PORT, () => {
    console.log(
        `Server started at http://localhost:${process.env.EXPRESS_PORT}`
    );
});



