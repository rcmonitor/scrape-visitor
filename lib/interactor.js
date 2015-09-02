/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var request = require('request');
var q = require('q');

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

	EventEmitter.call(this);

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
	if(hpg.getType(error) == 'array'){
		this.errors = this.errors.concat(error);
	}else{
		this.errors.push(error);
	}

};


Interactor.prototype.initiate = function(){

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
 * @returns {promise}
 */
Interactor.prototype.callbackTraverseCookie = function(strCookieName, strRequestOptionsKey){

	var strCookie, oReturn;
	var deferred = q.defer();

	//for(strPropertyName in oParameter){
	//	strCookie = this.extractCookie(strPropertyName);
	//	if(strCookie){
	//		var strRequestOptionName = oParameter[strPropertyName];
	//		var oDonor = {};
	//		oDonor[strPropertyName] = strCookie;
	//
	//		hpg.extend(this.requestOptions[strRequestOptionName], oDonor);
	//	}
	//}

	strCookie = this.extractCookie(strCookieName);

	if(strCookie){
		//oReturn = {};
		//var oRequestOptionsValue = {};
		//oRequestOptionsValue[strCokieName] = strCookie;
		//
		//oReturn[strRequestOptionsKey] = oRequestOptionsValue;

		deferred.resolve(this.wrapCallbackResult(strRequestOptionsKey, strCookieName, strCookie));

	}else{
		deferred.reject('got no cookie ' + strCookieName);
	}

	return deferred.promise;
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
 * @returns {promise}
 */
Interactor.prototype.callbackParseRefreshPageContent = function(strContentKey, strRequestOptionsKey){

	var deferred = q.defer();

	var sPage = hpg.createEmptyReadableStream();
	var sContent = hpg.createEmptyReadableStream();
	var oMetaParser = new MetaParser();
	var oSskvParser = new SSKVParser();
	sPage.pipe(oMetaParser);
//	oMetaParser.pipe(sContent);
	sContent.pipe(oSskvParser);

	var context = this;

	sPage.push(this.responseBody);
	sPage.push(null);

//	if(this.currentActionName == 'confirmLogIn'){
//
//		this.fileLogger.log('response body: ');
//		this.fileLogger.log(this.responseBody);
//	}


	oMetaParser.on('readable', function(){

		var strContent = oMetaParser.read();

//		context.fileLogger.log('content');
//		context.fileLogger.log(strContent);


		oSskvParser.push(oMetaParser.read());
//		oSskvParser.push(null);
	});

	oSskvParser.on('readable', function(){
		var oResult = oSskvParser.read();

//		context.fileLogger.log('key-value parser result');
//		context.fileLogger.log(oResult);

		if(oResult[strContentKey]){

			var oReturn = {};
			oReturn[strContentKey] = oResult[strContentKey];

			deferred.resolve(oReturn);
		}

	});

	oSskvParser.on('end', function(){
		deferred.reject('got no "' + strContentKey + '" in refresh content');
	});

	return deferred.promise;
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
	//var context = this;

	while(i < arCookies.length){

		if(arCookies[i].key == strCookieName){

			return arCookies[i].value;

			//boolReturn = true;
			//context.interactor.fileLogger.log('got ' + arCookies[i].key);
			//break;
		}

		i++;
	}
};


Interactor.prototype.prerequisites = function(){
	this.inspector.executeCallbacks();
};


Interactor.prototype.on(Interactor.availableEvents.actionBegin, function(){

	this.strategy.load();

	this.prerequisites();
	
});


Interactor.prototype.on(Interactor.availableEvents.action, function(){

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
		context.fileLogger.log(strError, FileLogger.levels.error);
	})
};


module.exports = Interactor;