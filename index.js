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

function keyValsToObject(keyVals) {
  var ob = {};
  for (var i = 0; i < keyVals.length; i++) {
    ob[keyVals[i][0]] = keyVals[i][1];
  }
  return ob;
}

XmlCollector.prototype.onStartElement = function(elem, attrs) {
  this.elementStack.push(elem);

  var currentHandler = topOf(this.handlerStack);
  var childHandler = currentHandler && currentHandler.children ? currentHandler.children[elem] : null;
  this.handlerStack.push(childHandler);
  var stackTop = topOf(this.contextStack);
  if (childHandler && childHandler.enterCb) {
    this.contextStack.push(childHandler.enterCb.call(
      this, 
      stackTop, 
      keyValsToObject(attrs), 
      attrs));
  } else {
    this.contextStack.push(stackTop);
  }
};

XmlCollector.prototype.onEndElement = function(elem) {
  this.elementStack.pop();
  var wasHandling = this.handlerStack.pop();
  var wasContext = this.contextStack.pop();
  if (wasHandling && wasHandling.exitCb) {
    wasHandling.exitCb.call(this, topOf(this.contextStack), wasContext);
  }
};

XmlCollector.prototype.onCharacters = function(str) {
  var handler = topOf(this.handlerStack);
  if (handler && handler.textCb) {
    handler.textCb.call(this, topOf(this.contextStack), str);
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
  this.emit('end');
};



XmlCollector.Node = function() {
  this.enterCb = null;
  this.exitCb = null;
  this.textCb = null;
  this.children = {};
}
XmlCollector.Node.prototype.enter = function(fn) {
  this.enterCb = fn;
  return this;
};
XmlCollector.Node.prototype.exit = function(fn) {
  this.exitCb = fn;
  return this;
}
XmlCollector.Node.prototype.text = function(fn) {
  this.textCb = fn;
  return this;
}
XmlCollector.Node.prototype.child = function(elem, node) {
  if (typeof elem === 'string') {
    this.children[elem] = node;
  } else {
    for (var i = elem.length - 1; i > 0; i--) {
      node = new XmlCollector.Node().child(elem[i], node);
    }
    this.children[elem[0]] = node;
  }
  return this;
}


XmlCollector.collectText = function(withText) {
  return new XmlCollector.Node()
    .enter(function() { return [] })
    .text(function(fragments, str) { fragments.push(str); })
    .exit(function(ctx, fragments) { return withText.call(this, ctx, fragments.join(''))})
};

XmlCollector.collectTextInto = function(field, transform) {
  return XmlCollector.collectText(function(ctx, text) {
    if (transform) text = transform(text)
    ctx[field] = text;
  });
};
