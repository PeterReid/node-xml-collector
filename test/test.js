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

fs.createReadStream('./small.xml').pipe(new XmlCollector(new XmlCollector.Node()
  .child('figure', new XmlCollector.Node()
    .enter(function() { return []; })
    .exit(function(ctx, shapes) { this.emit('figure', shapes) })
    
    .child('line', new XmlCollector.Node()
      .enter(function() { return new Line(); })
      .exit(function(figure, line) { figure.push(line); })
      .child('point', new XmlCollector.Node()
        .enter(function() { return new Point(); })
        .exit(function(line, point) { line.points.push(point); })
        .child('x', XmlCollector.collectTextInto('x', parseFloat))
        .child('y', XmlCollector.collectTextInto('y', parseFloat))))

    .child('circle', new XmlCollector.Node()
      .enter(function(figure, attrs) {
        console.log(attrs)
        figure.push(new Circle(parseFloat(attrs.radius), 
                               parseFloat(attrs.x), 
                               parseFloat(attrs.y)));
      })))
)).on('figure', function(figure) {
  console.log('figure:', JSON.stringify(figure));
});


fs.createReadStream('./nested.xml').pipe(new XmlCollector(new XmlCollector.Node()
  .child(['a', 'b', 'c', 'd', 'e', 'f'], 
         XmlCollector.collectText(function(ctx, text) {
           this.emit('f', text)
         }))
)).on('f', function(text) {
  console.log('f:', text);
});
