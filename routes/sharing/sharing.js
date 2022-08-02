const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

const Joi = require("joi");
const uploads = require(__dirname + "/../../modules/upload-images");


const getListHandler = async (req, res) => {
    const rowsPerPage = 20;
    const op = {
        totalRows: 0,
        rowsPerPage,
        code: 0,
        query: {},
        rows: [],
        isEnd: false
    }

    const sql = `SELECT COUNT(1) totalRows FROM post WHERE post.delete_state = 0`;
    const [[{ totalRows }]] = await db.query(sql);

    const totalPage = Math.ceil(totalRows / rowsPerPage);
    op.query.times = req.query.times || 0;
    op.query.times >= totalPage ? op.isEnd = true : op.isEnd = false;


    if (totalRows) {
        const sql = `
            SELECT p.* ,pi.img_name ,pi.sort,m.avatar 
            FROM \`post\` p 
            LEFT JOIN \`post_img\` pi 
            ON p.sid = pi.post_sid 
            LEFT JOIN \`member\` m
            ON p.member_sid = m.member_sid
            WHERE pi.sort = 1 AND p.delete_state = 0
            LIMIT ${((op.query.times + totalPage) % totalPage) * rowsPerPage},${rowsPerPage}
        `;
        [op.rows] = await db.query(sql);


        for (let row of op.rows) {
            if ("sid" in row) {
                row.tags = await getPostTags(row.sid);
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
        code: 0,
        query: {},
    }

    const sql = `
        SELECT p.*,m.avatar FROM \`post\` p
        JOIN \`member\` m 
        ON p.member_sid = m.member_sid
        WHERE \`sid\` = ?
    `;


    const [[rows]] = await db.query(sql, [sid]);


    if ("sid" in rows) {
        op.code = 200;
        op.rows = rows;

        op.rows.imgs = await getPostImgs(op.rows.sid);
        op.rows.tags = await getPostTags(op.rows.sid);


    } else {
        op.code = 204;
    }

    return op;
}

const getPostTags = async (sid) => {
    const sql = `
        SELECT * FROM \`post_tag\` pt
        JOIN \`tag\` t 
        ON pt.tag_sid = t.sid 
        WHERE \`post_sid\` = ?
    `;

    const [tagsData] = await db.query(sql, [sid]);
    const tagsNameArr = tagsData.map((v) => v.name)

    return tagsNameArr;
}

const getPostImgs = async (sid) => {
    const sql = `SELECT img_name ,sort FROM post_img WHERE post_sid = ? ORDER BY sort ASC;`;

    const [imgsData] = await db.query(sql, [sid]);
    // const tagsNameArr = tagsData.map((v) => v.name)

    return imgsData;
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