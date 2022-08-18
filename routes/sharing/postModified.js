const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams = /share/post/:id/
const db = require(__dirname + "/../../modules/mysql-connect");
const moment = require("moment-timezone");

let post_sid = 0;
router.use("", async (req, res, next) => {
    if (!req.params.post_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else {
        post_sid = req.params.post_sid;
        next();
    }
});

router.get("/", async (req, res) => {
    let output = {
        sid: post_sid
    };

    output = { ...(await getPostHandler(req, res, post_sid)), success: true };

    res.json(output);
});

// PUT (NEED AUTH)
router.put("/", async (req, res) => {
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    }
    const { sid } = res.locals.loginUser;
    const { member_sid } = req.body;


    if (!member_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else if (sid !== member_sid) {
        // 判斷是不是該文章作者
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    }


    const sql = `UPDATE post SET delete_state = 1 WHERE sid = ?`;



    try {
        const [r] = await db.query(sql, [post_sid]);


        res.json(r);

    } catch (error) {
        res.status(500).send({
            error: {
                status: 500,
                message: "Server no response.",
                errorMessage: error,
            },
        });
        return;
    }

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


    try {
        const [rows] = await db.query(sql, [sid]);
        for (let i in rows) {
            const v = rows[i];
            v.created_at = moment.parseZone(v.created_at).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");

            if (rows[i].replies) {
                const [rply] = await db.query(rplySql, [rows[i].sid]);
                rply.created_at = moment.parseZone(rply.created_at).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
                v.reply = rply;

            }
        }

        return rows;
    } catch (error) {
        console.log(error);
        return [];
    }
}

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

    if (rows && rows.sid) {
        op.code = 200;
        op.rows = rows;
        op.rows.created_at = moment.parseZone(op.rows.created_at).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        if (op.rows.updated_at !== null && moment(op.rows.updated_at).isValid()) {
            op.rows.updated_at = moment.parseZone(op.rows.updated_at).utcOffset(8).format("YYYY/MM/DD HH:mm:ss");
        }
        op.rows.imgs = await getPostImgs(op.rows.sid);
        op.rows.tags = await getPostTags(op.rows.sid);
        op.rows.comment = await getCommentAndReply(op.rows.sid);


    } else {
        op.code = 204;
    }


    return op;
}






module.exports = router;