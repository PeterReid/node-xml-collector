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
      children: {
        'line': {
          enter: function() { return new Line() },
          children: {
            'point': {
              enter: function() { return new Point(); },
              children: {
                'x': {
                  enter: function() { return []; },
                  text: function(fragments, str) { fragments.push(str); },
                  exit: function(point, fragments) { point.x = fragments.join(''); }
                },
                'y': {
                  enter: function() { return []; },
                  text: function(fragments, str) { fragments.push(str); },
                  exit: function(point, fragments) { point.y = fragments.join(''); }
                }
              },
              exit: function(line, point) { line.points.push(point); }
            }
          },
          exit: function(figure, line) { figure.push(line); }
        }
      },
      exit: function(ctx, shapes) { this.emit('figure', shapes); }
    }
  }
})).on('figure', function(figure) {
  console.log('figure:', JSON.stringify(figure));
});
