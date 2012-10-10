var fs = require('fs');
var XmlCollector = require('../index');

fs.createReadStream('./small.xml').pipe(new XmlCollector({}))