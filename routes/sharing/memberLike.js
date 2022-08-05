const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");

router.post("/:post_sid", async (req, res) => {
    const post_sid = req.params.post_sid;
    const { member_sid } = req.body;

    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };
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
        request: req.body || ''
    };
    const sql = `
    DELETE FROM post WHERE sid = ?;
    UPDATE post SET likes = likes - 1 WHERE sid = ?;
    `
    const [r] = await db.query(sql, [post_sid, post_sid]);
    op.success = true;

    console.log(r);
    res.json(op);
});

module.exports = router;
