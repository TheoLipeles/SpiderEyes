var Promise = require('bluebird');
var BBQ = require("bluebird-queue");
var fs = require("fs");
var mongoose = require('mongoose');
var Page = require("../../db/models/page.js");
Promise.promisifyAll(fs);


var path = require('path');
var chalk = require('chalk');

var DATABASE_URI = "mongodb://localhost:27017/spider-eyes";

var mongoose = require('mongoose');
var db = mongoose.connect(DATABASE_URI).connection;

var startDbPromise = new Promise(function (resolve, reject) {
    db.on('open', resolve);
    db.on('error', reject);
});

console.log(chalk.yellow('Opening connection to MongoDB . . .'));
startDbPromise.then(function () {
    console.log(chalk.green('MongoDB connection opened!'));
});

var graphjson = {
  "directed": true,
  "graph": [],
  "nodes": [],
  "links": [],
  "multigraph": false
};

var pagesQueue = new BBQ({
	concurrency: 100
});

var pageToNode = function(page) {
	var node = {
		    "size": page.pageRank,
		    "id": page.title,
		    "URI": page.url,
		    "_id": page._id,
		    "weight": 1000
		};
	graphjson.nodes.push(node);
	return {
		"source": graphjson.nodes.indexOf(node),
		"links": page.links
	};
};

var findBy_Id = function(_id) {
	for (var i = 0; i < graphjson.nodes.length; i++) {
		if (graphjson.nodes[i]._id.toString() === _id.toString()) return i;
	}
};

var something = function() {
	startDbPromise
	.then(function() {
		return Page.find({});
	})
	.then(function(pages) {
		pages.map(function(page) {
			pagesQueue.add(pageToNode.bind(null, page));
		});
		console.log("making nodes");
		return pagesQueue.start();
	})
	.then(function(linkSets) {
		console.log("nodes done");
		console.log("making links");
		for (var i = 0; i < linkSets.length; i++) {
			for (var j = 0; j < linkSets[i].links.length; j++) {
				var cLinks = findBy_Id(linkSets[i].links[j]);
				if (cLinks) {
					graphjson.links.push({
						"source": linkSets[i].source,
						"target": cLinks
					});
				}
			}
		}
		console.log("links done");
		console.log(graphjson);
		fs.writeFile("./graph.json", JSON.stringify(graphjson));
	});
};
something();