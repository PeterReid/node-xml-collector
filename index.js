var util = require('util');
var SaxParser = require('node-xml').SaxParser;
var EventEmitter = require("events").EventEmitter;

var XmlCollector = exports = module.exports = function(rootHandler) {
  var self = this;
  EventEmitter.call(this);
  this.elementStack = [];
  this.handlerStack = [rootHandler];
  this.contextStack = [];
  
  this.parser = new SaxParser(function(cb) {
    cb.onStartElementNS(self.onStartElement.bind(self));
    cb.onEndElementNS(self.onEndElement.bind(self));
    cb.onCharacters(self.onCharacters.bind(self));
    cb.onWarning(self.onWarning.bind(self));
    cb.onError(self.onError.bind(self));
  });
};
util.inherits(XmlCollector, EventEmitter);

function topOf(xs) {
  return xs[xs.length-1];
}

XmlCollector.prototype.onStartElement = function(elem, attrs) {
  this.elementStack.push(elem);

  var currentHandler = topOf(this.handlerStack);
  var childHandler = currentHandler && currentHandler.children ? currentHandler.children[elem] : null;
  this.handlerStack.push(childHandler);
  if (childHandler && childHandler.enter) {
    this.contextStack.push(childHandler.enter.call(this, topOf(this.contextStack)));
  } else {
    this.contextStack.push(null);
  }
};

XmlCollector.prototype.onEndElement = function(elem) {
  this.elementStack.pop();
  var wasHandling = this.handlerStack.pop();
  var wasContext = this.contextStack.pop();
  if (wasHandling && wasHandling.exit) {
    wasHandling.exit.call(this, topOf(this.contextStack), wasContext);
  }
};

XmlCollector.prototype.onCharacters = function(str) {
  var handler = topOf(this.handlerStack);
  if (handler && handler.text) {
    handler.text.call(this, topOf(this.contextStack), str);
  }
};

XmlCollector.prototype.onWarning = function(msg) {
  this.emit('warning', new Error(msg));
};

XmlCollector.prototype.onError = function(msg) {
  this.emit('error', new Error(msg));
};

XmlCollector.prototype.write = function(str) {
  this.parser.parseString(str);
};

XmlCollector.prototype.writable = true;

XmlCollector.prototype.end = function(str) {
  if (str) {
    this.parser.parseString(str);
  }

  if (this.elementStack.length > 0) {
    this.emit('error', new Error('XML document ended with these tags open: '
                                 + this.elementStack.join(', ')));
  }
};


XmlCollector.collectText = function(withText) {
  return {
    enter: function() { return [] },
    text: function(fragments, str) { fragments.push(str); },
    exit: function(context, fragments) { return withText(context, fragments.join('')); }
  };
};

