// Caterwaul std integration.

caterwaul.clone('std')(function () {
  defsubst[_x == _y][l[xc = _x, yc = _y][xc === yc || null['#{xc} should === #{yc}']]];
  var fig = caterwaul.clone('fig.semantics fig.parser').after(caterwaul.clone('std seq continuation'));

  fig('x + 1, where[x = 10]') == 11;
})();
// Generated by SDoc 