const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("/", async (req, res) => {
    let output = {
        success: false,
        error: ''
    };

    output = { ...(await getListHandler(req, res)), success: true };

    res.json(output);
});

const getListHandler = async (req, res) => {
    const { title, tag, member_sid } = req.query;
    const rowsPerPage = 20;
    const op = {
        totalRows: 0,
        rowsPerPage,
        code: 0,
        query: {},
        sql: "",
        rows: [],
        isEnd: false
    }

    const sql = `SELECT COUNT(1) totalRows FROM post WHERE post.delete_state = 0`;
    const [[{ totalRows }]] = await db.query(sql);

    const totalPage = Math.ceil(totalRows / rowsPerPage);

    op.totalRows = totalRows;
    op.query = req.query;
    op.query.times = req.query.times || 0;
    op.query.times >= totalPage ? op.isEnd = true : op.isEnd = false;


    if (totalRows) {
        const LIMIT = `LIMIT ${((op.query.times + totalPage) % totalPage) * rowsPerPage},${rowsPerPage}`;
        let WHERE = "";
        title ? WHERE += `p.title LIKE ${'%' + db.escape(title) + '%'} AND` : WHERE += "1 AND";
        member_sid ? WHERE += ` p.member_sid = ${member_sid} AND` : WHERE += "";


        const sql = `
            SELECT p.* ,pi.img_name ,pi.sort,m.avatar 
            FROM \`post\` p 
            LEFT JOIN \`post_img\` pi 
            ON p.sid = pi.post_sid 
            LEFT JOIN \`member\` m
            ON p.member_sid = m.member_sid
            WHERE ${WHERE} pi.sort = 1 AND p.delete_state = 0 
            ${LIMIT};
        `;

        op.sql = sql;
        [op.rows] = await db.query(sql);


        for (let row of op.rows) {
            if (row.sid) {
                row.tags = await getPostTags(row.sid);
            }
        }

        if (tag) {
            op.rows = op.rows.filter((v) =>
                v.tags.includes(tag)
            );
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