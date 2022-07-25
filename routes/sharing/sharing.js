const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


const getListHandler = async (req, res) => {
    let op = {
        perPage: 40,
        totalRows: 0,
        code: 0,
        query: {},
        rows: []
    }

    let where = ' WHERE 1 ';
    op.page = +req.query.page || 1;
    op.query.search = req.query.search || '';



    const sql = `SELECT COUNT(1) totalRows FROM post ${where}`;
    const [[{ totalRows }]] = await db.query(sql);

    op.totalRows = totalRows;

    if (totalRows) {
        const sql = `
            SELECT p.*,pi.img_name,pi.sort 
            FROM \`post\` p 
            JOIN \`post_img\` pi 
            ON p.sid = pi.post_sid 
            WHERE pi.sort = 1 AND p.delete_state = 0
        `;
        [op.rows] = await db.query(sql);

        // console.log(op.rows);
        // op['rows'].forEach((v, ind, arr) => {
        //     op.rows[ind].tags = [];

        //     (async function () {
        //         const sql = `
        //             SELECT * FROM \`post_tag\` pt
        //             JOIN \`tag\` t 
        //             ON pt.tag_sid = t.sid 
        //             WHERE \`post_sid\` = ?`;

        //         const r = await db.query(sql, [v['sid']]);

        //         if (r.data.length > 0) {
        //             r['data'].forEach((v) => {
        //                 arr.push(v)
        //             })
        //         }
        //     })();
        //   });
    }

    return op;
}



router.get("/api", async (req, res) => {
    let output = {
        success: false,
        error: ''
    };

    output = { ...(await getListHandler(req, res)), success: true };

    res.json(output);
});


module.exports = router;