const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const {
    toDateString,
    toDatetimeString
} = require(__dirname + '/../../modules/date-tools');
const moment = require('moment-timezone');
const upload = require(__dirname + '/../../modules/upload-images')
const router = express.Router(); 

const getListHandler = async (req, res)=>{
    let output = {
        perPage: 5,
        page: 1,
        totalRows: 0,
        totalPages: 0,
        code: 0, 
        error: '',
        query: {},
        rows: [],
        type:1,
        toDateString,
        rows2: [],
        sid:req.query.sid
    };
    let page = +req.query.page || 1;
    let type = +req.query.type || 1;

    if(page<1) {
        output.code = 410;
        output.error = '頁碼太小';
        return output;
    }

    const sql01 = `SELECT COUNT(1) totalRows FROM coupon`;
    
    const [[{totalRows}]] = await db.query(sql01);

    let totalPages = 0;

    if(totalRows) {
        totalPages = Math.ceil(totalRows/output.perPage);
        if(page>totalPages){
            output.totalPages = totalPages;
            output.code = 420;
            output.error = '頁碼太大';
            return output;
        }
        const sql02 = `SELECT * FROM coupon ORDER BY sid DESC LIMIT ${(page-1)*output.perPage}, ${output.perPage}`;
        const [r2] = await db.query(sql02);
        output.rows = r2;
    }
    output.code = 200;
    output = {...output, page, totalRows, totalPages,type};


    return output;
};
// =================
const addHandler = async (req, res)=>{
    let addoutput={
        coupon_send_type:[],
        coupon_setting_type:[],
        rows: [],
        row2: [],
        t_type:[],
        coupon_validity_period:[],
        coupon_status:[]
    };
    const coupon_send_type = ["生日時發送","註冊時發送","玩遊戲時發送","購物完發送"];
    const coupon_setting_type=["折扣金額","打折"];

    const sql=`SELECT menu_sid FROM menu`;
    const [row] = await db.query(sql);
    addoutput.rows=row;

    const sql_products=`SELECT products_sid FROM products`;
    const [row2]=await db.query(sql_products);
    addoutput.row2=row2;

    const t_type= ["餐點類","商品類","全品項"];
    const coupon_validity_period=["1 個月","2 個月","3 個月","4 個月","5個月","6 個月","7 個月","8 個月","9 個月","10 個月","11 個月","12 個月"];
    const coupon_status=["不開放","開放"];
    addoutput={...addoutput,coupon_send_type,coupon_setting_type,t_type,coupon_validity_period,coupon_status};
    return addoutput;
}
// ==============
const editHandler = async (req, res)=>{
    let editoutput={
        coupon_send_type:[],
        coupon_setting_type:[],
        rows: [],
        row2: [],
        t_type:[],
        coupon_validity_period:[],
        coupon_status:[],
        sid:req.query.sid
    };
    // console.log(req.params.sid);
    const coupon_send_type = ["生日時發送","註冊時發送","玩遊戲時發送","購物完發送"];
    const coupon_setting_type=["折扣金額","打折"];

    const sql=`SELECT menu_sid FROM menu`;
    const [row] = await db.query(sql);
    editoutput.rows=row;

    const sql_products=`SELECT products_sid FROM products`;
    const [row2]=await db.query(sql_products);
    editoutput.row2=row2;

    const t_type= ["餐點類","商品類","全品項"];
    const coupon_validity_period=["1 個月","2 個月","3 個月","4 個月","5個月","6 個月","7 個月","8 個月","9 個月","10 個月","11 個月","12 個月"];
    const coupon_status=["不開放","開放"];

    editoutput={...editoutput,coupon_send_type,coupon_setting_type,t_type,coupon_validity_period,coupon_status};
    // console.log(coupon_status);
    // console.log(2223456);
    return editoutput;

    
}
// ==================
router.post('/add',upload.none(), async(req, res)=>{
    const sql = "INSERT INTO `coupon`(`coupon_name`,`coupon_send_type`,`coupon_setting_type`,`coupon_money`,`menu_sid`,`products_sid`, `type`,`coupon_validity_period`,`coupon_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
    const {coupon_name,coupon_send_type,coupon_setting_type,coupon_money,menu_sid,products_sid,type,coupon_validity_period,coupon_status} =req.body;
    const [result] = await db.query(sql, [coupon_name,coupon_send_type,coupon_setting_type,coupon_money,menu_sid,products_sid,type,coupon_validity_period,coupon_status]);
    res.json(result);
})
router.get('/add', async (req, res)=>{
    const addoutput=await addHandler (req, res);
    res.render('coupon_record_list/add', addoutput);
});

router.post('/edit',upload.none(), async(req, res)=>{
    const sql ="UPDATE `coupon` SET `coupon_name`=?, `coupon_send_type`=?, `coupon_setting_type`=?, `coupon_money`=?, `menu_sid`=?, `products_sid`=?, `type`=?, `coupon_validity_period`=?, `coupon_status`=? WHERE `sid`=?";
    const {coupon_name,coupon_send_type,coupon_setting_type,coupon_money,menu_sid,products_sid,type,coupon_validity_period,coupon_status} =req.body;
    const [result] = await db.query(sql, [coupon_name,coupon_send_type,coupon_setting_type,coupon_money,menu_sid,products_sid,type,coupon_validity_period,coupon_status,req.body.sid]);
    res.json(result);
})
router.get('/edit', async (req, res)=>{
    const editoutput=await editHandler (req, res);
    res.render('coupon_record_list/edit', editoutput);
});



router.delete("/", async (req, res) => {
    const sql = "DELETE FROM `coupon` WHERE `sid`=?";
    await db.query(sql, [req.query.sid]);
    res.json(await getListHandler(req, res));
    // console.log(req.query);
});



router.get('/', async (req, res)=>{
    
    const output = await getListHandler(req, res);
    switch(output.code){
        case 410:
            return res.redirect(`?page=1`);
            break;
        case 420:
            return res.redirect(`?page=${output.totalPages}`);
            break;
    }
    res.render('coupon_record_list/main', output);
});

module.exports = router;