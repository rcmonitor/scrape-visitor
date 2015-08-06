/**
 * //@by_rcmonitor@//
 * on 04.08.2015.
 */

var util = require('util');
var hpg = require('helpers-global');

function BodyInspector(oStrategy, oInteractor){
	this.strategy = oStrategy;
	this.interactor = oInteractor;
	this.testString = '';
}


BodyInspector.prototype.inspectLogIn = function(oIncomingMessage, strBody){
	this.strategy.inspectLoggedIn(this);

	//var boolLoggedIn = false;
	var context = this;

	if(this.status && oIncomingMessage.statusCode == this.status){

		//hpg.log(oIncomingMessage);

		//console.log(oIncomingMessage);
		console.log(util.inspect(oIncomingMessage.headers));
		console.log(util.inspect(oIncomingMessage.statusMessage));
		console.log(util.inspect(oIncomingMessage.trailers));
		console.log(util.inspect(oIncomingMessage.statusCode));


		var stack = new Error().stack;
		console.log(stack);

		//context.interactor.loggedIn = true;

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

		//arCookies.forEach(function(oCookie){
		//
		//	console.log('got cookie ' + oCookie.key);
		//
		//	if(oCookie.key == this.cookie){
		//		context.interactor.loggedIn = true;
		//		context.interactor.fileLogger.log('got ' + oCookie.key);
		//		break;
		//	}
		//});

		//console.log(util.inspect(arCookies));
	}

	////this.testString = "<a href=\"http://www.superjob.ru/user/resume/\" class=\"MainPageSidebarMenu_link h_color_gray_dk\">Мои резюме</a>";
	//this.testString = "<a href=\"http://www.superjob.ru/user/resume/\" class=\"MainPageSidebarMenu_link h_color_gray_dk\">" + '\u041C\u043E\u0438 \u0440\u0435\u0437\u044E\u043C' + "</a>";
	//this.testString = "Мои резюме";

	//this.testString = /MainPageSidebarMenu_link h_color_gray_dk/;

	//return strPage.indexOf(this.testString) !== -1;

	//return boolLoggedIn;
};


BodyInspector.prototype.inspectVisit = function(oIncomingMessage){

	this.strategy.inspectVisit(this);

	console.log(util.inspect(oIncomingMessage.headers));
	console.log(util.inspect(oIncomingMessage.statusMessage));
	console.log(util.inspect(oIncomingMessage.trailers));
	console.log(util.inspect(oIncomingMessage.statusCode));

	if(oIncomingMessage.statusCode == this.status){
		this.interactor.visited = true;
	}
};


module.exports = BodyInspector;