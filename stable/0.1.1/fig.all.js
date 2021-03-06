// Figment require() function | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module enables dynamic Figment loading and translation by adding a require() method to Caterwaul. The same function can be used on either the client or the server; require() detects the
// environment and behaves accordingly. Usage is similar to configure() or clone():

// | caterwaul.clone('fig.require').require('http://somewhere.com/path/library.fig /usr/share/figment/std.fig');

// Unlike Javascript, the scripts that are require()d aren't executed in the global context. Rather, they're executed inside a closure with access to the evaluating caterwaul function. Libraries
// generally add some configuration to the function (but don't actually apply it), e.g. (in Figment):

// | this.configuration('cons-macro', {qs[_x :: _y] :> qs[cons(_x, _y)]})

// There is no need to use tconfiguration() because the requiring caterwaul function will automatically macroexpand the Figment source in the process of compiling it to Javascript.

// Server-side require.
// Because requiring stuff is a fundamentally synchronous thing to do (and generally not done after app initialization), blocking methods are used to load things. The only mechanism for loading
// things is the filesystem; loading files over HTTP isn't supported yet. Also, because I'm being lazy, files are loaded synchronously rather than using CPS.

  caterwaul.tconfiguration('std seq continuation', 'fig.require.nodejs', function () {
    this.method('figment_require', fn[files, cc][cc(seq[~files.split(/\s+/) *[fs.readFileSync(_, 'utf8')]].slice())])}, {fs: typeof require === 'undefined' || require('fs')}).

// Client-side require.
// This is a bit more challenging because it involves AJAX. Basically we load the script using an AJAX request, then evaluate it as soon as the script comes back. To do this sensibly we need to
// have a callback that executes once all of the code is loaded. For example:

// | caterwaul.clone('fig').require('/path/to/source1.fig /path/to/source2.fig', function () {
//     // In here, 'this' is set to a configured clone of the original requiring function.
//     this.configure('source1-module');
//     this.module1.do_something();
//   });

// The callback function isn't run through caterwaul. This gives it the ability to refer to closure state.

  tconfiguration('std seq continuation', 'fig.require.ajax', function () {
    this.method('figment_require', fn[files, cc][
      l*[file_list = seq[~files.split(/\s+/)], contents = {}, requests_left = file_list.size(), got_everything() = cc(seq[file_list *[contents[_]]]),
         receive(filename)(data) = --requests_left /se[contents[filename] = data, _ || got_everything()]] in

      seq[file_list *![get(_, receive(_))]]]),

    where*[create_xhr()      = window.XMLHttpRequest /re[_ ? new _() : new ActiveXObject('Microsoft.XMLHTTP')],
           get(url, success) = create_xhr() /se[_.open('GET', url, true), _.send(), _.onreadystatechange() = _.readyState === 4 && success(_.responseText)]]}).

// Require shell.
// This part manages the logic of configuring a caterwaul function once the source is retrieved. There isn't much involved; we just end up invoking a callback. The only thing is that your
// caterwaul function should already be configured as a figment parser for this to work. (The 'fig' configuration takes care of this for you.)

  tconfiguration('std seq continuation', 'fig.require', function () {
    this.configure(typeof window === 'undefined' ? 'fig.require.nodejs' : 'fig.require.ajax').
         method('require', fn[modules, cc][this.figment_require(modules, _) /cpb[seq[~_ *![c(_, {'this': c})]], cc && cc.call(c), where[c = this.clone()]]])});
// Generated by SDoc 

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
//   5. Braced groups are assumed to be valid Javascript objects. This means a couple of things. One is that the colon operator is left alone (which could easily break stuff), and the other is
//      that you need to define macros to transform {} blocks if you want a different meaning for them.
//   6. Dots are preserved and are associative; that is, 'foo.bar.bif' renders as 'foo.bar.bif', even though Javascript reinterprets the dot to associate left. The same goes for commas and
//      colons, in order to satisfy various Javascript syntax constraints.
//   7. String and numeric literals are converted identically.
//   8. The letter 'r' joined to a string becomes a regular expression, e.g: 'r"foo"' becomes /foo/.

caterwaul.tconfiguration('std seq continuation', 'fig.semantics', function () {
  this.macro(qs[_], transform),

  where*[qualifies_for_regexp_promotion(t) = t.data === 'join' && t[0].match(qs[r]) && t[1].is_string(),

         operator_bucket(ops)              = l[bucket = seq[~ops.split(/\s+/) *[[_, true]]].object()] in fn[t][bucket.hasOwnProperty(t.data)],
         is_valid_binary_operator          = operator_bucket('* / % + - << >> >>> & | ^ && || < > <= >= == != === !=='),
         is_valid_unary_operator           = operator_bucket('u+ u- u~ u!'),
         is_valid_groupless_operator       = operator_bucket('= : , .'),

         // Conversion logic (above is the detection logic):
         regexp_promotion(t)               = qualifies_for_regexp_promotion(t) && new caterwaul.syntax(t[1].data.replace(/\//g, '\\$1') /re['/#{_.substring(1, _.length - 1)}/']),
         constant_literal(t)               = t.is_constant() && t.as('('),

         regular_group(t)                  = (t.data === '(' || t.data === '[' || t.data === '{') && t,
         direct_join_as_invocation(t)      = t.data === 'join' && (t[1].data === '(' && qs[_x(_y)].replace({_x: t[0], _y: t[1][0]}) ||
                                                                   t[1].data === '[' && qs[_x[_y]].replace({_x: t[0], _y: t[1][0]})),
         join_to_invocation_promotion(t)   = t.data === 'join' && qs[_x(_y)].replace({_x: t[0], _y: t[1]}),

         groupless_operator(t)             = t.length === 2 && is_valid_groupless_operator(t) && t,
         binary_operator(t)                = t.length === 2 && (is_valid_binary_operator(t) ? t.as('(') : qs[_l[_op](_r)].replace({_l: t[0], _op: '"#{t.data}"', _r: t[1]})),
         unary_operator(t)                 = t.length === 1 && (is_valid_unary_operator(t)  ? t.as('(') : qs[_l[_op]()].  replace({_l: t[0], _op: '"#{t.data}"'})),

         identifier_mapping                = {'\'': '$prime', '?': '$q', '!': '$bang'},
         identifier(t)                     = t.length === 0 && /[A-Za-z0-9_]/.test(t.data.charAt(0)) &&
                                             t /se[_.data = _.data /re[_ && _.replace(/[^A-Za-z0-9_$]/g, fn[c][identifier_mapping[c] || '$#{c.charCodeAt(0).toString(16)}'])
                                                                            /re[/\d/.test(_.charAt(0)) ? '$#{_}' : _]]],
         // The tree-walking transformation:
         transform_single(t)               = regexp_promotion(t) || constant_literal(t) || groupless_operator(t) || regular_group(t) || direct_join_as_invocation(t) ||
                                             join_to_invocation_promotion(t) || binary_operator(t) || unary_operator(t) || identifier(t) || t,
         transform(t)                      = t && transform_single(t.map(transform))]});
// Generated by SDoc 

// Figment parser | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Figment is a language motivated by the core ideas behind Caterwaul. Caterwaul is in general an enormous step forward from plain Javascript (from my perspective anyway), enabling a whole new
// level of expressiveness. However, Javascript is sometimes hard to work with -- the lvalue restriction is particularly difficult, as is the limited selection of operators. For this reason I've
// decided to break out of Javascript's syntax and use Caterwaul's loose syntax trees for a more extensible and expressive language.

// Basic elements.
// Figment sees the world similarly to Caterwaul; that is, expressions are joined by infix and prefix operators, or by an implicit join action. (Analogous to 'i;' from a parsing perspective,
// though the meaning is different.) Unlike Caterwaul, syntax trees don't encode preassigned operator precedence or syntactic constructs; it's just a big tree of operators and expressions. The
// grammar rules are basically these (where \w is [A-Za-z0-9_] -- so it's totally fine to begin an identifier with a digit):

// | operator ::= '=' ident | /[-+\/*&^%$#@!`~:\\|=?<>.;]+/
//   ident    ::= /\w+['?!]*/
//   atom     ::= '_' operator | /\d+/ | /\d*\.\d+([eE][-+]?\d+)?/ | /(['"])([^\1]|\\.)*\1/ | ident
//   parens   ::= '(' expression ')'
//   brackets ::= '[' expression ']'
//   braces   ::= '{' expression '}'

// Ambiguities in this grammar are resolved in the PEG way -- that is, by taking the first matching alternative and not backtracking.

// Expressions and operator precedence.
// Operators themselves don't have precedence, but the way they're typed implies things about the bind order. There are also the issues of joins and prefix operators, which when combined probably
// make the grammar a bit ambiguous. In a nutshell, here are the rules:

// | 1. Two expressions directly adjacent to each other (no whitespace) bind with highest precedence. The operator that binds them is a 'join', which basically means juxtaposition.
//   2. One expression prefixed by an operator with no whitespace binds next. This is interpreted as a prefix operator, but only if the spacing is asymmetric: a +b treats + as prefix, whereas a+b
//      treats the + as binary.
//   3. Two expressions separated by a binary operator with no whitespace binds next. Whitespace on the right-side of the operator is ignored; this lets you insert linewraps around tight
//      bindings. So, for example, a+b and a+ b mean the same thing.
//   4. Two expressions separated by whitespace binds next. This creates a join.
//   5. One expression prefixed by an operator with whitespace binds next. It happens only at the beginning of groups or after another operator: a + + b and (+ a), for example.
//   6. A binary operator with whitespace around it binds next: a + b. It doesn't matter how much whitespace is there, or whether it's symmetric. It just needs to be on both sides.
//   7. Finally, a comma binds last. It's used to separate expressions, and has the lowest precedence regardless of surrounding whitespace.

// Somewhat counterintuitively, everything right-associates. This is in part due to my own laziness, and in part due to the fact that having things left-associate would be somewhat arbitrary.
// But, for example, a + b + c is consed into (+ a (+ b c)), not (+ (+ a b) c).

// Linguistically the matter is one of preferring either point-free or point-ful. Because most sentences are phrased in SVO order, left-associativity focuses on building up the SV pair with
// postfix modifiers (e.g. 'runs quickly', or 'runs(quickly)(somewhere), which is more like function currying); whereas right-associativity would focus on building the object, modifying it in
// reverse (like function application; e.g. 'quickly runs', which renders as 'quickly(runs(somewhere))').

// Toplevel syntax.
// At the toplevel the document is split into paragraphs. SDoc-style paragraph classification is used: paragraphs that begin with [A-Z|] are considered comments, while others are interpreted as
// text. Figment also supports a lightweight line comment syntax: /[-\/]\s*[A-Z]/ begins a line comment. That is, a slash / or a hyphen - followed by a capital letter (there can be whitespace).
// For example:

// | some(code),   / This is a comment
//   more(code)    - This is also a comment

// Some people will complain about the fact that comments have to start with a capital letter. (Intentionally left ambiguous.)

// The parser below uses a forward-definition technique I learned from reading Chris Double's JSParse code (very clever). By setting f(x) to f(x) in an eta-expanded context, we then update the
// value of f to have the original definition automatically forward to the new one (which works because of lazy scoping).

  caterwaul.tconfiguration('std seq continuation parser', 'fig.parser', function () {
    this.field('parse', parse).field('lex', lex).field('decompile', parse),
    where*[parse(s)      = expression(lex(s)),

           lex           = l*[literate     = peg[c(/[A-Z\|][^\n]*(?:\n[^\n]+)*/, 1) >> fn_['']],
                              paragraph    = peg[c(/[^\n]*(?:\n[^\n]+)*/, 1) >> fn[xs][xs[0]]],
                              paragraphs   = peg[(([c(/\n\n+/, 2)] >> fn_['']) % (literate / paragraph) >> fn[xs][xs[1]])[0] >> fn[xs][seq[~xs %[_]].join('\n')]],
                              line_comment = peg[c(/[-\/]\s*/, 1) % c(/[A-Z][^\n]*/, 1) % [c('\n')] >> fn_[' ']],
                              code         = peg[(line_comment / c(['-', '/']) / (c(/[^-\/]+/, 1) >> fn[xs][xs[0]]))[1] >> fn[xs][xs.join('')]]] in
                           fn[s][code(paragraphs(s))],

           // Forward definition of expression
           expression(x) = expression(x),
           identifier    = peg[c(/[A-Za-z0-9_]+['?!]*/, 1) >> fn[xs][new caterwaul.syntax(xs[0])]],
           operator      = l*[coerced_identifier = peg[c('=') % identifier                  >> fn[xs][xs[0] + xs[1].data]],
                              regular_operator   = peg[c(/[-+\/*&^%$#@!`~:\\|=?<>\.;]+/, 1) >> fn[xs][xs[0]]]] in peg[coerced_identifier / regular_operator],

           // At the lowest level an expression is optional; this is required to support empty brackets, e.g. []
           group         = l*[grouped_by(open, close) = peg[c(open) % [expression] % c(close) >> fn[xs][xs[1] ? new caterwaul.syntax(open, xs[1]) : new caterwaul.syntax(open)]]] in
                           peg[grouped_by('(', ')') / grouped_by('[', ']') / grouped_by('{', '}')],

           atom          = l*[quoted_operator = peg[c('_') % operator >> fn[xs][new caterwaul.syntax(xs[0] + xs[1])]],
                              number_options  = peg[(c(/\d+/, 1) % c('.') % c(/\d+(?:[eE][-+]?\d*)?/, 1) >> fn[xs][new caterwaul.syntax(xs[0][0] + xs[1] + xs[2][0])]) /
                                                    (c(/\d+/, 1) >> fn[xs][new caterwaul.syntax(xs[0])])],
                              string_options  = peg[(c(/'(?:[^'\\]|\\.?)*/, 1) % c("'")) / (c(/"(?:[^"\\]|\\.?)*/, 1) % c('"')) >> fn[xs][new caterwaul.syntax(xs[0][0] + xs[1])]]] in
                           peg[quoted_operator / number_options / string_options / identifier / group],

           space         = peg[c(/\s+/, 1)],
           spaced(x)     = peg[space % x % space >> fn[xs][xs[1]]],

           // Eta-expansion of binary operators is required to support recursion
           binary(op, l, inductive, base) = l*[p(x) = p(x), p = peg[l % [op % p] >> fn[xs][xs[1] ? inductive(xs[0], xs[1][0], xs[1][1]) : base ? base(xs[0]) : xs[0]]]] in p,
           prefix(op, l, inductive, base) = l*[p(x) = p(x), p = peg[(op % p >> fn[xs][inductive(xs[0], xs[1])]) / (l >> fn[x][base ? base(x) : x])]] in p,

           tight_join    = peg[atom[1] >> fn[xs][seq[~xs /![new caterwaul.syntax('join', _, _0)]]]],
           tight_prefix  = peg[prefix(operator,                      tight_join,   fn[   op, r][new caterwaul.syntax(op, r)])],
           tight_binary  = peg[binary(seq(operator, opt(space)),     tight_prefix, fn[l, op, r][new caterwaul.syntax(op[0], l, r)])],
           loose_join    = peg[binary(space,                         tight_binary, fn[l, op, r][new caterwaul.syntax('join', l, r)])],
           loose_prefix  = peg[prefix(seq(operator, space),          loose_join,   fn[   op, r][new caterwaul.syntax(op[0], r)])],
           loose_binary  = peg[binary(spaced(operator),              loose_prefix, fn[l, op, r][new caterwaul.syntax(op, l, r)])],
           commas        = peg[binary(seq(opt(space), c(/,\s*/, 1)), loose_binary, fn[l, op, r][new caterwaul.syntax(',', l, r)])],
           expression    = commas]});
// Generated by SDoc 

// Unified Figment configuration | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This configuration transforms a regular caterwaul function into a Figment compiler, complete with some default semantics and a require() function for platform-specific inclusion of external
// code. See the dependent files fig.parser.js, fig.semantics.js, and fig.require.js for more details.

  caterwaul.configuration('fig', function () {this.configure('fig.require fig.semantics fig.parser')});
// Generated by SDoc 
