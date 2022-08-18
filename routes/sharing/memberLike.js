const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require(__dirname + "/../../modules/mysql-connect");

let post_sid, member_sid = 0;
const op = {
    success: false,
    error: '',
    msg: '',
};

router.use("", async (req, res, next) => {
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
                message: "Request body cannot be empty",
            },
        });
        return;
    } else {
        member_sid = res.locals.loginUser.sid;
        post_sid = req.params.post_sid;
        next();
    }
});

router.get("/", async (req, res) => {
    if (!member_sid) {
        res.json(op)
        return
    }
    const sql = `
    SELECT COUNT(*) AS liked FROM member_likes
    WHERE post_sid = ? AND member_sid = ?;
    SELECT likes AS total FROM post WHERE sid = ?;
    `
    try {
        const [r] = await db.query(sql, [post_sid, member_sid, post_sid]);

        op.liked = r[0][0].liked;
        op.total = r[1][0].total;
        op.success = true;
        res.json(op);
    } catch (error) {
        res.json(op);
        return;
    }


});

router.post("/like", async (req, res) => {
    if (!member_sid) {
        res.json(op)
        return
    }


    const didLiked = `
    SELECT COUNT(*) AS liked FROM member_likes
    WHERE post_sid = ? AND member_sid = ?;
    `;
    const sql = `
    INSERT INTO member_likes (member_sid, post_sid) VALUES (?, ?);
    UPDATE post SET likes = likes + 1 WHERE sid = ?;
    `;

    try {
        const [[r]] = await db.query(didLiked, [post_sid, member_sid]);
        if (r.liked < 1) {
            await db.query(sql, [member_sid, post_sid, post_sid]);
        } else {
            op.msg = "Already like"
        }
        op.success = true;
        res.json(op);
    } catch (error) {
        op.error = error;
        res.json(op);
        return
    }
});

router.delete("/unlike", async (req, res) => {
    if (!member_sid) {
        res.json(op)
        return
    }

    const didLiked = `
    SELECT COUNT(*) AS liked FROM member_likes
    WHERE post_sid = ? AND member_sid = ?;
    `;
    const sql = `
    DELETE FROM member_likes
    WHERE member_likes.post_sid = ? AND member_likes.member_sid = ?;
    UPDATE post SET post.likes = post.likes - 1 WHERE post.sid = ?;
    `;


    try {
        const [[r]] = await db.query(didLiked, [post_sid, member_sid]);
        if (r.liked > 0) {
            await db.query(sql, [post_sid, member_sid, post_sid]);
        } else {
            op.msg = "Already not like"
        }
        op.success = true;
        res.json(op);
    } catch (error) {
        console.log(error)
        op.error = error;
        res.json(op);
        return
    }
});


module.exports = router;
