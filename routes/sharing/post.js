const express = require("express");
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const WEEK_DIFF = "TIMESTAMPDIFF(WEEK,p.created_at,NOW()) weekdiff"



router.get("/", async (req, res) => {
    let output = {
        success: false,
        error: ''
    };

    output = { ...(await getListHandler(req, res)), success: true };

    res.json(output);
});

const getListHandler = async (req, res) => {
    const { title, tag, member_sid, times, auth = 0 } = req.query;
    const rowsPerPage = 20;
    const op = {
        success: false,
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

    op.totalRows = totalRows;
    op.query = req.query;
    if (isNaN(+times)) op.query.times = 0;
    op.query.times + 1 >= totalPage ? op.isEnd = true : op.isEnd = false;


    if (totalRows) {
        const randNum = Math.floor(Math.random() * 5 + .3) * 2;
        // weekdiff*(0.5~1.5) ORDER BY like - weekDif* 0~10 DESC
        const ORDER_BY = ` ORDER BY (p.likes-weekdiff*${randNum}) DESC,p.updated_at DESC`

        const LIMIT = `LIMIT ${((op.query.times + totalPage) % totalPage) * rowsPerPage},${rowsPerPage}`;
        let WHERE = "";
        title ? WHERE += `p.title LIKE ${'%' + db.escape(title) + '%'} AND` : WHERE += "1 AND";
        member_sid ? WHERE += ` p.member_sid = ${member_sid} AND` : WHERE += "";


        const sql = `
            SELECT p.* ,pi.img_name ,pi.sort,m.avatar,${WEEK_DIFF}
            FROM \`post\` p 
            LEFT JOIN \`post_img\` pi 
            ON p.sid = pi.post_sid 
            LEFT JOIN \`member\` m
            ON p.member_sid = m.member_sid
            WHERE ${WHERE} pi.sort = 1 AND p.delete_state = 0 
            ${ORDER_BY}
            ${LIMIT};
        `;

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
        op.success = true;
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