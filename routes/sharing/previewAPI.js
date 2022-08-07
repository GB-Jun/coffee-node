const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../modules/mysql-connect");

router.get("", async (req, res) => {
    const { title, tag, member_sid } = req.query;

    const output = {
        totalRows: 0,
        rows: [],
        query: { title, tag, member_sid },
    }

    let WHERE = "";
    title ? WHERE += `p.title LIKE '%${title}%' AND` : WHERE += "";

    const sql = `
    SELECT p.* ,pi.img_name ,pi.sort,m.avatar FROM \`post\` p 
    LEFT JOIN \`post_img\` pi ON p.sid = pi.post_sid 
    LEFT JOIN \`member\` m ON p.member_sid = m.member_sid
    WHERE ${WHERE} pi.sort = 1 AND p.delete_state = 0;
    `;

    const [r] = await db.query(sql);

    output.rows = r;
    output.totalRows = r.length || 0;
    // console.log(r)

    res.json(output)
});



module.exports = router;