/**
 * //@by_rcmonitor@//
 * on 02.08.2015.
 */

var path = require('path');

var Interactor = require('./interactor');
var hpg = require('helpers-global');
var FileLogger = hpg.FileLogger;
var Configurator = hpg.Configurator;

/*

Interactor.prototype.on(Interactor.availableEvents.initialPageChecked, function(){
	if(!this.loggedIn){
		this.fileLogger.log('not logged in yet', FileLogger.levels.info);

		this.logIn();
	}else{
		this.fileLogger.log('already logged in; no need to do it once again');
	}
});


Interactor.prototype.on(Interactor.availableEvents.logInFailed, function(response){
	this.fileLogger.log('failed to log in: response ' + response.statusCode, FileLogger.levels.error);
});


Interactor.prototype.on(Interactor.availableEvents.loggedIn, function(){
	this.fileLogger.log('logged in on: ' + hpg.time(), FileLogger.levels.info);
	this.visit();
});


Interactor.prototype.on(Interactor.availableEvents.visitFailed, function(response){
	this.fileLogger.log('failed to visit: got response ' + response.statusCode, FileLogger.levels.error);
});

Interactor.prototype.on(Interactor.availableEvents.visited, function(){
	this.fileLogger.log('visited on: ' + hpg.time(), FileLogger.levels.info);
});

*/



function InteractionController(strBasePath, strService){

	var oConfig = new Configurator(strBasePath, strService);

	if(!oConfig.errors.length){

		this.interactor = new Interactor(oConfig);

		if(this.interactor.errors.length){
			this.interactor.errors.forEach(function(error){
				oConfig.fileLogger.log(error, FileLogger.levels.error);
			});

			throw new Error('failed to init interactor');
		}
		//else{console.log('got no errors');}

	}else{
		console.log(oConfig.errors);
	}
}


InteractionController.prototype.update = function(){

	this.interactor.initiate();

	//this.interactor.preLoad();
};


module.exports = InteractionController;