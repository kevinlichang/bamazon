const inquirer = require("inquirer");
const mysql = require("mysql");

const Table = require('easy-table')



const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "bamazon_DB"
});

db.connect(err => {
  if (err) throw err;
  console.log(`Connected on ${db.threadId}`);
  readProducts();
});

const readProducts = () => {
  db.query("SELECT * FROM products", (err, items) => {
    if (err) throw err;

    
    var t = new Table;
    items.forEach(function (product) {
      t.cell('Product Id', product.item_id)
      t.cell('Product Name', product.product_name)
      t.cell('Department Name', product.department_name)
      t.cell('Price', product.price, Table.number(2))
      t.cell('Quantity in Stock', product.stock_quantity)
      t.newRow()
    })
    
    console.log(`
==========================================================================
                              Our Products
==========================================================================
${t.toString()}`);
    chooseProduct();
  });

};

// function to choose product to buy
const chooseProduct = () => {
  db.query("SELECT * FROM products", (err, items) => {
    if (err) throw err;

    inquirer.prompt([{
        name: "ID",
        message: "Which item would you like to buy (enter item ID)?",
        type: "input",
        default: 1
      },
      {
        name: "quantity",
        message: "How many do you want to buy?",
        type: "input",
        default: 1,
        validate: value => {
          if (!isNaN(value)) {
            return true;
          } else {
            return false;
          }
        }
      }
    ]).then(productInfo => {
      
      const selectedItem = items.find(item => {return item.item_id === parseFloat(productInfo.ID)});

      if (productInfo.quantity > selectedItem.stock_quantity) {
        console.log("Insufficient quantity. Try choosing again!");
        chooseProduct();
      } else {
        let newQuantity = selectedItem.stock_quantity - productInfo.quantity;
        let totalCost = selectedItem.price * productInfo.quantity;
        console.log(`Purchase successful! Total cost: $${totalCost}`);
        purchasedItem(selectedItem.item_id, newQuantity);
      };

    });
  });
};


// use to check the quantity of an item
const purchasedItem = (itemId, quantity) => {
  db.query("UPDATE products SET ? WHERE ?", [{
      stock_quantity: parseFloat(quantity)
    },
    {
      item_id: itemId
    }
  ], (err, res) => {
    if (err) throw err;
    console.log(`
    ============================================
    Thanks for your purchase
    Please buy something else!
    ============================================`)
    readProducts();
  })
}