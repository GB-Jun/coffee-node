const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("/", async (req, res) => {
    const { limit } = req.query;
    const sql = `
    SELECT 'tag' AS type,'tag' AS 'save_at',t.* 
    FROM tag t 
    ORDER BY times 
    DESC LIMIT ${limit || 3};`

    const [r] = await db.query(sql);

    res.json(r)
});

module.exports = router;