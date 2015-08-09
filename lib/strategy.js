/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

var util = require('util');
var request = require('request');
var Validator = require('json-validation').JSONValidation;

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
		jar: this.interactor.jar
	}
};


Strategy.prototype.logIn = function(){

	var oConfig = this.config.interactor.logIn;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar,
		form: oConfig.form
	};
};


Strategy.prototype.visit = function(){

	var oConfig = this.config.interactor.visit;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar
	};

	if(oConfig.form){
		this.interactor.requestOptions.form = oConfig.form;
	}
};


Strategy.prototype.inspectLoggedIn = function(oInspector){

	var oConfig = this.config.inspector.logIn;

	oInspector.testString = oConfig.string;
	oInspector.status = oConfig.status;
	oInspector.cookie = oConfig.cookie;
};


Strategy.prototype.inspectVisit = function(oInspector){

	var oConfig = this.config.inspector.visit;

	oInspector.status = oConfig.status;
};


module.exports = Strategy;