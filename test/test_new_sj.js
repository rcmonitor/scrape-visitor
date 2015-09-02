/**
 * //@by_rcmonitor@//
 * on 24.08.2015.
 */

var path = require('path');

var hpg = require('helpers-global');
var Environment = hpg.Environment;

Environment.setProduction();

var strRootPath = path.join(__dirname, '..');

var ScrapeVisitor = require(path.join(strRootPath, 'index'));

hpg.ensureFileNotExistsSync(path.join(strRootPath, 'test', 'log', 'new_superjob.log'));

var oSJVisitor = new ScrapeVisitor(path.join(strRootPath, 'test'), 'new_superjob');

oSJVisitor.update();
