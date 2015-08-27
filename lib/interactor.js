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


/**
 *
 * @param oConfig
 * @class
 * @constructor
 */
function Interactor(oConfig){

	this.errors = [];

	/**
	 * the request object with default settings
	 *
	 * @type {{}} request
	 */
	this.request = {};

	/**
	 * options that will be used in request for current action
	 *
	 * @type {{}} requestOptions
	 */
	this.requestOptions = {};

	this.fileLogger = oConfig.fileLogger;

	this.strategy = new Strategy(oConfig.config, this);

	this.inspector = new BodyInspector(this.strategy, this);

	/**
	 * IncomingMessage from node http response
	 *
	 * @type {IncomingMessage} responseMessage
	 */
	this.responseMessage = undefined;

	/**
	 * body of a response for current action
	 *
	 * @type {string} responseBody
	 */
	this.responseBody = '';

	//this.loggedIn = false;

	/**
	 * flag that shows if current action was successfully performed; <br />
	 * should be dropped before every new action
	 *
	 * @type {boolean} actionSuccess
	 */
	this.actionSuccess = false;


	/**
	 * flag; whether next action should be skipped;
	 *
	 * @type {boolean} skipNextAction
	 */
	this.skipNextAction = false;

	/**
	 * holds offset of current action in config
	 *
	 * @type {number} currentActionOffset
	 */
	this.currentActionOffset = 0;

	/**
	 * holds name of current action
	 *
	 * @type {string} currentActionName
	 */
	this.currentActionName = '';

	EventEmitter.call(this);

}


Interactor.availableEvents = {

	  interactionSuccess: 'interaction.success'
	, interactionFailed: 'interaction.error'
	, interactionBegin: 'interaction.begin'
	, interactionEnd: 'interaction.end'
	, actionBegin: 'action.begin'
	, actionEnd: 'action.end'

	,  loggedIn: 'login.success'
	, logInFailed: 'login.error'
	, initialPageLoaded: 'page.initial.load'
	, initialPageChecked: 'page.initial.check'
	, visited: 'visit.success'
	, visitFailed: 'visit.error'
};


util.inherits(Interactor, EventEmitter);


Interactor.prototype.initiate = function(){

	this.emit(Interactor.availableEvents.interactionBegin);
	this.emit(Interactor.availableEvents.actionBegin);
};


Interactor.prototype.on(Interactor.availableEvents.actionBegin, function(){
	this.strategy.load();
	//this.actionSuccess = false;
	
	var context = this;

	this.request(this.requestOptions, function(error, oIncomingMessage, strPage){
		if(error){
			context.fileLogger.log('"' + error + '" when trying to '
				+ context.requestOptions.method + ' "'
				+ context.requestOptions.uri + '"',
				FileLogger.levels.error
			);
		}else{

			context.responseMessage = oIncomingMessage;
			context.responseBody = strPage;

			context.logResponse();

			context.inspector.inspect();
			context.emit(Interactor.availableEvents.actionEnd);
		}
	});
});


Interactor.prototype.on(Interactor.availableEvents.actionEnd, function(){

	this.logActionResult();

	if(this.actionSuccess){

		if(this.nextAction()){

		//this.currentActionOffset ++;
		//
		//if(this.strategy.load()){
			this.emit(Interactor.availableEvents.actionBegin);
		}else{

			this.logInteractionResult();
			this.emit(Interactor.availableEvents.interactionSuccess);
			this.emit(Interactor.availableEvents.interactionEnd);
		}
	}else{
		this.logInteractionResult();
		this.emit(Interactor.availableEvents.interactionFailed);
		this.emit(Interactor.availableEvents.interactionEnd)
	}
});


Interactor.prototype.nextAction = function(){


	this.currentActionOffset ++;
	var boolReturn = this.strategy.load();

	if(boolReturn && this.skipNextAction){

		this.fileLogger.log('skipping action ' + this.currentActionName);
		this.skipNextAction = false;

		boolReturn = this.nextAction();
	}

	return boolReturn;
};


Interactor.prototype.logActionResult = function(){

	var strResult = this.actionSuccess ? 'completed successfully' : 'failed';

	this.fileLogger.log('action "' + this.currentActionName + '": '
		+ this.requestOptions.method + ' to "'
		+ this.requestOptions.uri + '" '
		+ strResult
	);

};


Interactor.prototype.logInteractionResult = function(){
	var strResult = this.actionSuccess ? 'succeeded' : 'failed';

	this.fileLogger.log('interaction ' + strResult);
};


Interactor.prototype.logResponse = function(){
	this.fileLogger.log('successfully performed request to "' + this.requestOptions.uri + '"');
	this.fileLogger.log('got status ' + this.responseMessage.statusCode);
};

/*


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


*/




module.exports = Interactor;