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
	this.inspected = false;
}


BodyInspector.prototype.inspect = function(oIncomingMessage, strBody){

	this.interactor.fileLogger.log(this.assertions, 'going to inspect wit assertions');

	this.interactor.fileLogger.log(this.assertions.length, 'assertions object length');

	if(!hpg.isEmpty(this.assertions)){

		this.interactor.actionSuccess = false;

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
			this.interactor.actionSuccess = true;
		}

//	there`s no need to check action result: no assertions given
	}else{
		this.interactor.actionSuccess = true;
		this.interactor.fileLogger.log('action "' + this.interactor.currentActionName
			+ '" was approved without inspection'
			, FileLogger.levels.warning
		);
	}
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
BodyInspector.prototype.checkCookie = function(){
	var boolReturn = false;

	if(this.assertions.cookie){
		var arCookies = this.interactor.jar.getCookies(this.strategy.config.common.baseUrl);

		var i = 0;
		var context = this;

		while(i < arCookies.length){

			if(arCookies[i].key == this.assertions.cookie){
				boolReturn = true;
				context.interactor.fileLogger.log('got ' + arCookies[i].key);
				break;
			}

			i++;
		}

		if(!boolReturn){
			this.interactor.fileLogger.log('got no cookie ' + this.assertions.cookie, FileLogger.levels.warning);
		}else{
			this.interactor.fileLogger.log(arCookies[i].value, 'got cookie "' + this.assertions.cookie + '"');
		}

		this.inspected = true;
	}else{
		boolReturn = true;
	}

	return boolReturn;
};


/**
 * checks if we got required response status code
 *
 * @param intStatusCode
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkStatus = function(intStatusCode){
	var boolReturn = false;

	if(this.assertions.status){
		if(this.assertions.status == intStatusCode){
			boolReturn = true;
			this.interactor.fileLogger.log(this.assertions.status, 'got correct status');
		}else{
			this.interactor.fileLogger.log('got no ' + this.assertions.status + ' status code', FileLogger.levels.warning);
		}

		this.inspected = true;
//	there`s no need to check status code
	}else{
		boolReturn = true;
	}

	return boolReturn;
};


/**
 * checks if response body contains required string
 *
 * @param strBody
 * @returns {boolean} true if check successful or there is no need to perform it; <br />
 * 					false otherwise
 */
BodyInspector.prototype.checkString = function(strBody){
	var boolReturn = false;

	if(this.assertions.string){

		if(strBody){

			if(strBody.indexOf(this.assertions.string) != -1){
				boolReturn = true;
				this.interactor.fileLogger.log(this.assertions.string, 'got correct string');
			}else{
				this.interactor.fileLogger.log('got no string ' + this.assertions.string, FileLogger.levels.warning);
			}
		}else{
			this.interactor.fileLogger.log('no response body provided', FileLogger.levels.error);
		}

		this.inspected = true;
	}else{
		boolReturn = true;
	}

	return boolReturn;
};


module.exports = BodyInspector;