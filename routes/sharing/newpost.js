const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");
const upload = require(__dirname + "/../../modules/sharing-upload")


router.post("/", upload.fields([{ name: "photos", maxCount: 5 }]), async (req, res) => {
    if (!res.locals.loginUser) {
        // 檢查jwt token
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
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else if (title.trim().length > 50 || content.trim().length > 500 || tagArray.length > 5) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Word count over limit",
            },
        });
        return;
    }else if(req.files.photos===undefined||req.files.photos.length){
        res.status(400).send({
            error: {
                status: 400,
                message: "File count error",
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


        for (let i = 0; i < tagArray.length; i++) {
            const name = tagArray[i];

            // UPSERT tag by tag.name
            const UPSERT_SQL = `INSERT INTO tag (name) VALUES (?) ON DUPLICATE KEY UPDATE times = times + 1;`
            const [r] = await db.query(UPSERT_SQL, [name]);

            const tag_sid = r.insertId;
            // INSERT post_tag by post_sid,tag insertId
            db.query("INSERT INTO `post_tag` (`post_sid`, `tag_sid`) VALUES (?, ?)", [post_sid, tag_sid]);
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
