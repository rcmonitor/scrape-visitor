/**
 * //@by_rcmonitor@//
 * on 04.08.2015.
 */


function BodyInspector(oStrategy, oInteractor){
	this.strategy = oStrategy;
	this.interactor = oInteractor;

//	if at least one condition is asserted
	this.inspected = false;
}


BodyInspector.prototype.inspectLogIn = function(oIncomingMessage, strBody){

	this.inspected = false;

	this.strategy.inspectLoggedIn(this);

	this.performChecks(oIncomingMessage, strBody);

};


BodyInspector.prototype.inspectVisit = function(oIncomingMessage, strBody){

	this.inspected = false;

	this.strategy.inspectVisit(this);

	this.performChecks(oIncomingMessage, strBody);

};


BodyInspector.prototype.performChecks = function(oIncomingMessage, strBody){

	var boolInspectionSuccessful = false;

	if(this.checkCookie()){
		boolInspectionSuccessful = true;
	}

	if(this.checkStatus(oIncomingMessage.statusCode)){
		boolInspectionSuccessful = true;
	}

	if(this.checkString(strBody)){
		boolInspectionSuccessful = true;
	}

	if(this.inspected && boolInspectionSuccessful){
		this.interactor.loggedIn = true;
	}
};


/**
 * checks if we got required cooke key
 *
 * @returns {boolean}
 */
BodyInspector.prototype.checkCookie = function(){
	var boolReturn = false;

	if(this.cookie){
		var arCookies = this.interactor.jar.getCookies(this.strategy.config.domain);

		var i = 0;
		var context = this;

		while(i < arCookies.length){

			if(arCookies[i].key == this.cookie){
				boolReturn = true;
				context.interactor.fileLogger.log('got ' + arCookies[i].key);
				break;
			}

			i++;
		}

		if(!boolReturn){
			this.interactor.fileLogger.log('got no cookie ' + this.cookie, FileLogger.levels.warning);
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
 * @returns {boolean}
 */
BodyInspector.prototype.checkStatus = function(intStatusCode){
	var boolReturn = false;

	if(this.status){
		if(this.status == intStatusCode){
			boolReturn = true;
		}else{
			this.interactor.fileLogger.log('got no ' + this.status + ' status code', FileLogger.levels.warning);
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
 * @returns {boolean}
 */
BodyInspector.prototype.checkString = function(strBody){
	var boolReturn = false;

	if(this.string){
		if(strBody.indexOf(this.string) != -1){
			boolReturn = true;
		}else{
			this.interactor.fileLogger.log('got no string ' + this.string, FileLogger.levels.warning);
		}

		this.inspected = true;
	}else{
		boolReturn = true;
	}

	return boolReturn;
};


module.exports = BodyInspector;