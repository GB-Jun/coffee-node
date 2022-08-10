const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../../modules/mysql-connect");


router.get("", async (req, res) => {
    const { queryString, title, tag, member_sid } = req.query;
    const output = {
        totalRows: 0,
        rows: [],
        query: { queryString },
    }

    if (queryString === " ") {
        res.json(output);
        return
    }


    output.rows = [...output.rows, ...await getNicknameData(queryString)];
    output.rows = [...output.rows, ...await getTagData(queryString)];
    output.rows = [...output.rows, ...await getTitleData(queryString)];


    output.totalRows = output.rows.length;

    res.json(output);
});


const getTitleData = async (q) => {
    const WHERE = q ? `p.title LIKE ${db.escape('%' + q + '%')} AND` : "";
    const ORDER = " ORDER BY p.likes DESC"
    const LIMIT = " LIMIT 8";


    const sql = `
    SELECT 'title' AS type ,p.title AS name ,p.sid AS post_sid, p.member_nickname AS author,pi.img_name AS src 
    FROM post p 
    LEFT JOIN post_img pi ON p.sid = pi.post_sid 
    WHERE ${WHERE} pi.sort = 1 AND p.delete_state = 0
    ${ORDER} ${LIMIT};
    `;

    const [r] = await db.query(sql);
    return r;
}

const getNicknameData = async (q) => {
    const WHERE = q ? `m.member_nickname LIKE ${db.escape('%' + q + '%')}` : "1";
    const LIMIT = " LIMIT 8";

    // 輸出{type = "nickname",name:nickname,src:avatar,member_sid,post_quantity}
    // 以關聯子查詢post_quantity做降冪排序,發文數多的會員會排在前面
    const sql = `
    SELECT 'nickname' AS type,
    m.member_nickname AS name,
    m.avatar AS src,
    m.member_sid, 
    (SELECT COUNT(*) posts FROM post WHERE member_sid = p.member_sid) AS post_quantity
    FROM member m
    LEFT JOIN post p 
    ON m.member_sid = p.member_sid 
    WHERE ${WHERE}
    GROUP BY member_sid
    ORDER BY post_quantity DESC ${LIMIT};
    `;


    const [r] = await db.query(sql);
    return r;
};


const getTagData = async (q) => {
    const WHERE = q ? `t.name LIKE ${db.escape('%' + q + '%')}` : "1";
    const LIMIT = " LIMIT 8";

    const sql = `
    SELECT 'tag' AS type, t.* FROM tag t WHERE ${WHERE} ORDER BY times DESC ${LIMIT};`;


    const [r] = await db.query(sql);
    return r;
};





module.exports = router;