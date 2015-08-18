/**
 * //@by_rcmonitor@//
 * on 17.08.2015.
 */

var path = require('path');
var fs = require('fs');

var strRootPath = path.join(__dirname, '..');

var ScrapeVisitor = require(path.join(strRootPath, 'index'));

fs.unlinkSync(path.join(strRootPath, 'test', 'log', 'superjob.log'));

var oSJVisitor = new ScrapeVisitor(path.join(strRootPath, 'test'), 'superjob');

oSJVisitor.update();
