const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");


router.post("/", async (req, res) => {
    const { member_sid, content, post_sid } = req.body;
    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };

    const sql = `
    INSERT INTO comment (member_sid, content, post_sid, created_at) VALUES (?, ?, ?, NOW());
    UPDATE post SET comments = comments + 1 WHERE sid = ?;
    `;

    const [r] = await db.query(sql, [member_sid, content, post_sid, post_sid]);
    if (r) op.success = true;


    console.log(r);
    res.json(op);
});

router.delete("/", async (req, res) => {
    const { comment_sid, post_sid } = req.body;
    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };

    const sql = `
    DELETE FROM comment WHERE sid = ?;
    UPDATE post SET comments = comments - 1 WHERE sid = ?;
    `;

    const [r] = await db.query(sql, [comment_sid, post_sid]);
    if (r) op.success = true;

    console.log(r);
    res.json(op);
});

module.exports = router;
