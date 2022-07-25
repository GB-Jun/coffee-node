

req.query

req.body

req.params

req.file
req.files
------------------------------------
4種指令都會回傳並結束, 後面不能在加東西, 只有end()不會設定檔頭, 其他三個都會設定檔頭
res.end()

res.send()

res.json()

res.render()
------------------------------------
# RESTful API 規劃

# CRUD


# 列表 (GET)
/products
/products?page=2
/products?page=2&search=找東西

# 單一商品 (GET)
/products/:id

# 新增商品 (POST)
/products

# 修改商品 (PUT)
/products/:id

# 刪除商品 (DELETE)
/products/:id



/products/:category_id/:product_id

---------------.env格式--------------------

EXPRESS_PORT=3500

DB_HOST=192.168.24.24
DB_PORT=3306
DB_USER=coffee
DB_PASS=coffee
DB_NAME=coffee




