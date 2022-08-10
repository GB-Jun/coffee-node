const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("/:post_sid", async (req, res) => {
    const post_sid = req.params.post_sid;
    const member_sid = req.query.member_sid;

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
    const [[r]] = await db.query(sql, [post_sid, member_sid]);
    const totalSql = `SELECT likes AS total FROM post WHERE sid = ?`
    const [[r2]] = await db.query(totalSql, [post_sid]);
    op.liked = r.liked;
    op.total = r2.total;
    op.success = true;

    res.json(op);
});

router.post("/:post_sid", async (req, res) => {
    const post_sid = req.params.post_sid;
    const { member_sid } = req.body;

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
    `
    const [r] = await db.query(sql, [member_sid, post_sid, post_sid]);
    op.success = true;

    console.log(r);
    res.json(op);
});

router.delete("/:post_sid", async (req, res) => {
    const post_sid = req.params.post_sid;
    const { member_sid } = req.body;

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
    `
    const [r] = await db.query(sql, [post_sid, member_sid, post_sid]);
    op.success = true;
    console.log(r)

    res.json(op);
});

module.exports = router;
