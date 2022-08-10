const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams = /share/post/:id/
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("/", async (req, res) => {
    const post_sid = req.params.post_sid;
    let output = {
        success: false,
        error: '',
        sid: post_sid
    };

    output = { ...(await getPostHandler(req, res, post_sid)), success: true };

    res.json(output);
});


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

    return imgsData;
}

const getCommentAndReply = async (sid) => {
    const sql = `
    SELECT c.*,c.sid AS comment_sid,m.avatar,m.member_nickname AS nickname
    FROM comment c
    JOIN member m
    ON c.member_sid = m.member_sid
    WHERE post_sid = ?;`

    const rplySql = `
    SELECT r.*,r.sid AS reply_sid,m.avatar,m.member_nickname AS nickname
    FROM reply r 
    JOIN member m
    ON r.member_sid = m.member_sid
    WHERE comment_sid = ?;`

    const [rows] = await db.query(sql, [sid]);

    for (let i in rows) {
        if (rows[i].replies) {
            const [rply] = await db.query(rplySql, [rows[i].sid]);
            rows[i].reply = rply;
        }
    }

    return rows;
}

const getPostHandler = async (req, res, sid) => {
    const op = {
        code: 0,
        query: {},
    }
    console.log(sid);

    const sql = `
        SELECT p.*,m.avatar FROM \`post\` p
        JOIN \`member\` m 
        ON p.member_sid = m.member_sid
        WHERE \`sid\` = ?
    `;


    const [[rows]] = await db.query(sql, [sid]);
    console.log(rows);

    if (rows && rows.sid) {
        op.code = 200;
        op.rows = rows;

        op.rows.imgs = await getPostImgs(op.rows.sid);
        op.rows.tags = await getPostTags(op.rows.sid);
        op.rows.comment = await getCommentAndReply(op.rows.sid);


    } else {
        op.code = 204;
    }


    return op;
}



module.exports = router;