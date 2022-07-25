
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
