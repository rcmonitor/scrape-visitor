/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var request = require('request');
//var q = require('q');

var SSKVParser = require('sskv-parser');
var MetaParser = require('html-meta-parser');
var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;

var Strategy = require('./strategy');
var BodyInspector = require('./bodyInspector');


util.inherits(Interactor, EventEmitter);


/**
 *
 * @param oConfig
 * @class
 * @constructor
 */
function Interactor(oConfig){

	EventEmitter.call(this);


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


	this.availableEvents = Interactor.availableEvents;

	this.on(this.availableEvents.actionBegin, actionBegin);
	this.on(this.availableEvents.action, actionPerform);
	this.on(this.availableEvents.actionEnd, actionEnd);

}


Interactor.availableEvents = {

	  interactionSuccess: 'interaction.success'
	, interactionFailed: 'interaction.error'
	, interactionBegin: 'interaction.begin'
	, interactionEnd: 'interaction.end'
	, actionBegin: 'action.begin'
	, actionEnd: 'action.end'
	, action: 'action'

	,  loggedIn: 'login.success'
	, logInFailed: 'login.error'
	, initialPageLoaded: 'page.initial.load'
	, initialPageChecked: 'page.initial.check'
	, visited: 'visit.success'
	, visitFailed: 'visit.error'
};


Interactor.prototype.addError = function(error){

	var strErrorType = hpg.getType(error);

	if(strErrorType == 'array'){
		this.errors = this.errors.concat(error);
	}else if(strErrorType == 'error'){
		this.errors.push(error.message);
	}else{
		this.errors.push(error);
	}

};


Interactor.prototype.initiate = function(){

	hpg.log('going to emit ' + Interactor.availableEvents.interactionBegin);
	this.fileLogger.log('going to emit ' + Interactor.availableEvents.interactionBegin);

	this.emit(Interactor.availableEvents.interactionBegin);
	this.emit(Interactor.availableEvents.actionBegin);
};


/**
 * retrieves required cookie from jar <br />
 * return from promise: { <br />
 * strRequestOptionsKey: { <br />
 * 		strCookieName: value <br />
 * 		}<br />
 * }
 *
 *
 * @param {string} strCookieName name of a cookie that would be extracted from jar
 * @param {string} strRequestOptionsKey name of requestOptions property to append cookie to
 * @returns {Promise}
 */
Interactor.prototype.callbackTraverseCookie = function(strCookieName, strRequestOptionsKey){

	var context = this;
	
	return new Promise(function(resolve, reject){

		var strCookie, oReturn;

		context.fileLogger.log(strCookieName, 'traversing cookie', 1);

		strCookie = context.extractCookie(strCookieName);

		if(strCookie){

			oReturn = context.wrapCallbackResult(strRequestOptionsKey, strCookieName, strCookie);

			context.fileLogger.log(oReturn, 'going to resolve promise');

			resolve(oReturn);

		}else{

			context.fileLogger.log('going to reject promise');

			var strMsg = 'got no cookie ' + strCookieName;

			reject(strMsg);
		}

	});

};


/**
 * retrieves required parameter from meta refresh page
 * return from promise: { <br />
 * strRequestOptionsKey: { <br />
 * 		strContentKey: value <br />
 * 		}<br />
 * }
 *
 * @param {string} strContentKey key from a content attribute of meta refresh
 * @param {string} strRequestOptionsKey name of requestOptions object property to insert response in
 * @returns {Promise}
 */
Interactor.prototype.callbackParseRefreshPageContent = function(strContentKey, strRequestOptionsKey){

	var context = this;

	return new Promise(function(resolve, reject){

		var sPage = hpg.createEmptyReadableStream();
		var sContent = hpg.createEmptyReadableStream();
		var oMetaParser = new MetaParser();
		var oSskvParser = new SSKVParser();
		sPage.pipe(oMetaParser);
//	oMetaParser.pipe(sContent);
		sContent.pipe(oSskvParser);

		sPage.push(context.responseBody);
		sPage.push(null);

//	if(this.currentActionName == 'confirmLogIn'){
//
//		this.fileLogger.log('response body: ');
//		this.fileLogger.log(this.responseBody);
//	}


		oMetaParser.on('readable', function(){

			var strContent = oMetaParser.read();

//		context.fileLogger.log('content');
			context.fileLogger.log(strContent, 'got content from meta parser');


			oSskvParser.push(strContent);
//		oSskvParser.push(null);
		});

		oSskvParser.on('readable', function(){
			var oResult = oSskvParser.read();

//		context.fileLogger.log('key-value parser result');
//		context.fileLogger.log(oResult);

			if(oResult){
				if(oResult[strContentKey]){

					var oReturn = {};
					oReturn[strContentKey] = oResult[strContentKey];

//					deferred.resolve(oReturn);
					resolve(oReturn);
				}
			}else{

				var strMsg = 'got no valid string';

//				deferred.reject(new Error(strMsg));
				reject(strMsg);
			}

		});

		oSskvParser.on('end', function(){

			var strMsg = 'got no "' + strContentKey + '" in refresh content';

//			deferred.reject(new Error(strMsg));
			reject(strMsg);
		});

//		return deferred.promise;

	});


};


Interactor.prototype.wrapCallbackResult = function(strRequestKey, strContentKey, value){
	var oReturn = {};
	var oContent = {};
	oContent[strContentKey] = value;
	oReturn[strRequestKey] = oContent;

	return oReturn;
};


Interactor.prototype.extractCookie = function(strCookieName){
	var arCookies = this.jar.getCookies(this.strategy.config.common.baseUrl);

	var i = 0;

	while(i < arCookies.length){

		if(arCookies[i].key == strCookieName){

			this.fileLogger.log('got cookie ' + arCookies[i].value);

			return arCookies[i].value;
		}

		i++;
	}
};


Interactor.prototype.prerequisites = function(){
	this.inspector.executeCallbacks();
};


//Interactor.prototype.on(Interactor.availableEvents.actionBegin, function(){
function actionBegin(){

	this.fileLogger.log('action begins');

	this.strategy.load();

	hpg.log('action ' + this.currentActionName + ' begins');

	this.prerequisites();
}


//Interactor.prototype.on(Interactor.availableEvents.action, function(){
function actionPerform(){

	var context = this;

	if(this.currentActionName == 'logIn'){
		require('request-debug')(request);
	}

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
}


//Interactor.prototype.on(Interactor.availableEvents.actionEnd, function(){
function actionEnd(){

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
}


Interactor.prototype.nextAction = function(){


	this.currentActionOffset ++;
	var boolReturn = this.strategy.load();

	if(boolReturn && this.skipNextAction){

		this.fileLogger.log('skipping action ' + this.currentActionName);

		if(this.inspector.skipCount == 1){
			this.skipNextAction = false;
		}

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


Interactor.prototype.logErrors = function(){

	var context = this;

	this.errors.forEach(function(strError){
		context.fileLogger.log(strError, FileLogger.levels.error, 1);
	})
};


module.exports = Interactor;