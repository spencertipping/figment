" Vim syntax file
" Language:   Figment
" Maintainer: Spencer Tipping <spencer@spencertipping.com>
" URL:        http://spencertipping.com/figment/figment.vim

" Normally this isn't the file you end up using. Rather, you source it from
" inside another syntax file that provides further definitions.

if !exists("main_syntax")
  if exists("b:current_syntax")
    finish
  endif
  let main_syntax = "figment"
endif

syn case match
syn sync fromstart
setlocal iskeyword=39,45,47,48-57,a-z,95       " Digits, single quote, _, -, /, and lowercase letters

" Operators.
syn match figOperator /[-A-Z~`!@#$%^&*+=|\\:;,.\/?<>]\{1,\}'*/

  hi link figOperator Operator

" High-level comment syntax (re-embedding relevant parts of SDoc)
syn region figBlockComment      start=/\(^$\n^\|\%^\)\s*[A-Z\|]/ end=/^$\|\%$/ contains=figSDocHeader,figSDocNumberedList keepend
syn match  figSDocHeader        /\(^$\n^\|\%^\)\s*[A-Z].\{,60\}\.$/ contained
syn region figSDocNumberedList  start=/^\s*|\s*\d\{1,2\}\.\s\{1,2\}[A-Za-z]/me=e-1 end=/^$\|\%$/ contains=sdNumberedItem transparent
syn match  figSDocNumberedItem  /^\s*|\?\s*\d\{1,2\}\.\s\{1,2\}/ contained

syn match  figLineComment       /[-\/]\s*[A-Z].*$/

  hi link figBlockComment       Comment
  hi link figLineComment        Comment
  hi link figSDocHeader         Special
  hi link figSDocNumberedItem   Special

" Brackets of various sorts.
syn match figStrayBracket /[)\]}]/

syn region figRoundBrackets  matchgroup=figRoundBracket  start=/(/  end=/)/ transparent
syn region figSquareBrackets matchgroup=figSquareBracket start=/\[/ end=/]/ transparent
syn region figCurlyBrackets  matchgroup=figCurlyBracket  start=/{/  end=/}/ transparent

syn cluster figBrackets add=figRoundBrackets,figSquareBrackets,figCurlyBrackets

syn match figRoundError  /[\]}]/ contained containedin=figRoundBrackets
syn match figSquareError /[)}]/  contained containedin=figSquareBrackets
syn match figCurlyError  /[)\]]/ contained containedin=figCurlyBrackets

  hi link figStrayBracket       Error
  hi link figRoundError         Error
  hi link figSquareError        Error
  hi link figCurlyError         Error

  hi link figRoundBracket       Special
  hi link figSquareBracket      Special
  hi link figCurlyBracket       Special

" Quotation and unquotation.
syn region figQuoted matchgroup=figQuotation start=/\<q[a-z]\+(/            end=/)/      contains=figUnquote,figEscape,@figBrackets
syn region figQuoted matchgroup=figQuotation start=/\<q[a-z]\+\[/           end=/]/      contains=figUnquote,figEscape,@figBrackets
syn region figQuoted matchgroup=figQuotation start=/\<q[a-z]\+{/            end=/}/      contains=figUnquote,figEscape,@figBrackets
syn region figQuoted matchgroup=figQuotation start=/\<q[a-z]\+\z([+/"'|]\)/ end=/\z1\|$/ contains=figUnquote,figEscape

syn region figSingleString matchgroup=figStringDelimiter start=/\<'/ end=/'/ contains=figUnquote,figEscape
syn region figDoubleString matchgroup=figStringDelimiter start=/"/   end=/"/ contains=figUnquote,figEscape

syn match  figEscape /\\./ contained
syn region figUnquote matchgroup=figUnquotation start=/Q(/            end=/)/      contained contains=TOP
syn region figUnquote matchgroup=figUnquotation start=/Q\[/           end=/]/      contained contains=TOP
syn region figUnquote matchgroup=figUnquotation start=/Q{/            end=/}/      contained contains=TOP
syn region figUnquote matchgroup=figUnquotation start=/Q\z(["'+/|]\)/ end=/\z1\|$/ contained contains=TOP

syn region figLiteralQuoted matchgroup=figLiteralQuotation start=/\<q[A-Z][a-z]*(/            end=/)/ contains=@figBrackets
syn region figLiteralQuoted matchgroup=figLiteralQuotation start=/\<q[A-Z][a-z]*\[/           end=/]/ contains=@figBrackets
syn region figLiteralQuoted matchgroup=figLiteralQuotation start=/\<q[A-Z][a-z]*{/            end=/}/ contains=@figBrackets
syn region figLiteralQuoted matchgroup=figLiteralQuotation start=/\<q[A-Z][a-z]*\z([+/"'|]\)/ end=/\z1/

  hi link figQuoted           String
  hi link figStringDelimiter  Special
  hi link figSingleString     String
  hi link figDoubleString     String
  hi link figEscape           Special
  hi link figQuotation        Special
  hi link figUnquotation      Special
  hi link figLiteralQuoted    String
  hi link figLiteralQuotation String

" Numbers.
syn match figInteger /\<\d\+/
syn match figFloat   /\<\d\+\(\.\d*\)\?\([eE][-+]\?\d\+\)\?/
syn match figFloat   /\<\d*\.\d\+\([eE][-+]\?\d\+\)\?/

  hi link figInteger Number
  hi link figFloat   Number
  hi link figFloat   Number

let b:current_syntax = "figment"
