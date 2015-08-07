/**
 * //@by_rcmonitor@//
 * on 04.08.2015.
 */

var util = require('util');
var hpg = require('helpers-global');

function BodyInspector(oStrategy, oInteractor){
	this.strategy = oStrategy;
	this.interactor = oInteractor;
	//this.testString = '';
}


BodyInspector.prototype.inspectLogIn = function(oIncomingMessage, strBody){
	this.strategy.inspectLoggedIn(this);

	var context = this;

	if(this.status && oIncomingMessage.statusCode == this.status){

		var arCookies = this.interactor.jar.getCookies(this.strategy.config.domain);

		var i = 0;

		while(i < arCookies.length){
			console.log('got cookie ' + arCookies[i].key);

			if(arCookies[i].key == this.cookie){
				context.interactor.loggedIn = true;
				context.interactor.fileLogger.log('got ' + arCookies[i].key);
				break;
			}

			i++;
		}
	}
};


BodyInspector.prototype.inspectVisit = function(oIncomingMessage){

	this.strategy.inspectVisit(this);

	if(oIncomingMessage.statusCode == this.status){
		this.interactor.visited = true;
	}
};


module.exports = BodyInspector;