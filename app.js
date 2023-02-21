const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config();

const app = express();

mongoose.set('strictQuery', false);

const mongodb_uri = process.env.MONGODB_URI;
mongoose.connect(mongodb_uri);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const defaultItems = [
    {
        name: "Welcome to your todo list!"
    },
    {
        name: "Hit the + button to add a new item."
    },
    {
        name: "<-- Hit this to delete an item."
    }
];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (err)
            console.log(err);
        else {

            if (foundItems.length === 0) {

                Item.insertMany(defaultItems, function (err) {
                    if (!err) {
                        console.log("Successfully saved default items to the DB.");
                        res.redirect("/");
                    };
                });

            } else {

                res.render("list", {
                    listTitle: "Today",
                    newListItems: foundItems
                });

            }

        }
    });

});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {

        item.save(function (err) {
            if (!err) {
                res.redirect("/");
            };
        });

    } else {
        List.findOne({ name: listName }, function (err, foundList) {

            foundList.items.push(item);
            foundList.save(function (err) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });

        });
    };

});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {

        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Sucessfully deleted the item");
                res.redirect("/");
            }
        });

    } else {

        List.findOneAndUpdate({ name: listName }, {
            $pull: { items: { _id: checkedItemId } }
        }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            };
        });

    };

});

app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {

        if (!err) {
            if (!foundList) {

                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save(function (err) {
                    if (!err) {
                        res.redirect("/" + customListName);
                    };
                });

            } else {

                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });

            };
        };

    });

});

const port = process.env.port || 3000;

app.listen(port, function () {
    console.log("Server started on port " + port);
});