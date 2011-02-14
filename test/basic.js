// Basic tests for the lexer/parser.

caterwaul.clone('std figment')(function () {
  el('foo', 'foo'),

  eq('foo', qs[foo]),
  eq('_foo_', qs[_foo_]),

  eq('(_foo_)', qse[qg[_foo_]]),
  eq('[_foo_]', qse[[_foo_]]),

  eq('foo+bar', qs[foo + bar]),
  eq('foo+bar-bif', qs[foo + _x].replace({_x: qs[bar - bif]})),
  eq('foo+bar - bif', qs[foo + bar - bif]),
  eq('foo +bar', qs[foo + _x].replace({_x: qs[+bar] /se[_.data = '+']}) /se[_.data = 'ljoin']),
  eq('"foo"bar', qs["foo" + bar] /se[_.data = 'tjoin']),

  eq('+bif', qs[+bif] /se[_.data = '+']),
  eq('-%%!$`bif', qs[+bif] /se[_.data = '-%%!$`']),
  eq('bar.bif', qs[bar.bif]),

  eq('bar + bif-baz', qs[bar + _x].replace({_x: qs[bif - baz]})),

  eq('"foo"', qs["foo"]),
  eq('"foo bar"', qs["foo bar"]),

  eq('foo^^%bar', qs[foo + bar] /se[_.data = '^^%']),
  where*[count       = 0,
         equal(a, b) = ++count /se[a === b || null['#{a} should === #{b} (#{count})']],
         el(s, t)    = equal(caterwaul.figment.lex(s), t),
         eq(s, t)    = equal(qs[_x].replace({_x: caterwaul.figment.parse(s)}).toString(), t.toString())]})();
// Generated by SDoc 
