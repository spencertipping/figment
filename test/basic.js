// Basic tests for the lexer/parser.

caterwaul.clone('std')(function () {
  el('foo', 'foo'),

  eq('foo', qs[foo]),
  eq('_foo_', qs[_foo_]),

  eq('(_foo_)', qse[qg[_foo_]]),
  eq('[_foo_]', qse[[_foo_]]),

  eq('()', qs[[]] /se[_.data = '(']),
  eq('{}', qs[[]] /se[_.data = '{']),
  eq('[]', qs[[]]),

  eq('foo?', qs[foo] /se[_.data = 'foo?']),
  eq('foo?!', qs[foo] /se[_.data = 'foo?!']),
  eq('foo?!\'', qs[foo] /se[_.data = 'foo?!\'']),
  eq('foo\'\'', qs[foo] /se[_.data = 'foo\'\'']),
  eq('foo\'\'"bar"', qs[_x + "bar"] /se[_[0] = qs[foo] /se[_.data = 'foo\'\''], _.data = 'join']),

  eq('foo"bar"bif', qs[foo + _x].replace({_x: qs["bar" + bif] /se[_.data = 'join']}) /se[_.data = 'join']),

  eq('foo+bar', qs[foo + bar]),
  eq('foo+bar-bif', qs[foo + _x].replace({_x: qs[bar - bif]})),
  eq('foo+bar - bif', qs[foo + bar - bif]),
  eq('foo +bar', qs[foo + _x].replace({_x: qs[+bar] /se[_.data = '+']}) /se[_.data = 'join']),
  eq('"foo"bar', qs["foo" + bar] /se[_.data = 'join']),

  // Some of these numerical tests will fail on SpiderMonkey-based platforms:
  eq('3', qs[3]),
  eq('3.1', qs[3.1]),
  eq('3.1e+4', qs[3.1e+4]),
  eq('3.1e-4', qs[3.1e-4]),
  eq('3.1e4', qs[3.1e4]),
  eq('3.1E+4', qs[3.1E+4]),
  eq('3.1E-4', qs[3.1E-4]),
  eq('3.1E4', qs[3.1E4]),

  eq('0', qs[0]),
  eq('0.0', qs[0.0]),
  eq('0.0e+0', qs[0.0e+0]),
  eq('0.0e-0', qs[0.0e-0]),
  eq('0.0e0', qs[0.0e0]),
  eq('0.0E+0', qs[0.0E+0]),
  eq('0.0E-0', qs[0.0E-0]),
  eq('0.0E0', qs[0.0E0]),

  eq('foo =bar bif', qs[foo + bif] /se[_.data = '=bar']),
  eq('=bar bif', qs[+bif] /se[_.data = '=bar']),
  eq('_+% + _-#!', qs[_x + _y].replace({_x: '_+%', _y: '_-#!'})),

  eq('foo,bar', qs[foo,bar]),
  eq('foo+bif,bar', qs[foo + bif, bar]),
  eq('foo + bif,bar', qs[foo + bif, bar]),
  eq('foo, bar+bif', qs[foo, bar + bif]),
  eq('foo, bar + bif', qs[foo, bar + bif]),

  eq('this.hello_world = \'hello world!\'', qs[this.hello_world = 'hello world!']),

  eq('+bif', qs[+bif] /se[_.data = '+']),
  eq('-%%!$`bif', qs[+bif] /se[_.data = '-%%!$`']),
  eq('bar.bif', qs[bar.bif]),

  eq('bar + bif-baz', qs[bar + _x].replace({_x: qs[bif - baz]})),

  eq('"foo"', qs["foo"]),
  eq('"foo bar"', qs["foo bar"]),

  eq('foo^^%bar', qs[foo + bar] /se[_.data = '^^%']),
  where*[count       = 0,
         figment     = caterwaul.clone('fig.parser'),
         equal(a, b) = ++count /se[a === b || null['#{a} should === #{b} (#{count})']],
         el(s, t)    = equal(figment.lex(s), t),
         eq(s, t)    = equal(qs[_x].replace({_x: figment.parse(s)}).toString(), t.toString())]})();
// Generated by SDoc 
