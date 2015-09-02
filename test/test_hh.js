/**
 * //@by_rcmonitor@//
 * on 29.08.2015.
 */

var path = require('path');

var hpg = require('helpers-global');
var Environment = hpg.Environment;

Environment.setDevelopment();

var strRootPath = path.join(__dirname, '..');

var ScrapeVisitor = require(path.join(strRootPath, 'index'));

hpg.ensureFileNotExistsSync(path.join(strRootPath, 'test', 'log', 'hh.log'));

var oSJVisitor = new ScrapeVisitor(path.join(strRootPath, 'test'), 'hh');

oSJVisitor.update();
