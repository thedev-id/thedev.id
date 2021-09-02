"use strict";

const fs = require("fs");
const json = require("./subdomains.json");

console.log("Sorting...")

function sortObject(o) {
    var sorted = {},
    key, a = [];
    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }
    a.sort();
    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

const sortedObject = sortObject(json);

fs.writeFile("subdomains.json", JSON.stringify(sortedObject,null,2), err => {
  if (err) {
    console.error(err)
    return
  }
  console.log("Ok. File sorted.")
})
