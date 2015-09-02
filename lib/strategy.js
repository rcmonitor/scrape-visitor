/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

//var util = require('util');
var request = require('request');
var Validator = require('json-validation').JSONValidation;

var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;

//var strUserAgent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.75 Safari/537.36 Vivaldi/1.0.219.50';

function Strategy(oConfig, oInteractor){

	//if(!oInteractor){
	//	oInteractor = {};
	//}

	oInteractor = oInteractor || {};

	this.interactor = oInteractor;

	if(this.validateConfig(oConfig)){

		this.interactor.jar = request.jar();
		this.userAgent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) '
			+ 'AppleWebKit/537.36 (KHTML, like Gecko) '
			+ 'Chrome/44.0.2403.75 Safari/537.36 Vivaldi/1.0.219.50';

		this.commonParameters = {
			jar: this.interactor.jar,
			headers: {
				"User-Agent": this.userAgent
			}
		};

		hpg.extend(this.commonParameters, this.config.common);

		this.interactor.request = request.defaults(this.commonParameters);

		this.interactor.fileLogger.log(this.commonParameters, 'request initiated with default parameters');
	}
}


Strategy.prototype.validateConfig = function(oConfig){

	var boolReturn = false;

	var oSchema = require('./config/new_schema');
	var oValidator = new Validator();

	var oValidationResult = oValidator.validate(oConfig, oSchema);

	if(oValidationResult.ok){
		this.config = oConfig;
		boolReturn = true;
	}else{
		this.addError(oValidationResult.errors);
	}

	return boolReturn;
};


Strategy.prototype.load = function(){

	var boolReturn = false;

	var oConfig = this.config.interactor[this.interactor.currentActionOffset];

	if(oConfig){
		//var oActionParameters = oConfig.requestOptions;

		this.interactor.requestOptions = oConfig.requestOptions;

		this.interactor.inspector.assertions = {};

		this.interactor.currentActionName = this.config.interactor[this.interactor.currentActionOffset].name;

		if(this.loadInspector()){
			////this.interactor.inspector.assertions
			////	= this.config.inspector[this.interactor.currentActionName];
			//this.interactor.inspector.assertions
			//	= this.config.inspector[this.interactor.currentActionName].assertions;
			//this.interactor.inspector.conditions
			//	= this.config.inspector[this.interactor.currentActionName].conditions;
		}else{
			this.interactor.fileLogger.log('config contains no inspections for action "'
				+ this.interactor.currentActionName + '"'
				, FileLogger.levels.warning
			)
		}

		boolReturn = true;
	}else{
		this.interactor.fileLogger.log('no more actions to execute');
	}
	//else{
	//	this.addError('interactor action config #' + this.interactor.currentActionOffset + ' not set');
	//}


	return boolReturn;
};


Strategy.prototype.loadInspector = function(){
	var boolReturn = false;

	this.interactor.inspector.flush();

	var oInspectorConfig = this.config.inspector[this.interactor.currentActionName];

	if(oInspectorConfig){
		hpg.extend(this.interactor.inspector, oInspectorConfig);

		boolReturn = true;
	}

	return boolReturn;
};


//Strategy.prototype.extend = function (oRecipient, oDonor) {
//
//	if(oDonor){
//
//		var strPropertyName;
//
//		for(strPropertyName in oDonor){
//			if(hpg.getType(oRecipient[strPropertyName]) == 'object'
//				&& hpg.getType(oDonor[strPropertyName])){
//				this.extend(oRecipient[strPropertyName], oDonor[strPropertyName]);
//			}else{
//				oRecipient[strPropertyName] = oDonor[strPropertyName];
//			}
//		}
//
//	}
//};


Strategy.prototype.addError = function(error){

	this.interactor.addError(error);
};





/*


Strategy.prototype.preLoad = function(){

	var oConfig = this.config.interactor.preLoad;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar,
		headers: {
			"User-Agent": strUserAgent
		}
	}
};


Strategy.prototype.logIn = function(){

	var oConfig = this.config.interactor.logIn;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar,
		form: oConfig.form,
		headers: {
			"User-Agent": strUserAgent
		}
	};
};


Strategy.prototype.visit = function(){

	var oConfig = this.config.interactor.visit;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar,
		headers: {
			"User-Agent": strUserAgent
		}
	};

	if(oConfig.form){
		this.interactor.requestOptions.form = oConfig.form;
	}
};


Strategy.prototype.inspectLoggedIn = function(oInspector){

	var oConfig = this.config.inspector.logIn;

	traverseConfig(oInspector, oConfig);
};


Strategy.prototype.inspectVisit = function(oInspector){

	var oConfig = this.config.inspector.visit;

	traverseConfig(oInspector, oConfig);
};


var traverseConfig = function(oInspector, oConfig){

	var strKey;

	for(strKey in oConfig){
		oInspector[strKey] = oConfig[strKey];
	}

};

*/



module.exports = Strategy;