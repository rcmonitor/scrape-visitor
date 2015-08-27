/**
 * //@by_rcmonitor@//
 * on 04.08.2015.
 */

var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;

function BodyInspector(oStrategy, oInteractor){
	this.strategy = oStrategy;
	this.interactor = oInteractor;

	/**
	 * assertions for current action
	 *
	 * @type {{}} assertions
	 */
	this.assertions = {};

	/**
	 * contains conditions; when met, next action will be skipped
	 *
	 * @type {{}} conditions
	 */
	this.conditions = {};

//	if at least one condition is asserted
//	this.inspected = false;
}


BodyInspector.prototype.inspect = function(){

	//this.interactor.fileLogger.log(this.assertions, 'going to inspect wit assertions');
	//
	//this.interactor.fileLogger.log(this.assertions.length, 'assertions object length');

	if(!hpg.isEmpty(this.assertions)){

		this.interactor.fileLogger.log('checking action success assertions');

		this.interactor.actionSuccess = this.performChecks(this.assertions);

		//this.interactor.actionSuccess = false;
		//
		//var boolInspectionSuccessful = true;
		//
		//if(!this.checkCookie()){
		//	boolInspectionSuccessful = false;
		//}
		//
		//if(!this.checkStatus(oIncomingMessage.statusCode)){
		//	boolInspectionSuccessful = false;
		//}
		//
		//if(!this.checkString(strBody)){
		//	boolInspectionSuccessful = false;
		//}
		//
		//if(this.inspected && boolInspectionSuccessful){
		//	this.interactor.actionSuccess = true;
		//}

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

	//var strAllPassed = boolAllPassed ? 'succeeded' : 'failed';
	//
	//this.interactor.fileLogger.log('action "' + this.interactor.currentActionName + '" ' + strAllPassed);

	return boolAllPassed;
};


/*


BodyInspector.prototype.inspectLogIn = function(oIncomingMessage, strBody){

	this.inspected = false;

	this.strategy.inspectLoggedIn(this);

	this.interactor.fileLogger.log('inspecting log in response');

	this.performChecks('loggedIn', oIncomingMessage, strBody);

};


BodyInspector.prototype.inspectVisit = function(oIncomingMessage, strBody){

	this.inspected = false;

	this.strategy.inspectVisit(this);

	this.interactor.fileLogger.log('inspecting visit response');

	this.performChecks('visited', oIncomingMessage, strBody);

};


BodyInspector.prototype.performChecks = function(strProperty, oIncomingMessage, strBody){

	var boolInspectionSuccessful = true;

	if(!this.checkCookie()){
		boolInspectionSuccessful = false;
	}

	if(!this.checkStatus(oIncomingMessage.statusCode)){
		boolInspectionSuccessful = false;
	}

	if(!this.checkString(strBody)){
		boolInspectionSuccessful = false;
	}

	if(this.inspected && boolInspectionSuccessful){
		this.interactor[strProperty] = true;
	}
};


*/




/**
 * checks if we got required cooke key
 *
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkCookie = function(strCookieName){
	var boolReturn = false;

	//if(this.assertions.cookie){
	var arCookies = this.interactor.jar.getCookies(this.strategy.config.common.baseUrl);

	var i = 0;
	var context = this;

	while(i < arCookies.length){

		if(arCookies[i].key == strCookieName){
			boolReturn = true;
			context.interactor.fileLogger.log('got ' + arCookies[i].key);
			break;
		}

		i++;
	}

	if(!boolReturn){
		this.interactor.fileLogger.log('got no cookie ' + strCookieName, FileLogger.levels.warning);
	}
	//else{
	//	this.interactor.fileLogger.log(arCookies[i].value, 'got cookie "' + strCookieName + '"');
	//}

		//this.inspected = true;
	//}else{
	//	boolReturn = true;
	//}

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

	//if(this.assertions.status){
	if(intStatus == this.interactor.responseMessage.statusCode){
		boolReturn = true;
		//this.interactor.fileLogger.log(intStatus, 'got correct status');
	}else{
		this.interactor.fileLogger.log('no ' + intStatus + ' status code; got '
			+ this.interactor.responseMessage.statusCode + ' instead'
			, FileLogger.levels.warning);
	}

	//this.inspected = true;
//	there`s no need to check status code
//	}else{
//		boolReturn = true;
//	}

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

	//if(this.assertions.string){

	if(this.interactor.responseBody){

		if(this.interactor.responseBody.indexOf(str) != -1){
			boolReturn = true;
			//this.interactor.fileLogger.log(str, 'got correct string');
		}else{
			this.interactor.fileLogger.log('got no string "'
				+ str + '"', FileLogger.levels.warning);
		}
	}else{
		this.interactor.fileLogger.log('no response body provided', FileLogger.levels.error);
	}

	//	this.inspected = true;
	//}else{
	//	boolReturn = true;
	//}

	return boolReturn;
};


module.exports = BodyInspector;