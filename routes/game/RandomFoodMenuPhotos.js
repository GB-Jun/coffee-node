const express = require("express");
const db = require(__dirname + "/../../modules/mysql-connect");
const Joi = require('joi');
const {
    toDateString,
    toDatetimeString
} = require(__dirname + '/../../modules/date-tools');
const moment = require('moment-timezone');
const router = express.Router(); 

const RandomFoodMenuPhotosHandler = async (req, res)=>{
    let output = {
        code: 0, 
        error: '',
        query: {},
        RandomResult:{}
    };
    const sql=`SELECT menu_name,menu_photo FROM menu`;
    const [rows]=await db.query(sql);
    let FoodPhotosArray=rows;
    let FoodPhotosRand =Math.floor(Math.random()*FoodPhotosArray.length);
    output.RandomResult =FoodPhotosArray[FoodPhotosRand];
    output = {...output};
    console.log(rows)
    console.log(1234)
    console.log(output.RandomResult);
    return output;
};

router.get('/Api', async (req, res)=>{
    const output = await RandomFoodMenuPhotosHandler(req, res);
    res.json(output);
});

module.exports = router;