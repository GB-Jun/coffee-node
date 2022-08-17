const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../../modules/mysql-connect");


router.put("/", async (req, res) => {
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
    const { sid } = res.locals.loginUser;
    const { member_sid, post_sid } = req.body;


    if (!member_sid || !post_sid) {
        res.status(400).send({
            error: {
                status: 400,
                message: "Request body cannot be empty",
            },
        });
        return;
    } else if (sid !== member_sid) {
        // 檢查jwt token
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



module.exports = router;
