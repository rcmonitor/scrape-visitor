/**
 * //@by_rcmonitor@//
 * on 04.08.2015.
 */

var util = require('util');

//var q = require('q');

var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;

//var Interactor = require('./interactor');
//
//console.log('interactor in body inspector');
//console.log(Interactor);


function BodyInspector(oStrategy, oInteractor){
	this.strategy = oStrategy;
	this.interactor = oInteractor;

	this.flush();

//	if at least one condition is asserted
//	this.inspected = false;
}


BodyInspector.prototype.flush = function(){
	/**
	 * assertions for current action
	 *
	 * @type {{}} assertions
	 */
	this.assertions = undefined;

	/**
	 * contains conditions; when met, next action will be skipped
	 *
	 * @type {{}} conditions
	 */
	this.conditions = undefined;

	/**
	 * contains callbacks name and parameters. <br />
	 * if exists, each callback will be executed before executing action. <br />
	 * result of a callback will be assigned to requestOptions property provided
	 *
	 * @type {{}} callbacks
	 */
	this.callbacks = undefined;

	
	this.promises = [];
	

	/**
	 * amount of actions to pass if conditions are met
	 *
	 * @type {number} skipCount
	 */
	this.skipCount = 1;
};


BodyInspector.prototype.prepareCallbacks = function(){
	if(!hpg.isEmpty(this.callbacks)) {

//		hpg.log(this.callbacks);

		this.interactor.fileLogger.log('got some callbacks in object');

		var strCallbackName;
//		var oResult;
//		var result;
////		var arCallbacks = [];

//	iterating over callback definitions
		for (strCallbackName in this.callbacks) {
			if (this.interactor[strCallbackName]) {

				var strCallbackWhatArgument;

//	iterating over arguments sets within callback of given type
				for (strCallbackWhatArgument in this.callbacks[strCallbackName]) {

					this.promises.push(this.interactor[strCallbackName](
						strCallbackWhatArgument,
						this.callbacks[strCallbackName][strCallbackWhatArgument]));

					var strMsg = 'callback ' + strCallbackName + ' added with ' + strCallbackWhatArgument;
					this.interactor.fileLogger.log(strMsg);
				}
			} else {
				this.interactor.fileLogger.log('got no callback ' + strCallbackName);
			}
		}
	}else{
		this.interactor.emit(this.interactor.availableEvents.action);
	}
};


BodyInspector.prototype.executeCallbacks = function(){

	this.prepareCallbacks();

	if(!hpg.isEmpty(this.promises)){

		var context = this;

		this.callbacksPromise = Promise.all(this.promises);

		this.callbacksPromise.then(function(arResults){

			context.interactor.fileLogger.log('going to iterate over callbacks results');

			arResults.forEach(function(oItem){
				hpg.extend(context.interactor.requestOptions, oItem);
			});

			context.interactor.fileLogger.log('all callbacks executed successfully');

			context.interactor.emit(context.interactor.availableEvents.action);
		})
		.catch(function(errReason){

			context.interactor.fileLogger.log('callbacks rejected');

			context.interactor.addError(errReason);
			context.interactor.logErrors();
		});
	}else{
		this.interactor.fileLogger.log('no callbacks executed');
		this.interactor.emit(this.interactor.availableEvents.action);
	}

};


BodyInspector.prototype.inspect = function(){

	if(!hpg.isEmpty(this.assertions)){

		this.interactor.fileLogger.log('checking action success assertions');

		this.interactor.actionSuccess = this.performChecks(this.assertions);

//	there`s no need to check action result: no assertions given
	}else{
		this.interactor.actionSuccess = true;
		this.interactor.fileLogger.log('action "' + this.interactor.currentActionName
			+ '" was approved without inspection'
			, FileLogger.levels.warning
		);
	}

	if(!hpg.isEmpty(this.conditions)){

		this.interactor.fileLogger.log('checking skip action conditions');

		this.interactor.skipNextAction = this.performChecks(this.conditions);
	}
};


/**
 * perform all checks according to object given and checking functions defined
 *
 * @param {{}} oCheckList {"checkName": valueToCheckAgainst}
 * @returns {boolean} true if all required checks passed; <br />
 * 					false otherwise
 */
BodyInspector.prototype.performChecks = function(oCheckList){

	var strCheckName;
	var boolAllPassed = true;

	var strCheckPassed = '';
	var intCheckLogLevel = FileLogger.levels.info;

	for(strCheckName in oCheckList){
		var strFunctionName = 'check' + hpg.ucfirst(strCheckName);

		if(this[strFunctionName]){
			if(!this[strFunctionName](oCheckList[strCheckName])){
				boolAllPassed = false;
				strCheckPassed = 'failed';
				intCheckLogLevel = FileLogger.levels.warning;
			}else{
				strCheckPassed = 'passed';
				intCheckLogLevel = FileLogger.levels.info;
			}

			this.interactor.fileLogger.log('check for "' + strCheckName + '" ' + strCheckPassed, intCheckLogLevel);
		}else{
			this.interactor.fileLogger.log('function "' + strFunctionName + '" is not defined in inspector',
				FileLogger.levels.error
			)
		}
	}

	return boolAllPassed;
};


/**
 * checks if we got required cooke key
 *
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkCookie = function(strCookieName){
	var boolReturn = false;

	if(this.interactor.extractCookie(strCookieName)){
		boolReturn = true;
	}else{

	//if(!boolReturn){
		this.interactor.fileLogger.log('got no cookie ' + strCookieName, FileLogger.levels.warning);
	}

	return boolReturn;
};


/**
 * checks if we got required response status code
 *
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkStatus = function(intStatus){
	var boolReturn = false;

	if(intStatus == this.interactor.responseMessage.statusCode){
		boolReturn = true;
	}else{
		this.interactor.fileLogger.log('no ' + intStatus + ' status code; got '
			+ this.interactor.responseMessage.statusCode + ' instead'
			, FileLogger.levels.warning);
	}

	return boolReturn;
};


/**
 * checks if response body contains required string
 *
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkString = function(str){
	var boolReturn = false;

	if(this.interactor.responseBody){

		if(this.interactor.responseBody.indexOf(str) != -1){
			boolReturn = true;
		}else{
			this.interactor.fileLogger.log('got no string "'
				+ str + '"', FileLogger.levels.warning);

			if(this.interactor.currentActionName == 'logIn'){

				this.interactor.fileLogger.log(this.interactor.requestOptions, 'request options');

				this.interactor.fileLogger.log(this.interactor.responseBody);

//				this.interactor.fileLogger.log(this.interactor.responseBody);
			}
		}
	}else{
		this.interactor.fileLogger.log('no response body provided', FileLogger.levels.error);
	}

	return boolReturn;
};


module.exports = BodyInspector;