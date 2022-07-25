const express = require('express');
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");
const Base64 = require('crypto-js/enc-base64');
const { HmacSHA256 } = require('crypto-js');
const { LINEPAY_CHANNEL_ID, LINEPAY_CHANNEL_SECRET_KEY, LINEPAY_VERSION, LINEPAY_SITE, LINEPAY_RETURN_HOST, LINEPAY_RETURN_CONFIRM_URL, LINEPAY_RETURN_CANCEL_URL } = process.env;
const uuid = require('uuid');
const orders = {};
const axios = require("axios");



router.get('/', async (req, res) => {
    const sql = "SELECT * FROM course";
    const [r] = await db.query(sql);
    res.json(r);
});

router.get('/FK-get', async (req, res) => {
    const sql1 = "SELECT * FROM`course` JOIN course_related ON `course`.`course_sid` = `course_related`.`course_sid`";
    const [r1] = await db.query(sql1);
    res.json(r1);
});

// ------------ 跟LINE PAY 串接的 API -----------

router.get('/checkout/:id', (req, res) => {
    const { id } = req.params;
    const order = sampleData[id];
    order.orderId = uuid.v4();
    orders[order.orderId] = order;
    // res.send(`
    //         <div>價格: ${order.amount}</div>
    //         <div>產品ID: ${order.packages[0].id}</div>              
    //         <div>ID: ${order.orderId}</div>   
    //         <form action="/createOrder/${order.orderId}" method="post">
    //         <button type="submit">送出</button>  
    //         </form>                         
    // ` );
    res.send(console.log(order));
});
router.post('/createOrder/:orderId', async (req, res) => {
    console.log(req);
    const { orderId } = req.params;

    const order = JSON.parse(orderId);
    // const order = orders[orderId];

    console.log(order);

    try {
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

        //準備送給LINE Pay的資訊
        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;

        const linePayRes = await axios.post(url, linePayBody, { headers });
        // console.log(linePayRes.data);
        if (linePayRes?.data?.returnCode === '0000') {
            res.send(`${linePayRes.data.info.paymentUrl.web}`);
        }
    } catch (error) {
        console.log(error);
        res.end();
    }

    function createSignature(uri, linePayBody) {
        const nonce = uuid.v4();
        const string = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`;
        const signatrue = Base64.stringify(HmacSHA256(string, LINEPAY_CHANNEL_SECRET_KEY));
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
    console.log(req);
    try {
        const { transactionId, orderId } = req.query;
        console.log(transactionId, orderId);
        const order = orders[orderId];
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