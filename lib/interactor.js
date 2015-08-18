/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var request = require('request');

var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;
var Strategy = require('./strategy');
var BodyInspector = require('./bodyInspector');


function Interactor(oConfig){

	this.errors = [];

	this.strategy = new Strategy(oConfig.config, this);

	this.inspector = new BodyInspector(this.strategy, this);

	this.loggedIn = false;

	this.fileLogger = oConfig.fileLogger;

	EventEmitter.call(this);

}


Interactor.availableEvents = {
	  loggedIn: 'login.success'
	, logInFailed: 'login.error'
	, initialPageLoaded: 'page.initial.load'
	, initialPageChecked: 'page.initial.check'
	, visited: 'visit.success'
	, visitFailed: 'visit.error'
};


util.inherits(Interactor, EventEmitter);


Interactor.prototype.preLoad = function(){
	this.strategy.preLoad();

	this.visited = false;

	var context = this;

	request(this.requestOptions, function(error, oIncomingMessage, data){

		if(error){
			context.fileLogger.log('error when pre-loading: ' + error, FileLogger.levels.error);
		}else{

			context.logRequest(oIncomingMessage, data);

			context.emit(Interactor.availableEvents.initialPageLoaded, oIncomingMessage, data);
		}
	});
};


Interactor.prototype.on(Interactor.availableEvents.initialPageLoaded, function(oIncomingMessage, strPage){
	//this.checkLoggedIn(strPage);

	this.inspector.inspectLogIn(oIncomingMessage, strPage);

	this.emit(Interactor.availableEvents.initialPageChecked);
});


//Interactor.prototype.checkLoggedIn = function(strPage){
//
//	this.loggedIn = this.inspector.inspectLogIn(strPage);
//};


Interactor.prototype.logIn = function(){

	this.strategy.logIn();

	var context = this;

	request(this.requestOptions, function(error, response, body){

		if(error){
			context.fileLogger.log('log in error: ' + error, FileLogger.levels.error);
		}else{

			context.logRequest(response, body);

			context.fileLogger.log('log in response code: ' + response.statusCode, FileLogger.levels.trace);

			context.inspector.inspectLogIn(response, body);

			if(context.loggedIn){

				context.emit(Interactor.availableEvents.loggedIn);
			}else{
				context.fileLogger.log(body, FileLogger.levels.trace);
				context.emit(Interactor.availableEvents.logInFailed, response);
			}
		}
	});
};


Interactor.prototype.visit = function(){
	this.strategy.visit();

	var context = this;

	request(this.requestOptions, function(error, response, body){

		if(error){
			context.fileLogger.log('visit error: ' + error, FileLogger.levels.error);
		}else{

			context.logRequest(response, body);

			context.fileLogger.log('visit response code: ' + response.statusCode, FileLogger.levels.trace);

			context.inspector.inspectVisit(response, body);

			if(context.visited){
				context.emit(Interactor.availableEvents.visited);
			}else{
				context.emit(Interactor.availableEvents.visitFailed, response);
			}
		}
	});
};


Interactor.prototype.logRequest = function(oIncomingMessage, strPage){
	this.fileLogger.log('successfully performed request to "' + this.requestOptions.url + '"');
	this.fileLogger.log('got status ' + oIncomingMessage.statusCode);
};


module.exports = Interactor;