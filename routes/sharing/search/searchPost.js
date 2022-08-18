const { json } = require("body-parser");
const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../../modules/mysql-connect");
const rowsPerPage = 20;
const ORDER_BY = "ORDER BY p.created_at DESC";

// TODO:    let likedSELECT = ""
// if (auth) {
//     likedSELECT = " (SELECT COUNT(1) FROM member_likes ml WHERE ml.post_sid = p.sid AND ml.member_sid = 1) liked, ";
// }

router.get("/", async (req, res) => {
    const { type, q } = req.query;
    if (!q || q.trim().length === 0) {
        res.json({ success: false, msg: "No query string" });
        return
    }

    let output = {}
    if (type === "nickname" || type === "title" || type === "tag" || type === "member_like") {
        if (isNaN(q)) {
            res.json({ success: false, msg: "q is NaN" });
            return
        };

        output = { ...(await getListById(req, res)) };

    } else {
        output = { ...(await getListHandler(req, res)) };
    }


    res.json(output);
});

const getListById = async (req, res) => {
    const { q = 0, times, type, auth } = req.query;
    let likedSELECT = "";
    if (auth) {
        likedSELECT = " (SELECT COUNT(1) FROM member_likes ml WHERE ml.post_sid = p.sid AND ml.member_sid = 1) liked,";
    }

    const op = {
        success: false,
        totalRows: 0,
        rowsPerPage,
        isEnd: false,
        code: 0,
        rows: [],
        query: {},
    }


    op.query = req.query;
    if (isNaN(+times)) {
        op.query.times = 0;
    } else {
        op.query.times = times;
    }
    const LIMIT = `LIMIT ${op.query.times * rowsPerPage},${rowsPerPage}`;

    const nicknameSql = `SELECT COUNT(1) totalRows FROM post WHERE member_sid = ? AND delete_state = 0`;
    const tagSql = `
    SELECT COUNT(1) AS taged_times,p.*, pi.img_name, m.avatar  FROM post p
    LEFT JOIN post_tag pt
    ON p.sid = pt.post_sid
    LEFT JOIN tag t
    ON pt.tag_sid = t.sid
    LEFT JOIN post_img pi 
    ON p.sid = pi.post_sid 
    LEFT JOIN member m
    ON p.member_sid = m.member_sid
    WHERE t.sid = ? AND pi.sort = 1 AND p.delete_state =0
    GROUP BY p.sid;
    `;
    const likeSql = `
    SELECT COUNT(1) totalRows FROM member_likes ml
    LEFT JOIN post p
    ON p.sid = ml.post_sid
    WHERE ml.member_sid = ? AND  p.delete_state = 0;
    `;
    const titleSql = `SELECT COUNT(1) totalRows FROM post WHERE sid = ? AND delete_state = 0`;

    try {
        if (type === "tag") {
            const [r] = await db.query(tagSql, [q]);
            op.totalRows = r.length;
        } else if (type === "nickname") {
            const [[{ totalRows }]] = await db.query(nicknameSql, [q]);
            op.totalRows = totalRows;
        } else if (type === "member_like") {
            const [[{ totalRows }]] = await db.query(likeSql, [q]);
            op.totalRows = totalRows;
        } else if (type === "title") {
            const [[{ totalRows }]] = await db.query(titleSql, [q]);
            op.totalRows = totalRows;
        }
    } catch (error) {
        op.error = error;
        res.json(op);
        return
    }


    const totalPage = Math.ceil(op.totalRows / rowsPerPage);
    op.query.times + 1 >= totalPage ? op.isEnd = true : op.isEnd = false;



    if (op.query.times * rowsPerPage <= op.totalRows) {

        const nicknameSql = `
        SELECT ${likedSELECT} p.* ,pi.img_name,m.avatar
        FROM post p
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE p.member_sid = ? AND pi.sort = 1 AND p.delete_state = 0
        ${ORDER_BY}
        ${LIMIT}
        `;

        const tagSql = `
        SELECT ${likedSELECT} COUNT(1) AS taged_times,p.*, pi.img_name, m.avatar
        FROM post p
        LEFT JOIN post_tag pt
        ON p.sid = pt.post_sid
        LEFT JOIN tag t
        ON pt.tag_sid = t.sid
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE t.sid = ? AND pi.sort = 1 AND p.delete_state =0
        GROUP BY p.sid
        ORDER BY taged_times DESC,p.likes DESC, p.created_at DESC
        ${LIMIT};
        `;

        const likeSql = `
        SELECT 1 AS liked,p.*,m.avatar,pi.img_name FROM member_likes ml
        JOIN post p
        ON p.sid = ml.post_sid
        JOIN post_img pi
        ON p.sid = pi.post_sid
        JOIN member m
        ON m.member_sid = p.member_sid
        WHERE ml.member_sid = ? AND pi.sort = 1 AND p.delete_state = 0
        GROUP  BY ml.post_sid
        ${ORDER_BY}
        ${LIMIT};
        `;

        const titleSql = `
        SELECT ${likedSELECT} p.* ,pi.img_name,m.avatar
        FROM post p
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m
        ON p.member_sid = m.member_sid
        WHERE p.sid = ? AND pi.sort = 1 AND p.delete_state = 0
        ${ORDER_BY}
        ${LIMIT}
        `;

        try {
            if (type === "tag") {
                [op.rows] = await db.query(tagSql, [q]);
            } else if (type === "nickname") {
                [op.rows] = await db.query(nicknameSql, [q]);
            } else if (type === "member_like") {
                [op.rows] = await db.query(likeSql, [q]);
            } else if (type === "title") {
                [op.rows] = await db.query(titleSql, [q]);
            }
        } catch (error) {
            op.error = error;
            res.json(op);
            return
        }


        for (let row of op.rows) {
            if (row.sid) {
                row.tags = await getPostTags(row.sid);
            }
        }
        op.success = true;
    }


    return op;
}

const getListHandler = async (req, res) => {
    const { q = 0, times, auth } = req.query;
    let likedSELECT = "";
    if (auth) {
        likedSELECT = " (SELECT COUNT(1) FROM member_likes ml WHERE ml.post_sid = p.sid AND ml.member_sid = 1) liked,";
    }

    const op = {
        success: false,
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

    try {
        const [r] = await db.query(sql);
        op.totalRows = r.length;
    } catch (error) {
        op.error = error;
        res.json(op);
        return
    }


    const totalPage = Math.ceil(totalRows / rowsPerPage);

    op.query = req.query;

    if (isNaN(+times)) op.query.times = 0;
    op.query.times + 1 >= totalPage ? op.isEnd = true : op.isEnd = false;


    if (op.query.times * rowsPerPage <= op.totalRows) {
        const LIMIT = `LIMIT ${op.query.times * rowsPerPage},${rowsPerPage}`;

        const sql = `
        SELECT ${likedSELECT} p.*, pi.img_name, pi.sort, m.avatar,
        (SELECT COUNT(1) FROM member_likes ml WHERE ml.post_sid = p.sid AND ml.member_sid= ?) everlike
        FROM post p 
        LEFT JOIN post_img pi 
        ON p.sid = pi.post_sid 
        LEFT JOIN member m 
        ON p.member_sid = m.member_sid 
        WHERE p.member_nickname LIKE ${WHERE} OR p.title LIKE ${WHERE} AND pi.sort = 1 AND p.delete_state = 0
        GROUP BY p.sid 
        UNION
        SELECT p.*, pi.img_name, pi.sort, m.avatar,
        (SELECT COUNT(1) FROM member_likes ml WHERE ml.post_sid = p.sid AND ml.member_sid= ?) everlike
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
        ORDER BY likes DESC, created_at DESC
        ${LIMIT};
        `;

        try {
            [op.rows] = await db.query(sql, [q, q]);
        } catch (error) {
            op.error = error;
            res.json(op);
            return
        }


        for (let row of op.rows) {
            if (row.sid) {
                row.tags = await getPostTags(row.sid);
            }
        }
    }
    op.success = true;
    return op;
}

const getPostTags = async (sid) => {
    const sql = `
        SELECT * FROM \`post_tag\` pt
        JOIN \`tag\` t 
        ON pt.tag_sid = t.sid 
        WHERE \`post_sid\` = ?
    `;

    try {
        const [tagsData] = await db.query(sql, [sid]);
        const tagsNameArr = tagsData.map((v) => v.name)
        return tagsNameArr;
    } catch (error) {
        return [];
    }

}

module.exports = router;