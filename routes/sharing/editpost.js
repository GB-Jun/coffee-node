const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/sharing-upload");

router.post("/", upload.none(), async (req, res) => {
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    } else if (!req.params.post_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Wrong pid.",
            },
        });
        return;
    }

    const post_sid = req.params.post_sid;
    const { sid: member_sid } = res.locals.loginUser;
    const { title, content: c, topic_sid, myTag } = req.body;

    if (!title?.trim() && !c?.trim() && !topic_sid?.trim()) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    }

    const pattern = /\r\n|\r|\n/;
    const content = c.replace(pattern, '<br />');

    let tagArray = [];
    if (myTag.trim()) {
        tagArray = myTag.split(",");
    }

    if (title.trim().length > 50 || content.trim().length > 500 || tagArray.length > 5) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Word count over limit",
            },
        });
        return;
    }

    const getOldSql = `SELECT tag_sid FROM post_tag pt WHERE post_sid = ?`;
    const sql = "UPDATE post SET title = ?, content = ?, topic_sid = ?, updated_at = NOW() WHERE sid = ?;";
    // delete post_tag, update tag.times --, upsert tag
    const DELETE_SQL = "DELETE FROM post_tag WHERE post_sid = ?";
    const UPDATE_SQL = "UPDATE tag SET times = times - 1 WHERE sid = ?";
    const UPSERT_SQL = "INSERT INTO tag (name) VALUES (?) ON DUPLICATE KEY UPDATE times = times + 1;"


    try {
        const [r] = await db.query(sql, [title.trim(), content.trim(), topic_sid, post_sid]);
        const [old] = await db.query(getOldSql, [post_sid]);

        for (let i = 0; i < old.length; i++) {
            const v = old[i].tag_sid;
            await db.query(UPDATE_SQL, [v]);
        }

        await db.query(DELETE_SQL, post_sid);


        for (let i = 0; i < tagArray.length; i++) {
            const name = tagArray[i].trim();
            console.log(name);

            // Tag times--

            // INSERT post_tag by post_sid,tag insertId
            const [r] = await db.query(UPSERT_SQL, [name]);
            const tag_sid = r.insertId;

            db.query("INSERT INTO `post_tag` (`post_sid`, `tag_sid`) VALUES (?, ?)", [post_sid, tag_sid]);
        }

        res.json(r);

    } catch (error) {
        console.log(error);
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



module.exports = router;
