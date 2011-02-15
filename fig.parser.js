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

           lex           = l*[literate     = peg[c(/[A-Z\|](?:\n?[^\n]+)*/, 1) >> fn_['']],
                              paragraph    = peg[c(/(?:\n?[^\n]+)*/, 1) >> fn[xs][xs[0]]],
                              paragraphs   = peg[(([c(/\n\n+/, 2)] >> fn_['']) % (literate / paragraph) >> fn[xs][xs.join('')])[0] >> fn[xs][seq[~xs %[_]].join('\n')]],
                              line_comment = peg[c(/[-\/]\s*/, 1) % c(/[A-Z][^\n]*/, 1) % [c('\n')] >> fn_[' ']],
                              code         = peg[(line_comment / c(['-', '/']) / (c(/[^-\/]+/, 1) >> fn[xs][xs[0]]))[1] >> fn[xs][xs.join('')]]] in
                           fn[s][code(paragraphs(s))],

           // Forward definition of expression
           expression(x) = expression(x),
           identifier    = peg[c(/[A-Za-z0-9_]+['?!]*/, 1) >> fn[xs][new caterwaul.syntax(xs[0])]],
           operator      = l*[coerced_identifier = peg[c('=') % identifier                  >> fn[xs][xs[0] + xs[1].data]],
                              regular_operator   = peg[c(/[-+\/*&^%$#@!`~:\\|=?<>\.;]+/, 1) >> fn[xs][xs[0]]]] in peg[coerced_identifier / regular_operator],

           group         = l*[grouped_by(open, close) = peg[c(open) % [expression] % c(close) >> fn[xs][xs[1] ? new caterwaul.syntax(open, xs[1]) : new caterwaul.syntax(open)]]] in
                           peg[grouped_by('(', ')') / grouped_by('[', ']') / grouped_by('{', '}')],

           atom          = l*[quoted_operator = peg[c('_') % operator >> fn[xs][new caterwaul.syntax(xs[0] + xs[1])]],
                              number_options  = peg[c(/\d+\.\d*([eE][-+]?\d*)?/, 2) / c(/\d+/, 1) >> fn[xs][xs[0]]],
                              string_options  = peg[(c(/'([^'\\]|\\.)*/, 1) % c("'")) / (c(/"([^"\\]|\\.)*/, 1) % c('"')) >> fn[xs][xs[0][0] + xs[1]]]] in
                           peg[quoted_operator / number_options / string_options / identifier / group],

           space         = peg[c(/\s+/, 1)],
           spaced(x)     = peg[space % x % space >> fn[xs][xs[1]]],

           // Eta-expansion of binary operators is required to support recursion
           binary(op, l, inductive, base) = l*[p(x) = p(x), p = peg[l % [op % p] >> fn[xs][xs[1] ? inductive(xs[0], xs[1][0], xs[1][1]) : base ? base(xs[0]) : xs[0]]]] in p,
           prefix(op, l, inductive, base) = l*[p(x) = p(x), p = peg[(op % p >> fn[xs][inductive(xs[0], xs[1])]) / (l >> fn[x][base ? base(x) : x])]] in p,

           // At the lowest level an expression is optional; this is required to support empty brackets, e.g. []
           tight_join    = peg[atom[1] >> fn[xs][seq[~xs /![new caterwaul.syntax('join', _, _0)]]]],
           tight_prefix  = peg[prefix(operator,                  tight_join,   fn[   op, r][new caterwaul.syntax(op, r)])],
           tight_binary  = peg[binary(seq(operator, opt(space)), tight_prefix, fn[l, op, r][new caterwaul.syntax(op[0], l, r)])],
           loose_join    = peg[binary(space,                     tight_binary, fn[l, op, r][new caterwaul.syntax('join', l, r)])],
           loose_prefix  = peg[prefix(seq(operator, space),      loose_join,   fn[   op, r][new caterwaul.syntax(op[0], r)])],
           loose_binary  = peg[binary(spaced(operator),          loose_prefix, fn[l, op, r][new caterwaul.syntax(op, l, r)])],
           commas        = peg[binary(c(/\s*,\s*/, 1),           loose_binary, fn[l, op, r][new caterwaul.syntax(',', l, r)])],
           expression    = commas]});
// Generated by SDoc 
