const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../../modules/mysql-connect");
const rowsPerPage = 20;


router.get("/", async (req, res) => {
    const { type, q } = req.query;
    if (!q || q.trim().length === 0) {
        res.json({ success: false, msg: "No query string" });
        return
    }

    let output = {}
    if (type === "nickname") {
        if (isNaN(q)) {
            res.json({ success: false, msg: "q is NaN" });
            return
        };

        output = { ...(await getListByNickname(req, res)) };

    } else {
        output = { ...(await getListHandler(req, res)) };
    }


    res.json(output);
});
const getListByNickname = async (req, res) => {
    const { q } = req.query;
    const member_sid = +q;

    const rowsPerPage = 20;
    const op = {
        totalRows: 0,
        rowsPerPage,
        code: 0,
        query: {},
        rows: [],
        isEnd: false
    }


    const sql = `SELECT COUNT(1) totalRows FROM post WHERE member_sid = ? AND delete_state = 0`;
    const [[{ totalRows }]] = await db.query(sql, [member_sid]);

    const totalPage = Math.ceil(totalRows / rowsPerPage);

    op.totalRows = totalRows;
    op.query = req.query;
    op.query.times = req.query.times || 0;
    op.query.times >= totalPage ? op.isEnd = true : op.isEnd = false;

    if (totalRows) {
        const LIMIT = `LIMIT ${op.query.times * rowsPerPage},${rowsPerPage}`;

        const sql = `
        SELECT p.* ,pi.img_name ,pi.sort,m.avatar
        FROM post p
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE p.member_sid = ? AND pi.sort = 1 AND p.delete_state = 0
        ${LIMIT}
        `;

        [op.rows] = await db.query(sql, [member_sid]);

        for (let row of op.rows) {
            if (row.sid) {
                row.tags = await getPostTags(row.sid);
            }
        }
    }




    return op;
}

const getListHandler = async (req, res) => {
    const { q } = req.query;

    const op = {
        totalRows: 0,
        rowsPerPage,
        code: 0,
        query: {},
        rows: [],
        isEnd: false
    }

    const WHERE = db.escape('%' + q + '%');


    // SELECT 模糊搜尋nickname跟title結果 UNION tag.name搜尋結果
    const sql = `
    SELECT p.sid FROM post p 
    LEFT JOIN post_img pi 
    ON p.sid = pi.post_sid 
    LEFT JOIN member m
    ON p.member_sid = m.member_sid
    WHERE p.member_nickname LIKE ${WHERE} OR p.title LIKE ${WHERE} AND pi.sort = 1 AND p.delete_state = 0
    GROUP BY p.sid
    UNION
    SELECT p.sid FROM post p
    LEFT JOIN post_tag pt
    ON p.sid = pt.post_sid
    LEFT JOIN tag t
    ON pt.tag_sid = t.sid
    LEFT JOIN post_img pi 
    ON p.sid = pi.post_sid 
    LEFT JOIN member m
    ON p.member_sid = m.member_sid
    WHERE t.name LIKE ${WHERE} AND pi.sort = 1 AND p.delete_state =0;
    `;

    const [r] = await db.query(sql);

    const totalRows = r.length;
    op.totalRows = totalRows;



    const totalPage = Math.ceil(totalRows / rowsPerPage);

    op.query = req.query;
    op.query.times = req.query.times || 0;
    op.query.times >= totalPage ? op.isEnd = true : op.isEnd = false;


    if (totalRows) {
        const LIMIT = `LIMIT ${op.query.times * rowsPerPage},${rowsPerPage}`;

        const sql = `
        SELECT p.*, pi.img_name, pi.sort, m.avatar
        FROM post p 
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE p.member_nickname LIKE ${WHERE} OR p.title LIKE ${WHERE} AND pi.sort = 1 AND p.delete_state = 0
        GROUP BY p.sid
        UNION
        SELECT p.*, pi.img_name, pi.sort, m.avatar 
        FROM post p
        LEFT JOIN post_tag pt
        ON p.sid = pt.post_sid
        LEFT JOIN tag t
        ON pt.tag_sid = t.sid
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE t.name LIKE ${WHERE} AND pi.sort = 1 AND p.delete_state =0
        ${LIMIT};
        `;


        [op.rows] = await db.query(sql);


        for (let row of op.rows) {
            if (row.sid) {
                row.tags = await getPostTags(row.sid);
            }
        }


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

module.exports = router;