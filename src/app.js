const express = require("express");
const bodyparser = require("body-parser");
// const date  =require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");
require("dotenv").config();

// console.log(process.env.key_password);
const db =process.env.key_password;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then((con) => {

    console.log("DB connection completed");
  })
  .catch((e) => console.log(e));

const todoSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", todoSchema);

const item1 = new Item({
  name: "Welcome to our new To Do website!..",
});
const item2 = new Item({
  name: "Hit the + button for add new item",
});
const item3 = new Item({
  name: "<-- press this to delete the item in your list",
});
const defaultitems = [item1, item2, item3];

const listschema = new mongoose.Schema({
  name: String,
  type: [todoSchema],
});
const list = mongoose.model("list", listschema);

const app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function (req, res) {
  // const day = date.getdate();
  // res.render('list', { listTitle: day, listitems: items });

  Item.find({}, function (err, finditems) {
    if (finditems.length === 0) {
      Item.insertMany(defaultitems, function (err) {
        if (err) console.log(err);
        else console.log("successfully add defaut items to our DB.");
      });
      res.redirect("/");
    } else res.render("list", { listTitle: "Today", listitems: finditems });
  });
});

app.post("/", function (req, res) {
  const newitemname = req.body.newitem;
  const newlist = req.body.list;

  const newitem = new Item({
    name: newitemname,
  });
  if (newlist === "Today") {
    newitem.save();
    res.redirect("/");
  } else {
    list.findOne({ name: newlist }, function (err, foundlist) {
      foundlist.type.push(newitem);
      foundlist.save();
      res.redirect("/" + newlist);
    });
  }

  // if (req.body.list === "Work") {
  //     workItem.push(item);
  //     res.redirect('/work');
  // }
  // else {
  //     items.push(item);
  //     res.redirect('/');
  // }
});

app.post("/delete", function (req, res) {
  const iditem = req.body.checkbox;
  const listName = req.body.listname;

  console.log(iditem,listName);

  if (listName === "Today") {
    Item.findByIdAndRemove(iditem, function (err) {
      if (!err) console.log("successfully deleted specific items from DB.");
    });
    res.redirect("/");
  } else {
    list.findOneAndUpdate(
      { name: listName },
      { $pull: { type: { _id: iditem } } },
      function (err, foundlist) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customname", function (req, res) {
  const customName = _.capitalize(req.params.customname);

  list.findOne({ name: customName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        const newlist = new list({
          name: customName,
          type: defaultitems,
        });
        newlist.save();
        res.render("/" + customName);
      } else
        res.render("list", {
          listTitle: foundlist.name,
          listitems: foundlist.type,
        });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});


process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! ');
  server.close(() => {
    process.exit(1);
  });
});

