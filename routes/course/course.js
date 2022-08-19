const express = require('express');
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const Base64 = require('crypto-js/enc-base64');
const { HmacSHA256 } = require('crypto-js');
const { LINEPAY_CHANNEL_ID, LINEPAY_CHANNEL_SECRET_KEY, LINEPAY_VERSION, LINEPAY_SITE, LINEPAY_RETURN_HOST, LINEPAY_RETURN_CONFIRM_URL, LINEPAY_RETURN_CANCEL_URL } = process.env;
const uuid = require('uuid');
const axios = require("axios");
const orders = {};
const upload = require(__dirname + '/./upload-images');



//上傳照片
router.post('/upload', upload.single('avatar'), (req, res) => {
    try {
        res.json(req.file);
    } catch (error) {
        console.log(error);
        res.json(error);
    }

});
//上傳多個檔案
router.post('/uploads', upload.array('photos'), (req, res) => {
    res.json(req.files);
});


// 資料全拿
router.get('/', async (req, res) => {
    try {
        const sql = "SELECT * FROM course";
        const [r] = await db.query(sql);
        res.json(r);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

// 只取一筆資料
router.get('/data/:sid', async (req, res) => {
    try {
        const sid = req.params.sid;
        // console.log(sid);
        const sql = `SELECT * FROM course WHERE course_sid = ${sid};`;
        const [r] = await db.query(sql);
        res.json(r);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

// 外鍵
router.get('/FK-get', async (req, res) => {
    try {
        const sql1 = "SELECT * FROM`course` JOIN course_related ON `course`.`course_sid` = `course_related`.`course_sid`";
        const [r1] = await db.query(sql1);
        res.json(r1);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

// 新增的SQL語法
// INSERT INTO `course`(`course_name`, `course_price`, `course_level`, `course_img_s`, `course_content`, `course_people`, `course_material`) VALUES (?,?,?,?,?,?,?)
// 新增
router.post('/add', async (req, res) => {
    try {
        // console.log(req.body.course_name);
        const { course_name, course_price, course_level, course_img_s, course_content, course_people, course_material } = req.body;
        const sql = "INSERT INTO `course`(`course_name`, `course_price`, `course_level`, `course_img_s`, `course_content`, `course_people`, `course_material`) ";
        const setSql = `VALUES (\"${course_name}\",${course_price},${course_level},\"${course_img_s}\",\"${course_content}\",\"${course_people}\",\"${course_material}\")`;
        const insertSql = `${sql}${setSql}`;
        const result = await db.query(insertSql);
        // console.log(result);
        return res.json(result[0].insertId);
    } catch (error) {
        console.log(error);
        res.json(error);
    }

});

// 新增外鍵
router.post('/addfk', async (req, res) => {
    try {
        // console.log(req.body);
        const { course_sid, course_date, course_time, course_img_l } = req.body;
        const sql = "INSERT INTO `course_related`(`course_sid`, `course_date`, `course_time`, `course_img_l`)";
        const setSql = `VALUES (${course_sid},\"${course_date}\",\"${course_time}\",\"${course_img_l}\")`;
        const insertSql = `${sql}${setSql}`;
        const result = await db.query(insertSql);
        // console.log(result);
        return res.json(result);
    } catch (error) {
        console.log(error);
        res.json(error);
    }

});

// 刪除
router.delete('/delete/:sid', async (req, res) => {
    try {
        const sid = req.params.sid;
        // console.log(sid);
        if (!sid) {
            return res.json({ message: 'error', code: '400' });
        }
        const sql = `DELETE FROM course WHERE course.course_sid = ${sid}`;
        const result = await db.query(sql);
        // console.log(result);
        return res.json(result);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

// 修改
router.put('/edit', async (req, res) => {
    try {
        // console.log(req.body);
        const { course_name, course_price, course_level, course_img_s, course_content, course_people, course_material, course_sid } = req.body;
        const sql = `UPDATE course SET course_name = \"${course_name}\", course_price = ${course_price}, course_level = ${course_level}, course_img_s = \"${course_img_s}\", course_content = \"${course_content}\", course_people = \"${course_people}\", course_material = \"${course_material}\" WHERE course.course_sid = ${course_sid}`;
        const result = await db.query(sql);
        // console.log(result);
        return res.json(result[0].insertId);
    } catch (error) {
        console.log(error);
        res.send(error);
    }

});

// 修改外鍵
router.put('/editFk', async (req, res) => {
    try {
        // console.log(req.body);
        const { course_sid, course_date, course_time, course_img_l } = req.body;
        // const { date1, date2 } = course_date;
        // const { time1, time2 } = course_time;
        const sql = `UPDATE course_related SET course_date = \"${course_date}\", course_time = \"${course_time}\", course_img_l = \"${course_img_l}\" WHERE course_related.course_sid = ${course_sid};`;
        const result = await db.query(sql);
        // console.log(result);
        return res.json(result);
    } catch (error) {
        console.log(error);
        res.send(error);
    }

});

// ------------ 跟LINE PAY 串接的 API -----------
router.post('/createOrder/:orderId', async (req, res) => {
    // 從URL把物件拿出來解開JSON
    const { orderId } = req.params;
    const order = JSON.parse(orderId);
    // console.log(order);

    try {
        // 加入Line Pay規定的資料
        const linePayBody = {
            ...order,
            redirectUrls: {
                confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
                cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
            }
        };
        // console.log(linePayBody);
        const uri = "/payments/request";
        const headers = createSignature(uri, linePayBody);

        //準備送給LINE Pay的資訊 - LINEPAY_SITE:LINE Pay測試站點 - LINEPAY_VERSION:版本號
        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
        // 把整理完成,符合規定的資料,發post請求給LINE Pay
        const linePayRes = await axios.post(url, linePayBody, { headers });
        // console.log(linePayRes.data);
        // 0000是LINE Pay成功的回應 , 如果得到這個回應,就把LINE Pay給的網址回給前端
        if (linePayRes?.data?.returnCode === '0000') {
            res.send(`${linePayRes.data.info.paymentUrl.web}`);
        }
    } catch (error) {
        console.log(error);
        res.end();
    }
    // 建立簽證用的function
    function createSignature(uri, linePayBody) {
        const nonce = uuid.v4();
        //依照官方文件的格式生成資料
        const string = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`;
        // 依照需求加密,這裡需注意官方文件的順序跟HmacSHA256套件使用說明順序不同,請依照LINE Pay格式
        const signatrue = Base64.stringify(HmacSHA256(string, LINEPAY_CHANNEL_SECRET_KEY));
        // 所有資料整理成header
        const headers = {
            'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
            'Content-Type': 'application/json',
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signatrue,
        };
        return headers;
    }
});

router.get('/linePay/comfirm', async (req, res) => {
    // console.log(req);
    try {
        const { transactionId, orderId } = req.query;
        // console.log(transactionId, orderId);
        const order = orders[orderId];
        // LINE Pay確認是否有收到款項用的資訊
        const linePayBody = {
            amount: order.amount,
            currency: 'TWD',
        };
        const uri = `payments/${transactionId}/confirm`;
        const headers = createSignature(uri, linePayBody);
        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
        const linePayRes = await axios.post(url, linePayBody, { headers });
        res.send(console.log(linePayRes));
    } catch (error) {
        res.end();
    }
});

module.exports = router;