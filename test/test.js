var fs = require('fs');
var XmlCollector = require('../index');

function Point() {
}
function Line() {
  this.points = [];
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
                'x': XmlCollector.collectTextInto('x'),
                'y': XmlCollector.collectTextInto('y')
              }
            }
          }
        }
      }
    }
  }
})).on('figure', function(figure) {
  console.log('figure:', JSON.stringify(figure));
});
