const express = require('express');
const db = require(__dirname + "/../../modules/mysql-connect");
const router = express.Router();

router.get('/', async (req, res) => {
    const sql = "SELECT * FROM`course` JOIN course_related ON `course`.`course_sid` = `course_related`.`course_sid`";
    const [r] = await db.query(sql);

    res.json(r);
});

module.exports = router;