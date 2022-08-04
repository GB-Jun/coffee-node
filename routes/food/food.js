const express = require('express');
const router = express.Router(); // 建立route物件
const db = require(__dirname + "/../../modules/mysql-connect");



router.get('/', async (req, res) => {
    const sql = "SELECT * FROM menu";
    const [r] = await db.query(sql);

    res.json(r);
});

// SELECT * FROM`主表單`
// JOIN 要連結的表單
// ON `主表單`.`主表的外鍵欄位` = `要連結的表單`.`要連結的表單的PK`


const sendCartData = async (req, res) => {
    let output = {
        error: "",
        query: {},
        rows: [],
        reqData: {},
        cartDataRows: [],
    };

    const cartDataSql = `SELECT food_id FROM food_choice WHERE food_member_id = ${req.body.member.sid} AND food_order_id = 0`;
    const cartData = await db.query(cartDataSql);
    output.cartDataRows = cartData;
    console.log(output.cartDataRows[0]);

    if (output.cartDataRows[0].map((v, i) => {
        return v.cart_product_id;
    }).indexOf(+req.params.sid) >= 0) {
        const updateSql = `UPDATE cart SET food_quantity = ? WHERE food_member_id = ${req.body.member.sid} AND food_order_id = 0 AND food_food_id = ${req.params.sid}`;
        await db.query(updateSql, [req.body.quantity]);
    } else {
        const insertSql = `INSERT INTO food_choice(food_id, food_price, food_ice_id, food_sugar_id, food_quantity, food_member_id, food_order_id, food_time_id, food_store_id) VALUES (?,?,?,?,?,?,?,?,?)`;
        await db.query(insertSql, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        output.query = insertSql;
    }

    return output;
};






router.post('/addfooddata', async (req, res) => {
    const insertSql = `INSERT INTO food_choice(food_id, food_price, food_ice_id, food_sugar_id, food_quantity, food_member_id, food_order_id, food_time_id, food_store_id) VALUES ?`;
    const values = req.body.dataFromFoodDetail.map((item) => [
        item.menu_sid, Number(item.menu_price_m), Number(item.ice), Number(item.sugar), item.foodCount, `${req.body.member.sid}`, `${0}`, req.body.standardTime, req.body.store_sid]);

    const r1 = await db.query(insertSql, [values], function (err, result) {
        if (err) throw err;
        console.log("Number of records inserted: " + result.affectedRows);
    });
    return res.json(r1);
});



// const test = {
//     dataFromFoodDetail: [
//         {
//             menu_sid: 31,
//             menu_price_m: '85',
//             menu_photo: '1a1c87a85a55d7df8409e3cbc069a6cc.jpg',
//             menu_name: '柚子鳳梨貝果',
//             timeID: 1659502909069,
//             foodCount: 3,
//             ice: '',
//             sugar: ''
//         },
//         {
//             menu_sid: 32,
//             menu_price_m: '95',
//             menu_photo: '5ab90dfb3e5fe6a1c1c3d849b8d64389.jpg',
//             menu_name: '芒果金萱貝果',
//             timeID: 1659503350652,
//             foodCount: 1,
//             ice: '',
//             sugar: ''
//         }
//     ],
//     standardTime: '2022-08-05 09:00:00',
//     store_sid: 8
// };


// const sql1 =`SELECT menu_sid FROM menu JOIN food_icesugar ON menu.food_icesugar_sid=food_icesugar.food_icesugar_sid JOIN store ON menu.store_sid=store.store_sid `;
// console.log('r1', req.body);
// const sql1 = `SELECT * FROM food_choice JOIN menu ON food_choice.menu_sid = menu.menu_sid`;

// JOIN store ON food_choice.store_sid = store.store_sid`


// var values = [
//     ['John', 'Highway 71'],
//     ['Peter', 'Lowstreet 4'],
//     ['Amy', 'Apple st 652'],
//     ['Hannah', 'Mountain 21'],
//     ['Michael', 'Valley 345'],
//     ['Sandy', 'Ocean blvd 2'],
//     ['Betty', 'Green Grass 1'],
//     ['Richard', 'Sky st 331'],
//     ['Susan', 'One way 98'],
//     ['Vicky', 'Yellow Garden 2'],
//     ['Ben', 'Park Lane 38'],
//     ['William', 'Central st 954'],
//     ['Chuck', 'Main Road 989'],
//     ['Viola', 'Sideway 1633']
//   ];

// {
//     menu_sid: 31,
//     menu_price_m: '85',
//     menu_photo: '1a1c87a85a55d7df8409e3cbc069a6cc.jpg',
//     menu_name: '柚子鳳梨貝果',
//     timeID: 1659502909069,
//     foodCount: 3,
//     ice: '',
//     sugar: ''
// },



module.exports = router;