const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");

let member_sid, comment_sid = 0;
const op = {
    success: false,
    error: "",
};

router.use("", async (req, res, next) => {
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    } else if (!req.body.comment_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else {
        member_sid = res.locals.loginUser.sid;
        comment_sid = req.body.comment_sid;
        next();
    }
});

router.post("/", async (req, res) => {
    const content = req.body.content.trim();
    if (!content) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    }


    const sql = `
    INSERT INTO reply ( member_sid, comment_sid, content, created_at) 
    VALUES (?, ?, ?, NOW());
    UPDATE comment SET replies = replies + 1 WHERE sid = ?;
    `
    try {
        await db.query(sql, [member_sid, comment_sid, content, comment_sid]);
        op.success = true;
        res.json(op);
    } catch (error) {
        op.error = error;
        res.json(op);
        return;
    }


});

router.delete("/:reply_sid", async (req, res) => {
    const reply_sid = req.params.reply_sid;
    if (!reply_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    }

    const sql = `
    DELETE FROM reply WHERE sid = ? AND member_sid = ?;
    UPDATE comment SET replies = replies - 1 WHERE sid = ?;
    `
    await db.query(sql, [reply_sid, member_sid, comment_sid]);
    op.success = true;


    res.json(op);
});

module.exports = router;