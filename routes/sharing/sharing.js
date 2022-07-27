const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


const getListHandler = async (req, res) => {
    const op = {
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
            SELECT p.* ,pi.img_name ,pi.sort,m.avatar 
            FROM \`post\` p 
            JOIN \`post_img\` pi 
            ON p.sid = pi.post_sid 
            LEFT JOIN \`member\` m
            ON p.member_sid = m.member_sid
            WHERE pi.sort = 1 AND p.delete_state = 0
        `;
        [op.rows] = await db.query(sql);


        for (let row of op.rows) {
            row.tags = [];

            const sql = `
                    SELECT * FROM \`post_tag\` pt
                    JOIN \`tag\` t 
                    ON pt.tag_sid = t.sid 
                    WHERE \`post_sid\` = ?
                `;

            const [tags] = await db.query(sql, [row['sid']]);

            if (tags.length > 0) {
                tags.forEach((tag) => {
                    row.tags.push(tag);
                });
            }
        }

    }

    return op;
}



router.get("/post", async (req, res) => {
    let output = {
        success: false,
        error: ''
    };

    output = { ...(await getListHandler(req, res)), success: true };

    res.json(output);
});

const getPostHandler = async (req, res, sid) => {
    const op = {
        perPage: 40,
        totalRows: 0,
        code: 0,
        query: {},
        rows: []
    }

    const sql = `
                    SELECT * FROM \`post\` 
                    WHERE \`sid\` = ?
                `;

    const [rows, info] = await db.query(sql, [sid]);
    if (rows.length > 0) {
        op.code = 200;
    } else {
        op.code = 204;
    }

    op.rows = rows;


    return op;
}

router.get("/post/:post_sid", async (req, res) => {
    const post_sid = req.params.post_sid;
    let output = {
        success: false,
        error: '',
        sid: post_sid
    };

    output = { ...(await getPostHandler(req, res, post_sid)), success: true };

    res.json(output);
});


module.exports = router;