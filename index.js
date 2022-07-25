require("dotenv").config();
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
        console.log({ origin });
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
app.get("/try-qs", (req, res) => {
    res.json(req.query);
});

app.get("/try-params1/:action/:id", (req, res) => {
    res.json({ code: 2, params: req.params });
});
app.get("/try-params1/:action/", (req, res) => {
    res.json({ code: 3, params: req.params });
});
app.get("/try-params1/:action?/:id?", (req, res) => {
    res.json({ code: 1, params: req.params });
});
// app.get("/try-params1/*/*?", (req, res) => {
//     res.json({ code: 0, params: req.params });
// });

app.get(/^\/Hi\/?/i, (req, res) => {
    res.json({ code: "reg", url: req.url });
});
app.get(["/aaa", "/bbb"], (req, res) => {
    res.json({ code: "array", url: req.url });
});

app.get("/try-json", (req, res) => {
    const data = require(__dirname + "/data/data01");
    // 不用再用json parse 會直接幫忙轉換成array
    console.log(data);
    res.locals.rows = data;
    res.render("try-json");
});

app.get("/try-moment", (req, res) => {
    const fm = "YYYY-MM-DD HH:mm:ss";
    const m1 = moment();
    const m2 = moment("2022-02-29");
    const m3 = moment("2022-02-28");

    res.json({
        m1: m1.format(fm),
        m1a: m1.tz("Europe/London").format(fm),
        m2: m2.format(fm),
        m2a: m2.tz("Europe/London").format(fm),
        m3: m3.format(fm),
        m3a: m3.tz("Europe/London").format(fm),
    });
});

// middleware 中介軟體(function), 他有順序,在使用時如果要多個要用array
const bodyParser = express.urlencoded({ extended: false });
app.post("/try-post", bodyParser, (req, res) => {
    res.json(req.body);
});

app.post("/post", (req, res) => {
    res.end(`<h2>Post here</h2>`);
});

// app.route可以先設定路徑, 之後再分別設定方法
app.route("/try-post-form")
    .get((req, res) => {
        res.render("try-post-form");
    })
    .post((req, res) => {
        // 從用戶寄來的資料裡的body拿email, admin_password展開設定, 然後在render時放回資料
        const { email, admin_password } = req.body;
        res.render("try-post-form", { email, admin_password });
    });

// single:單一檔案, array:一個input多個檔案, fields: 多個input多個檔案, none:不上傳檔案
app.post("/post-uploaded", upload.single("avator"), (req, res) => {
    res.json(req.file);
});

app.post("/post-uploadeds", upload.array("photos"), (req, res) => {
    res.json(req.files);
});

// router的使用
// const adminsRouter = require(__dirname + "/routes/admins");
// 這邊是把router當middleware使用
// prefix 路徑前綴
// app.use("/admins", adminsRouter);
// app.use(adminsRouter);

// session 設定my_var來計算啟動
app.get("/try-session", (req, res) => {
    req.session.my_var = req.session.my_var || 0;
    req.session.my_var++;
    res.json({
        my_var: req.session.my_var,
        session: req.session,
    });
});

// app.use('/frontPage', require(__dirname +'/routes/frontPage'))
// app.use('/member', require(__dirname +'/routes/member'))
// app.use('/product', require(__dirname +'/routes/product'))
// app.use('/food', require(__dirname +'/routes/food'))
// app.use('/course', require(__dirname +'/routes/course'))
// app.use('/cart', require(__dirname +'/routes/cart'))
// app.use('/sharing', require(__dirname +'/routes/sharing'))
// app.use('/game', require(__dirname +'/routes/game'))

// 從後端直接爬資料
app.get("/yahoo", async (req, res) => {
    axios.get("https://tw.yahoo.com/").then(function (response) {
        // handle success
        console.log(response);
        res.send(response.data);
    });
});

app.get("/logout", (req, res) => {
    delete req.session.admin;
    res.redirect("/");
});

app.route("/login-jwt")
    .get(async (req, res) => {
        res.render("login-jwt");
    })
    .post(async (req, res) => {
        const output = {
            success: false,
            error: "",
            code: 0,
            data: {},
        };
        const sql = "SELECT * FROM admin WHERE account=?";
        const [r1] = await db.query(sql, [req.body.account]);

        if (!r1.length) {
            // 帳號錯誤
            output.code = 401;
            output.error = "帳密錯誤";
            return res.json(output);
        }
        //const row = r1[0];

        output.success = await bcrypt.compare(
            req.body.password,
            r1[0].pass_hash
        );
        if (!output.success) {
            // 密碼錯誤
            output.code = 402;
            output.error = "帳密錯誤";
        } else {
            // 成功登入
            const token = jwt.sign(
                {
                    sid: r1[0].sid,
                    account: r1[0].account,
                },
                process.env.JWT_SECRET
            );

            output.data = {
                sid: r1[0].sid,
                token,
                account: r1[0].account,
            };
        }

        res.json(output);
    });

app.route("/login")
    // app.route("/login-jwt")
    .get(async (req, res) => {
        res.render("login");
        // res.render("login-jwt");
    })
    .post(async (req, res) => {
        const output = {
            success: false,
            error: "",
            code: 0,
        };

        const sql = "SELECT * FROM admins WHERE admin_account=?";
        const [result01] = await db.query(sql, [req.body.admin_account]);

        if (!result01.length) {
            // 帳號錯誤
            output.code = 401;
            output.error = "帳密錯誤";
            return res.json(output);
        }

        // const row = result01[0];

        output.success = await bcrypt.compare(
            req.body.admin_password,
            row.pass_hash
        );

        if (!output.success) {
            output.code = 402;
            output.error = "帳密錯誤";
        } else {
            // 成功登入
            const token = jwt.sign(
                {
                    admin_sid: r1[0].admin_sid,
                    admin_account: r1[0].admin_account,
                },
                process.env.JWT_SECRET
            );
            // req.session.admin = {
            //     sid: row.sid,
            //     admin_account: row.admin_account,
            // };
        }

        res.json(output);
    });

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
    <img src="/imgs/404-error-page01.jpg" alt=""/>`);
});

// ------------ listen -----------
app.listen(process.env.EXPRESS_PORT, () => {
    console.log(
        `Server started at http://localhost:${process.env.EXPRESS_PORT}`
    );
});
