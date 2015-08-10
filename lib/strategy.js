/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

//var util = require('util');
var request = require('request');
var Validator = require('json-validation').JSONValidation;

var strUserAgent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.75 Safari/537.36 Vivaldi/1.0.219.50';

function Strategy(oConfig, oInteractor){

	if(!oInteractor){
		oInteractor = {};
	}

	this.interactor = oInteractor;

	this.validateConfig(oConfig);

	this.interactor.jar = request.jar();
}


Strategy.prototype.validateConfig = function(oConfig){
	var oSchema = require('./config/schema');
	var oValidator = new Validator();

	var oValidationResult = oValidator.validate(oConfig, oSchema);

	if(oValidationResult.ok){
		this.config = oConfig;
	}else{
		this.interactor.errors.concat(oValidationResult.errors);
	}
};


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


module.exports = Strategy;