const express = require('express');
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");



router.get('/', async (req, res) => {
    const sql = "SELECT * FROM course";
    const [r] = await db.query(sql);

    res.json(r);
});

module.exports = router;