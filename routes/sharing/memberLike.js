const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../modules/mysql-connect");

let post_sid, member_sid = 0;

router.use("", async (req, res, next) => {
    if (!res.locals.loginUser) {
        console.log("first")
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    } else if (!req.params.post_sid) {
        console.log("2first")
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else {
        console.log("3first")
        member_sid = res.locals.loginUser.sid;
        post_sid = req.params.post_sid;
        next();
    }
});

router.get("/", async (req, res) => {
    const op = {
        success: false,
        error: '',
        request: member_sid || '',
        liked: 0,
        total: 0
    };
    if (!member_sid) {
        res.json(op)
        return
    }
    const sql = `
    SELECT COUNT(*) AS liked FROM member_likes
    WHERE post_sid = ? AND member_sid = ?;
    `
    try {
        const [[r]] = await db.query(sql, [post_sid, member_sid]);
        const totalSql = `SELECT likes AS total FROM post WHERE sid = ?`
        const [[r2]] = await db.query(totalSql, [post_sid]);
        op.liked = r.liked;
        op.total = r2.total;
        op.success = true;
        res.json(op);
    } catch (error) {
        res.json(op);
        return;
    }


});

router.post("/", async (req, res) => {
    console.log(post_sid, ",", member_sid);

    const op = {
        success: false,
        error: '',
        request: member_sid || ''
    };
    if (!member_sid) {
        res.json(op)
        return
    }
    const sql = `
    INSERT INTO member_likes (member_sid, post_sid) VALUES (?, ?);
    UPDATE post SET likes = likes + 1 WHERE sid = ?;
    `;

    try {
        await db.query(sql, [member_sid, post_sid, post_sid]);
        op.success = true;
        res.json(op);
    } catch (error) {
        op.error = error;
        res.json(op);
        return
    }


});

router.delete("", async (req, res) => {
    console.log(post_sid, ",", member_sid);

    const op = {
        success: false,
        error: '',
        request: member_sid || ''
    };
    if (!member_sid) {
        res.json(op)
        return
    }

    const sql = `
    DELETE FROM member_likes 
    WHERE post_sid = ? AND member_sid = ?;
    UPDATE post SET likes = likes - 1 WHERE sid = ?;
    `;

    try {
        await db.query(sql, [post_sid, member_sid, post_sid]);
        op.success = true;
        res.json(op);
    } catch (error) {
        op.error = error;
        res.json(op);
        return
    }


});

module.exports = router;
