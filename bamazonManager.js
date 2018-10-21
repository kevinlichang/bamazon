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

  startPrompt();
});

const startPrompt = () => {
  inquirer.prompt([
    {
      name: "Tasks",
      message: "What do you want to do?",
      type: "list",
      choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
    }
  ]).then(userResponse => {
    switch (userResponse.Tasks) {
      case "View Products for Sale":
        viewProducts();
        break;
      case "View Low Inventory":
        lowInven();
        break;
      case "Add to Inventory":
        addToInven();
        break;
      case "Add New Product":
        addNewProduct();
        break;
    };
  });
};

// view the Products
const viewProducts = () => {
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

  startPrompt();
  });  
};

// view items with quantity less than 5
const lowInven = () => {
  db.query("SELECT * FROM products WHERE stock_quantity<5", (err, items) => {
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
                            Low Inventory
==========================================================================
${t.toString()}`);

  startPrompt();
  });
};

// adding to Inventory
const addToInven = () => {
  db.query("SELECT * FROM products", (err, items) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: "chooseProduct",
        message: "What item do you want to add inventory to? (input item ID)",
        type: "input",
        validate: value => {
          if (!isNaN(value)) {
            return true;
          } else {
            return false;
          }
        }
      },
      {
        name: "addQuantity",
        message: "Quantity to add?",
        type: "input",
        validate: value => {
          if (!isNaN(value)) {
            return true;
          } else {
            return false;
          }
        }
      }
    ]).then(response => {

      const selectedItem = items.find(item => {return item.item_id === parseFloat(response.chooseProduct)});

      const newQuantity = parseFloat(response.addQuantity) + selectedItem.stock_quantity;
      console.log(newQuantity)

      db.query("UPDATE products SET ? WHERE ?", 
        [
          {
            stock_quantity: newQuantity
          },
          {
            item_id: parseFloat(response.chooseProduct) 
          }
        ], (err, results) => {
          if (err) throw err;
          console.log(`
==========================================================================
                          Inventory updated
                          
${selectedItem.product_name} now has a quantity of ${newQuantity}
==========================================================================`);
          startPrompt();
        });
    });
  });
};

// Add a new product
const addNewProduct = () => {
  inquirer.prompt([
    {
      name: "itemName",
      message: "Enter name of new product:",
      type: "input"
    },
    {
      name: "department",
      message: "Enter the department the product falls under:",
      type: "input",
      default: "general"
    },
    {
      name: "price",
      message: "What is the price of one unit of the product?",
      type: "input",
      validate: function (value) {
        if (!isNaN(value)) {
          return true;
        }
        else {
          return false;
        }
      }
    },
    {
      name: "quantity",
      message: "Enter quantity in stock of the new product:",
      type: "input",
      validate: function (value) {
        if (!isNaN(value)) {
          return true;
        }
        else {
          return false;
        }
      }
    }
  ]).then(newItemInfo => {
    db.query("INSERT INTO products SET ?", {
      product_name: newItemInfo.itemName,
      department_name: newItemInfo.department,
      price: newItemInfo.price,
      stock_quantity: newItemInfo.quantity
    }, (err, res) => {
      if (err) throw err;
      console.log(`
==========================================================================
                        New Product added
                                
==========================================================================`);
      startPrompt();
    });
  });
};