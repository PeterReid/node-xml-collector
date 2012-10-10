var util = require('util');
var SaxParser = require('node-xml').SaxParser;
var EventEmitter = require("events").EventEmitter;

var XmlCollector = exports = module.exports = function() {
  EventEmitter.call(this);
  
  
};
util.inherits(XmlCollector, EventEmitter);