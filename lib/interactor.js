/**
 * //@by_rcmonitor@//
 * on 19.07.2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var fs = require('fs');

var request = require('request');
////var CookieFileStore = require('tough-cookie-filestore');
//var tough = require('tough-cookie');

var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;
var Environment = hpg.Environment;
var Strategy = require('./strategy');
var BodyInspector = require('./bodyInspector');

//require('request-debug')(request);


function Interactor(oConfig){

	this.errors = [];

	this.strategy = new Strategy(oConfig, this);

	this.inspector = new BodyInspector(this.strategy, this);

	//var strFileName = __dirname + path.sep + strService;

	//this.strategy = require(strFileName);

	this.loggedIn = false;

	this.fileLogger = oConfig.fileLogger;

	//var strLogFilePath = path.join(__dirname, '..', 'log') + path.sep + strService + '.log';
	//this.fileLogger = new FileLogger(strLogFilePath,
	//	((Environment.isTest() || Environment.isDevelopment()) ? FileLogger.levels.trace : FileLogger.levels.info));

	EventEmitter.call(this);

	//this.strategy.init(this);
	//
	//this.prepareCookieStorage(strService);
}


Interactor.availableEvents = {
	  loggedIn: 'login.success'
	, logInFailed: 'login.error'
	//, cookieFilePrepared: 'cookie.file.prepared'
	, initialPageLoaded: 'page.initial.load'
	, initialPageChecked: 'page.initial.check'
	, visited: 'visit.success'
	, visitFailed: 'visit.error'
};


util.inherits(Interactor, EventEmitter);


//Interactor.prototype.prepareCookieStorage = function(strService){
//
//	if(process.env.NODE_ENV === 'development'){
//		this.jar = request.jar();
//	}else{
//
//		var strCookieFilePath = path.join(__dirname, '..', 'cookies') + path.sep + strService + '.json';
//
//		if(hpg.ensureFileExistsSync(strCookieFilePath, 'w')){
//			this.cookieFilePath = strCookieFilePath;
//
//			var oFileStore = new CookieFileStore(this.cookieFilePath);
//			this.jar = request.jar(oFileStore);
//		}else{
//			this.error = 'unable to create cookie file';
//		}
//	}
//
//};


//Interactor.prototype.on(Interactor.availableEvents.cookieFilePrepared, function(data){
//	console.log('cookie file prepared');
//
//	var oFileStore = new CookieFileStore(this.cookieFilePath);
//
//	this.jar = request.jar(oFileStore);
//
//	console.log(util.inspect(this.jar));
//});


Interactor.prototype.preLoad = function(){
	this.strategy.preLoad();

	this.visited = false;

	var context = this;

	request(this.requestOptions, function(error, oIncomingMessage, data){

		//if(process.env.NODE_ENV === 'development'){
		//	context.testJar = context.repackCookies(oIncomingMessage.headers['set-cookie'], 'http://requestb.in');
		//}

		//context.requestOptions.jar.getCookies('superjob.ru', function(err, cookie){
		//	util.inspect(cookie);
		//});
		//
		//console.log(util.inspect(context.requestOptions.jar.getCookies('superjob.ru')));
		//console.log(util.inspect(context.requestOptions.jar));

		if(error){
			console.log('error when pre-loading: ' + error);
		}else{
			context.emit(Interactor.availableEvents.initialPageLoaded, data);
		}
	});
};


Interactor.prototype.on(Interactor.availableEvents.initialPageLoaded, function(strPage){
	this.checkLoggedIn(strPage);

	this.emit(Interactor.availableEvents.initialPageChecked);
});


Interactor.prototype.checkLoggedIn = function(strPage){
	this.loggedIn = this.inspector.inspectLogIn(strPage);

		//strPage.indexOf(this.loggedInTestString) != -1;
};


Interactor.prototype.logIn = function(){

	this.strategy.logIn();

	var context = this;

	//require('request-debug')(request);

	request(this.requestOptions, function(error, response, body){

		//console.log(util.inspect(context.requestOptions.jar.getCookies('superjob.ru')));

		if(error){
			console.log(error);
		}else{
			console.log('the log in response code: ' + response.statusCode);

			//if(response.statusCode == 200){

				//context.checkLoggedIn(body);
				context.inspector.inspectLogIn(response, body);

				if(context.loggedIn){

					console.log(response.headers['location']);

					//request.get({
					//	url: response.headers['location'],
					//	jar: context.jar,
					//	json: true
					//}, function(error, oIncomingMessage, body){
					//	console.log('redirect response');
					//	console.log(oIncomingMessage.statusCode);
					//	console.log(oIncomingMessage.statusMessage);
					//	//console.log(body);
					//});

					context.emit(Interactor.availableEvents.loggedIn);
				}else{
					context.fileLogger.log(body, FileLogger.levels.trace);
					context.emit(Interactor.availableEvents.logInFailed, response);
				}
			//}else{
			//
			//	context.fileLogger.log(util.inspect(response.headers), FileLogger.levels.trace);
			//
			//	//console.log(body);
			//	context.fileLogger.log(body);
			//	context.emit(Interactor.availableEvents.logInFailed, response);
			//}
		}
	});
};


Interactor.prototype.visit = function(){
	this.strategy.visit();

	var context = this;

	request(this.requestOptions, function(error, response, body){

		if(error){
			console.log(error);
		}else{
			console.log('visit response code: ' + response.statusCode);


			context.inspector.inspectVisit(response);

			if(context.visited){
				context.emit(Interactor.availableEvents.visited);
			}else{
				context.emit(Interactor.availableEvents.visitFailed, response);
			}

			//if(response.statusCode == 200){
			//
			//	context.fileLogger.log(body, FileLogger.levels.trace);
			//
			//	context.emit(Interactor.availableEvents.visited);
			//}else{
			//	context.emit(Interactor.availableEvents.visitFailed, response);
			//}

			//console.log(body);
		}
	});
};


//Interactor.prototype.repackCookies = function(arHeaders, strDomain){
//
//	var Cookie = tough.Cookie;
//
//	var jar = request.jar();
//	arHeaders.forEach(function(strCookie){
//		var oCookie = Cookie.parse(strCookie);
//		jar.setCookie(oCookie.key + '=' + oCookie.value, strDomain);
//	});
//
//	console.log(util.inspect(jar));
//
//	return jar;
//};


module.exports = Interactor;