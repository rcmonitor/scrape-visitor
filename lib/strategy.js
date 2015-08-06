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


//Strategy.prototype.loadConfig = function(strStrategy){
//	var oConfig = require('../config/' + strStrategy);
//	var oSchema = require('./config/schema');
//	var oValidator = new Validator();
//
//	var oValidationResult = oValidator.validate(oConfig, oSchema);
//
//	if(oValidationResult.ok){
//		this.config = oConfig;
//	}else{
//		this.interactor.errors.concat(oValidationResult.errors);
//	}
//};


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
		//followRedirect: false,
		form: oConfig.form
	};
};


Strategy.prototype.visit = function(){

	var oConfig = this.config.interactor.visit;

	this.interactor.requestOptions = {
		url: this.config.domain + oConfig.path,
		method: oConfig.method,
		jar: this.interactor.jar
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


/*

var init = function (oInteractor) {
	oInteractor.loggedInTestString = '<a href="http://www.superjob.ru/user/resume/" class="MainPageSidebarMenu_link h_color_gray_dk">Мои резюме</a>';
};



var preLoad = function(oInteractor){
	oInteractor.requestOptions = {
		url: 'http://www.superjob.ru',
		method: 'GET',
		jar: oInteractor.jar
	};
};


var logIn = function(oInteractor){

	//var arCookies = oInteractor.jar.getCookies('superjob.ru');
	//
	//console.log(util.inspect(oInteractor.jar));
	//console.log(util.inspect(arCookies));

	//var newJar;
	//
	//if(process.env.NODE_ENV === 'development'){
	//	newJar = repackCookies(oInteractor.jar);
	//}else{
	//	newJar = oInteractor.jar;
	//}

	//process.exit();

	oInteractor.requestOptions = {
		url: 'http://www.superjob.ru/user/login/'
		//, baseUrl: 'http://www.superjob.ru/'
		//, port: '80'
		//path: '',
		, method: 'POST'

		//, followRedirect: false
		, followAllRedirects: true
		//, removeRefererHeader: true
		//, json: true
		, jar: oInteractor.jar
		//, maxRedirects: 1
		, headers: {
			//"Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8'
			"Accept": 'application/json, text/javascript, *!/!*; q=0.01'
			//, "Accept-Encoding": 'gzip, deflate'
			, "Accept-Language": 'en-US,en;q=0.8'
			, "User-Agent": 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.75 Safari/537.36 Vivaldi/1.0.219.50'
			, "X-Requested-With": 'X-Requested-With'
			, "Origin": 'http://www.superjob.ru'
			, "Referer": 'http://www.superjob.ru/'
			, "Connection": 'keep-alive'
			//, "Connection": 'close'
			, "DNT": '1'

		}
		, form: {
			//"returnUrl": "http://www.superjob.ru/",
			"LoginForm[login]": 'all.registers@yandex.ru',
			"LoginForm[password]": 'Staropramen13'
		}
	};

	//if(process.env.NODE_ENV === 'development'){
	//	oInteractor.requestOptions.url = 'http://requestb.in/1bx17up1';
	//	oInteractor.requestOptions.jar = oInteractor.testJar;
	//}
};


var visit = function(oInteractor){

	oInteractor.resumeId = 24528832;

	oInteractor.requestOptions = {
		url: 'http://www.superjob.ru/resume/update_datepub.html?id=' + oInteractor.resumeId
		, method: 'GET'
		, jar: oInteractor.jar
	};

	if(process.env.NODE_ENV == 'development'){
		oInteractor.requestOptions.url = 'http://requestb.in/1bx17up1?id=' + oInteractor.resumeId;
	}
};
*/

//var repackCookies = function(jar){
//
//	console.log('going to repack cookies');
//
//	var arCookies = jar.getCookies('superjob.ru');
//
//	console.log(arCookies.length);
//	console.log(util.inspect(arCookies));
//	console.log(util.inspect(jar));
//
//	var newJar = request.jar();
//	arCookies.forEach(function(oCookie){
//		console.log(util.inspect(oCookie));
//		//var cookie = oCookie.key
//	});
//};

//exports.init = init;
//exports.logIn = logIn;
//exports.preLoad = preLoad;
//exports.visit = visit;

module.exports = Strategy;