// Figment -> Caterwaul semantics | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module gives you a way to run Figment code from within Caterwaul, with essentially full interoperability. The idea is that Figment is treated as just another surface syntax for Caterwaul,
// so you can write Caterwaul macros against it and have it interoperate with caterwauled Javascript. The advantage, however, is that you get the improved expressiveness that comes with breaking
// out of Javascript's syntax.

// As it stands, the module is fairly minimal; if it finds an operator that Javascript doesn't support, it converts it into a method call. It also fully parenthesizes the syntax tree (except for
// commas), which helps to ensure that Figment's precedence is encoded properly into Javascript. Somewhat importantly, certain Javascript operators are impossible to express in Figment. One of
// these is the ternary operator, which is an implicit group. So, rather than writing x ? y : z, you write x ? y z in Figment (with appropriate grouping).

// Like Caterwaul code, Figment has access to the macroexpander and has a full compile-time evaluation mechanism. This means that you can write new macros from inside Figment. (I wasn't going to
// go to the trouble of writing a whole new language without having a good macro mechanism for it, after all...) The internals of this work about like they do for Caterwaul. Basically, when a
// compiler directive is encountered Caterwaul suspends macroexpansion briefly, compiles the segment with the current macro set, and executes the code. A reference to the result is dropped into
// the compiled code.

// Configuration.
// Regular Caterwaul configurations and Figment configurations coexist in the macroexpansion layer, producing one implicitly composed compilation phase into Javascript. This imposes some
// interesting requirements, naturally. The most noticeable one is that the Figment transformations have to happen before the Caterwaul libraries are processed, which means that the caterwaul
// configurations for Figment must come /after/ the ones for caterwaul modules (well, after the caterwaul macro-defining modules anyway).

// So basically, here's how to get a valid Figment compiler:

// | var caterwaul_libs = 'std seq continuation parser';
//   var figment_libs   = 'fig.std fig.html';      // Making these up
//   var fig = caterwaul.clone(caterwaul_libs, 'figment', figment_libs);

// In this case, the Figment libraries are written in Figment, not in Caterwaul. The reason is a good one: once you configure a Caterwaul function with the 'figment' configuration, it compiles
// only Figment source, not Javascript. By extension, this means that Figment configurations are strings (!) transformed by the 'figment' configuration. So to define a Figment library:

// | caterwaul.tconfiguration('figment', 'fig.std', 'figment_code');

// As far as I know there is no particularly palatable way to embed arbitrary multiline strings into Javascript code. What probably makes sense is to load Figment files, compiling them on the
// fly:

// | caterwaul.tconfiguration('figment', 'fig.std', require('fs').readFileSync('std.fig', 'utf8'));

// The browser environment is on the one hand trickier, and on the other hand not as bad. It supports synchronous loading through <script> tags; all that needs to be done to handle Figment source
// is to create a driver that recognizes <script> tags whose type is 'text/figment' and stores them as local strings to be evaluated later by the Figment compiler.

// Conversion.
// The core Figment conversion is fairly straightforward. The basic idea is, "render exactly as the user typed it if it's syntactically valid in Javascript; otherwise, fudge stuff until it
// works." This with the caveat that everything Figment converts is in expression context, not statement context -- so 'if (x) {y}' will render as a curried function call, not an if-statement.

// Here is what happens:

// | 1. Identifiers, operators, etc. are preserved modulo a bit of encoding. Because Figment supports identifier characters that aren't allowed in Javascript, it uses dollar-encoding where
//      necessary.
//   2. Regular unary and binary operators (i.e. those supported in Javascript) are converted to Javascript syntax trees and wrapped inside parentheses to make sure precedence is stable.
//   3. Irregular unary and binary operators are converted to method calls. So for instance 'a ++ b' is converted to 'a["++"](b)'.
//   4. Joins are converted in one of two ways. A join against a paren or bracket is converted as an invocation or dereference, and a join onto anything else is converted as a function call. So,
//      for example, 'f(x)' is identity, as is 'f[x]'. But 'f x' becomes f(x), and 'f"foo"' becomes f("foo").
//   5. Braced groups are checked for validity. If each comma-expression contains a colon, then it's converted to a regular Javascript object. Otherwise it's converted into a method call on the
//      braced value: {foo bar bif} becomes foo(bar)(bif)['{}']().
//   6. Dots are preserved and are associative; that is, 'foo.bar.bif' renders as 'foo.bar.bif', even though Javascript reinterprets the dot to associate left.
//   7. String and numeric literals are converted identically.
//   8. The letter 'r' joined to a string becomes a regular expression, e.g: 'r"foo"' becomes /foo/.

caterwaul.tconfiguration('std seq continuation', 'fig.semantics', function () {
  this.macro(qs[_], transform),

//   Implementation details.
//   There are some shortcuts in this implementation because of the way Figment parses stuff. Perhaps the most notable one deals with figuring out whether a braced group is syntactically valid.
//   Figment right-associates things, so a valid braced group has the characteristic that each member of the comma expression (assuming a comma at all) will have as its data element a colon. Then
//   the left side will be nullary, signifying a constant of some sort. (Any constant will do; it doesn't have to be a literal, and I'm not handling the case of reserved words.)

//   This has the possibly frustrating side-effect that the : must be spaced apart from the key and value; otherwise it's considered a tight join and won't percolate to the top of the precedence
//   hierarchy. (This concern is obviously subject to any macros that might fix the problem by rearranging stuff.)

  where*[qualifies_for_regexp_promotion(t) = t.data === 'join' && t[0].match(qs[r]) && t[1].is_string(),
         is_valid_braced_group(t)          = t.data === '{' && l*[valid_kv_pair(t)        = t && t.data === ':' && t[0].length === 0,
                                                                  valid_braced_element(t) = t && (t.data === ',' ? valid_kv_pair(t[0]) && valid_braced_element(t[1]) :
                                                                                                  t.data === ':' ? valid_kv_pair(t[0]) : false)] in valid_braced_element(t[0]),

         valid_binary_operators            = seq[~'* / % + - << >> >>> & | ^ && || < > <= >= == != === !== = += -= *= /= %= <<= >>= >>>= &= |= ^='.split(/\s+/) *[[_, true]]].object(),
         valid_unary_operators             = seq[~'u+ u- u~ u!'.split(/\s+/) *[[_, true]]].object(),
         is_valid_binary_operator(t)       = valid_binary_operators.hasOwnProperty(t.data),
         is_valid_unary_operator(t)        = valid_unary_operator.hasOwnProperty(t.data),

         is_valid_invocation_target(t)     = t.data === '(' || t.data === '[',

         // Conversion logic (above is the detection logic):
         regexp_promotion(t)               = qualifies_for_regexp_promotion(t) && new caterwaul.syntax(t[1].data.replace(/\//g, '\\$1') /re['/#{_.substring(1, _.length - 1)}/']),
         constant_literal(t)               = t.is_constant() && t,
         dot(t)                            = t.length === 2 && t.data === '.' && t,
         braced_group(t)                   = t.data === '{' && (is_valid_braced_group(t) ? t : qs[_x['{}']()].replace({_x: t[0]})),
         direct_join_as_invocation(t)      = t.data === 'join' && is_valid_invocation_target(t[1]) && qs[_x(_y)].replace({_x: t[0], _y: t[1][0]}),
         join_to_invocation_promotion(t)   = t.data === 'join' && qs[_x(_y)].replace({_x: t[0], _y: t[1]}),
         binary_operator(t)                = t.length === 2 && (is_valid_binary_operator(t) ? t.as('(') : qs[_l[_op](_r)].replace({_l: t[0], _op: '"#{t.data}"', _r: t[1]})),
         unary_operator(t)                 = t.length === 1 && (is_valid_unary_operator(t)  ? t.as('(') : qs[_l[_op]()].  replace({_l: t[0], _op: '"#{t.data}"'})),

         identifier_mapping                = {'\'': '$prime', '?': '$q', '!': '$bang'},
         identifier(t)                     = t.length === 0 && /[A-Za-z0-9_]/.test(t.data.charAt(0)) &&
                                             t /se[_.data = _.data /re[_ && _.replace(/[^A-Za-z0-9_$]/g, fn[c][identifier_mapping[c] || '$#{c.charCodeAt(0).toString(16)}'])
                                                                            /re[/\d/.test(_.charAt(0)) ? '$#{_}' : _]]],
         // The tree-walking transformation:
         transform_single(t)               = regexp_promotion(t) || constant_literal(t) || dot(t) || braced_group(t) || direct_join_as_invocation(t) || join_to_invocation_promotion(t) ||
                                             binary_operator(t) || unary_operator(t) || identifier(t) || t,
         transform(t)                      = t && transform_single(t.map(transform))]});
// Generated by SDoc 
