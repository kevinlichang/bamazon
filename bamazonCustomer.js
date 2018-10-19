const inquirer = require("inquirer");
const mysql = require("mysql");



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
    console.log(items);
    chooseProduct();
  });

};

// function to choose product to buy
const chooseProduct = () => {
  db.query("SELECT * FROM products", (err, items) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: "itemID",
        message: "Which item would you like to buy (enter item ID)?",
        type: "input",
        default: 1
      },
      {
        name: "quantity",
        message: "How many do you want to buy?",
        type: "input",
        default: 1
      }
    ]).then(productInfo => {
      const selectedItem = items.find(item => item.item_id === productInfo.itemID);

      if (productInfo.quantity > selectedItem.stock_quantity) {
        console.log("Insufficient quantity. Try choosing again!");
        chooseProduct();
      } else {
        let newQuantity = selectedItem.stock_quantity - productInfo.quantity;
        let totalCost = selectedItem.price * productInfo.quantity;
        console.log(`Purchase successful! Total cost: ${totalCost}`);
        purchasedItem(selectedItem.item_id, newQuantity);
      };

    })
  });
};

// use to check the quantity of an item
const purchasedItem = (itemId, quantity) => {
  db.query("UPDATE products SET ? WHERE ?", [
    {
      stock_quantity: parseFloat(quantity)
    },
    {
      item_id: itemId
    }
  ], (err, res) => {
    if (err) throw err;
    console.log("Buy something else!")
    chooseProduct();
  })
}