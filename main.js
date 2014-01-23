'use strict';

var Main = exports;

//dependencies
var express = require('express'),
    http = require('http'),
    sync = require('./sync'),
    path = require('path');

Main.init = function(){

	console.log('INIT SYNC SERVER');
	//create express app
	var app = express();

	//setup the web server
	app.server = http.createServer(app);

	//settings
	app.configure(function(){
		app.disable('x-powered-by');
	});

	app.set('port', Main.config.port);
	//app.set('strict routing', false);

	//listen up
	app.listen(app.get('port'), function(){
	  console.log('Readable dir', process.cwd(), Main.config );
	});

	return app;
}

Main.config = sync.config;

Main.start = function(app,st){
	// route to synchronize
	sync.route(app,st ? express.static : undefined);

	return sync;
};
