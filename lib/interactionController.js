/**
 * //@by_rcmonitor@//
 * on 02.08.2015.
 */

var path = require('path');

var Interactor = require('./interactor');
var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;
var Configurator = hpg.Configurator;


var listenerInitialPageChecked = function(){
	if(!this.loggedIn){
		this.fileLogger.log('not logged in yet', FileLogger.levels.info);

		this.logIn();
	}else{
		this.fileLogger.log('already logged in; no need to do it once again');
		this.emit(Interactor.availableEvents.loggedIn);
	}
};

var listenerLogInFailed = function(response){
	this.fileLogger.log('failed to log in: response ' + response.statusCode, FileLogger.levels.error);
};

var listenerLoggedIn = function(){
	this.fileLogger.log('logged in on: ' + hpg.time(), FileLogger.levels.info);
	this.visit();
};

var listenerVisitFailed = function(response){
	this.fileLogger.log('failed to visit: got response ' + response.statusCode, FileLogger.levels.error);
};

var listenerVisited = function(){
	this.fileLogger.log('visited on: ' + hpg.time(), FileLogger.levels.info);
};



function InteractionController(strBasePath, strService){

	var oConfig = new Configurator(strBasePath, strService);

	if(!oConfig.errors.length){

		this.interactor = new Interactor(oConfig);

		if(this.interactor.errors.length){
			this.interactor.errors.forEach(function(error){
				oConfig.fileLogger.log(error, FileLogger.levels.error);
			});
		}else{
			this.interactor.on(Interactor.availableEvents.initialPageChecked
				, listenerInitialPageChecked.bind(this.interactor));
			this.interactor.on(Interactor.availableEvents.logInFailed
				, listenerLogInFailed.bind(this.interactor));
			this.interactor.on(Interactor.availableEvents.loggedIn
				, listenerLoggedIn.bind(this.interactor));
			this.interactor.on(Interactor.availableEvents.visitFailed
				, listenerVisitFailed.bind(this.interactor));
			this.interactor.on(Interactor.availableEvents.visited
				, listenerVisited.bind(this.interactor));
		}

	}else{
		console.log(oConfig.errors);
	}
}


InteractionController.prototype.update = function(){
	this.interactor.preLoad();
};


module.exports = InteractionController;