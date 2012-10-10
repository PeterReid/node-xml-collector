var util = require('util');
var SaxParser = require('node-xml').SaxParser;
var EventEmitter = require("events").EventEmitter;

var XmlCollector = exports = module.exports = function() {
  var self = this;
  EventEmitter.call(this);
  
  
  this.parser = new SaxParser(function(cb) {
    cb.onStartElementNS(self.onStartElement.bind(self));
    cb.onEndElementNS(self.onEndElement.bind(self));
    cb.onCharacters(self.onCharacters.bind(self));
    cb.onWarning(self.onWarning.bind(self));
    cb.onError(self.onError.bind(self));
  });
};

XmlCollector.prototype.onStartElement = function(elem, attrs) {

};

XmlCollector.prototype.onEndElement = function(elem) {

};

XmlCollector.prototype.onCharacters = function(str) {

};

XmlCollector.prototype.onWarning = function(msg) {
  self.emit('warning', new Error(msg));
};

XmlCollector.prototype.onError = function(msg) {
  self.emit('error', new Error(msg));
};

util.inherits(XmlCollector, EventEmitter);
