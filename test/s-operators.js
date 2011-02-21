// Tests for unary/binary operator translation.

console.log('starting test s-operators');
caterwaul.clone('std seq continuation')(function () {
  defsubst[_x == _y][l[xc = _x, yc = _y][xc === yc || null['#{xc} should === #{yc}']]];

  var fig = caterwaul.clone('fig.semantics fig.parser');

  fig('3 + 4') == 7;
  fig('3 + 4 + 5') == 12;
  fig('3 * 4 + 5') == 17;

  fig('4 / 4') == 1;

  fig('4["toString"]') == Number.prototype.toString;

  fig('3.toString()') == '3';
  fig('3.141592.toString()') == '3.141592';

  fig('print 3', {print: fn[x][x.toString()]}) == '3';
  fig('f(3, 4)', {f: fn[x, y][x + y]}) == 7;

  fig('f g x', {x: 5, f: fn[x][2 * x], g: fn[x][x + 1]}) == 12;
  fig('(f x) y', {x: 5, y: 6, f: fn[x][fn[y][x + y]]}) == 11;
  fig('(f x) g y', {x: 5, y: 6, g: fn[x][x * 2], f: fn[x][fn[y][x + y]]}) == 17;
  fig('(f x) (g y)', {x: 5, y: 6, g: fn[x][x * 2], f: fn[x][fn[y][x + y]]}) == 17;
  fig('(f x)(g y)', {x: 5, y: 6, g: fn[x][x * 2], f: fn[x][fn[y][x + y]]}) == 17;
  fig('(f x)y', {x: 5, y: 6, f: fn[x][fn[y][x + y]]}) == 11;
  fig('g (f x)y', {x: 5, y: 6, g: fn[x][x * 2], f: fn[x][fn[y][x + y]]}) == 22;

  fig('(x["toString"])()', {x: 5}) == '5';

  fig('x >>= 7', {x: {'>>=': fn[x][6 + x]}}) == 13;
  fig('x :: 8', {x: {'::': fn[x][6 + x]}}) == 14;
  fig('x =bif 9', {x: {'=bif': fn[x][6 + x]}}) == 15;
  fig('x? =bif 10', {'x$q': {'=bif': fn[x][6 + x]}}) == 16;
  fig('x! =bif 11', {'x$bang': {'=bif': fn[x][6 + x]}}) == 17;
  fig('x!=bif 12', {'x$bang': {'=bif': fn[x][6 + x]}}) == 18;
})();
// Generated by SDoc 
