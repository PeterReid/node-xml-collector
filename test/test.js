var fs = require('fs');
var XmlCollector = require('../index');

function Point() {
}
function Line() {
  this.type = 'line';
  this.points = [];
}
function Circle(radius, x, y) {
  this.type = 'circle';
  this.radius = radius;
  this.x = x;
  this.y = y;
}

fs.createReadStream('./small.xml').pipe(new XmlCollector({
  children: {
    'figure': {
      enter: function() { return []; },
      exit: function(ctx, shapes) { this.emit('figure', shapes); },
      children: {
        'line': {
          enter: function() { return new Line() },
          exit: function(figure, line) { figure.push(line); },
          children: {
            'point': {
              enter: function() { return new Point(); },
              exit: function(line, point) { line.points.push(point); },
              children: {
                'x': XmlCollector.collectTextInto('x', parseFloat),
                'y': XmlCollector.collectTextInto('y', parseFloat)
              }
            }
          }
        },
        'circle': {
          enter: function(figure, attrs) {
            console.log(attrs);
            figure.push(new Circle(attrs.radius, parseFloat(attrs.x),  parseFloat(attrs.y)));
          }
        }
      }
    }
  }
})).on('figure', function(figure) {
  console.log('figure:', JSON.stringify(figure));
});
