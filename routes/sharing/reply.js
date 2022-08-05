const express = require("express");
const router = express.Router(); 
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("/", async (req, res) => { res.json("reply") });

router.post("/", async (req, res) => {
    const { member_sid, comment_sid, content } = req.body;
    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };
    const sql = `
    INSERT INTO \`reply\` ( \`member_sid\`, \`comment_sid\`, \`content\`, \`created_at\`) 
    VALUES (?, ?, ?, NOW());
    UPDATE comment SET replies = replies + 1 WHERE sid = ?;
    `
    const [r] = await db.query(sql, [member_sid, comment_sid, content, comment_sid]);


    console.log(r);
    res.json(op);
});

router.delete("/", async (req, res) => {
    const { reply_sid, comment_sid } = req.body;
    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };
    const sql = `
    DELETE FROM reply WHERE sid = ?;
    UPDATE comment SET replies = replies - 1 WHERE sid = ?;
    `
    const [r] = await db.query(sql, [reply_sid, comment_sid]);


    console.log(r);
    res.json(op);
});

module.exports = router;