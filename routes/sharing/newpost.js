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
    const { title, content, topic_sid } = req.body;


    const sql = `
    INSERT INTO post (title, content, member_nickname, member_sid, topic_sid, created_at )
    VALUES (?, ?, ?, ?, ?, NOW());
    `;



    try {
        const [r] = await db.query(sql, [title, content, nickname, sid, topic_sid]);
        const post_sid = r.insertId;

        const VALUES = req.files.photos.map((v, i) => {
            return `('${v.filename}', '${post_sid}', '${i + 1}')`;
        });
        const photoSQL = `INSERT INTO post_img ( img_name, post_sid, sort) VALUES ${VALUES.join(',')}`;
        const [photo_r] = await db.query(photoSQL);

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
