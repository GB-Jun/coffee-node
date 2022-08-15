const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");
const uploadDir = "./images/sharing/"
const upload = require(__dirname + "/../../modules/sharing-upload")



router.post("/", upload.fields([{ name: "photos", maxCount: 5 }]), async (req, res) => {
    const { title, content } = req.body;
    const op = {
        success: false,
        error: '',
        request: req.body || ''
    };
    // console.log(req.files);
    console.log(req.body);
    console.log(req.files);




    // const sql = `
    // INSERT INTO comment (member_sid, content, post_sid, created_at) VALUES (?, ?, ?, NOW());
    // UPDATE post SET comments = comments + 1 WHERE sid = ?;
    // `;

    // const [r] = await db.query(sql, [member_sid, content, post_sid, post_sid]);
    // if (r) op.success = true;


    // console.log(r);
    res.json(op);
});



module.exports = router;
