const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/sharing-upload")


router.post("/", upload.fields([{ name: "photos", maxCount: 5 }]), async (req, res) => {
    // 檢查jwt token是否正確
    if (!res.locals.loginUser) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Wrong verify.",
            },
        });
        return;
    }
    const { sid, nickname } = res.locals.loginUser;
    const { title, content, topic_sid, myTag } = req.body;

    let tagArray = [];
    if (myTag.trim()) {
        tagArray = myTag.split(",");
    }

    if (title.trim() === "" || content.trim() === "" || topic_sid.trim() === "") {
        res.status(401).send({
            error: {
                status: 401,
                message: "Columns can't be null",
            },
        });
        return;
    } else if (title.trim().length > 50 || content.trim().length > 500) {
        res.status(401).send({
            error: {
                status: 401,
                message: "Words length over limit",
            },
        });
        return;
    }


    const sql = `
    INSERT INTO post (title, content, member_nickname, member_sid, topic_sid, created_at )
    VALUES (?, ?, ?, ?, ?, NOW());
    `;



    try {
        const [r] = await db.query(sql, [title.trim(), content.trim(), nickname, sid, topic_sid]);
        const post_sid = r.insertId;

        const VALUES = req.files.photos.map((v, i) => {
            return `('${v.filename}', '${post_sid}', '${i + 1}')`;
        });
        const photoSQL = `INSERT INTO post_img ( img_name, post_sid, sort) VALUES ${VALUES.join(',')}`;
        const [photo_r] = await db.query(photoSQL);

        // 查tag表有沒有該名字,有的話該tag times+1
        for (let i = 0; i < tagArray.length; i++) {
            const name = tagArray[i];

            const isTagExistSQL = `SELECT COUNT(1) isExist FROM tag WHERE name = ?;`
            const [tag_r] = await db.query(isTagExistSQL, [name]);

            if (tag_r.isExist) {
                const [r] = await db.query("UPDATE tag SET times = times + 1 WHERE name = ?", [name]);
                const tag_sid = r.insertId;
                db.query("INSERT INTO `post_tag` (`post_sid`, `tag_sid`) VALUES (?, ?)", [post_sid, tag_sid]);

            } else {
                const [r] = db.query("INSERT INTO `tag` (`name`) VALUES ('?')", [name]);
                const tag_sid = r.insertId;
                db.query("INSERT INTO `post_tag` (`post_sid`, `tag_sid`) VALUES (?, ?)", [post_sid, tag_sid]);
            }
        }




        res.json(photo_r);

    } catch (error) {
        console.log(error)
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
