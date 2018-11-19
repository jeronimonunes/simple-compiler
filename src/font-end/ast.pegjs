program
 = "program" _ identifier:identifier _ ";" _ declarations:decl_list? _ body:compound_stmt _ {
     return {identifier, declarations, body};
 }

decl_list
 = h:decl t:(_ ";" _ decl)* {
     return t.reduce( (acc, cv) => acc.concat(cv[3]), h);
 }

decl
 = dcl_var / dcl_proc

dcl_var
 = list:ident_list _ ":" _ type:type {
     return list.map(identifier => {
         return { type: "var", value: {type, identifier} }
     });
 }

ident_list
 = h:identifier t:(_ "," _ identifier)* {
     return [h,...t.map(v=>v[3])];
 }

type
 = "integer"
 / "real"
 / "boolean"
 / "char"

dcl_proc
 = returnType: tipo_retornado _ "PROCEDURE" _ identifier:identifier _ params:espec_parametros _ body:corpo {
     return [ {
         type: "procedure",
         returnType,
         identifier,
         params,
         body
     }]
 }

tipo_retornado
 = "integer"
 / "real"
 / "boolean"
 / "char"
 / ""

corpo
 = ":" _ declarations:(decl_list _ ";")? _ stmt:compound_stmt _ r:id_return? {
     return { declarations:declarations?declarations[0]:null, stmt, "return": r }
 }

id_return
 = identifier

espec_parametros
 = "(" _ params:lista_de_parametros _ ")" {
     return params;
 }

lista_de_parametros
 = h:parametro t:(_ "," _ parametro)* {
     return [h, ...t.map(v=>v[3])]
 }

parametro
 = mode:modo _ type:type _ ":" _ identifier:identifier {
     return {mode, type, identifier}
 }

modo
 = "value" / "reference"

compound_stmt
 =   "begin" _ stmts: stmt_list _ "end" {
     return {type:"compound_stmt",stmts};
 }

stmt_list
 = h:stmt t:(_ ";" _ stmt)* {
     return [h,...t.map(v=>v[3])];
 }

stmt
 = assign_stmt
 / if_stmt
 / repeat_stmt
 / read_stmt
 / write_stmt
 / compound_stmt
 / function_ref_par

assign_stmt
 = identifier:identifier _ ":=" _ expression:expr {
     return { type:"assign", identifier, expression }
 }

if_stmt
 = "if" _ condition:cond _ "then" _ then:stmt otherwise:(_ "else" _ stmt)? {
     return {type:"if", condition, then, "else": otherwise ? otherwise[3] : null }
 }

cond
 = expr

repeat_stmt
 = "repeat" _ body:stmt_list _ "until" _ condition:expr {
     return { type:"repeat", body, condition }
 }

read_stmt
 = "read" _ "(" _ params:ident_list _ ")" {
     return { type: "read", params }
 }

write_stmt
 = "write" _ "(" _ params: expr_list _ ")" {
     return { type: "write", params }
 }

expr_list
 = h:expr t:(_ "," _ expr)* {
     return [h,...t.map(v=>v[3])];
 }

expr
 = h:Simple_expr t:(_ RELOP _ Simple_expr)* {
     if(t.length) {
         return { type: "rel", head:h, tail: t.map(v=>{return {op: v[1], expr: v[3]}}) }
     } else {
         return h;
     }
 }

Simple_expr
 = h:term t:(_ ADDOP _ term)*{
     if(t.length) {
         return { type: "simple", head:h, tail: t.map(v=>{return {op: v[1], expr: v[3]}}) }
     } else {
         return h;
     }
 }

term
 = h:factor_a t:(_ MULOP _ factor_a)*{
     if(t.length) {
         return { type: "term", head:h, tail: t.map(v=>{return {op: v[1], expr: v[3]}}) }
     } else {
         return h;
     }
 }

factor_a
 = sign:"-"? value:factor {
     if(sign) return { type: "neg", value }
     return value;
 }

factor
 = id:identifier _ !("(") { return id }
 / constant
 / "(" _ expr:expr _ ")" {
     return { type:"block", expr }
 }
 / ("NOT" / "not") factor:factor {
     return { type: "not", factor }
 }
 / function_ref_par

function_ref_par
 = identifier:variable _ "(" _ params:expr_list _ ")" {
     return { type: "call", identifier, params }
 }

variable   
 = Simple_variable_or_proc

Simple_variable_or_proc
 = identifier

constant
 = value:(real_constant
 / integer_constant
 / char_constant
 / boolean_constant) {
     return { type: "constant", value }
 }

integer_constant
 = sign? unsigned_integer {
     return { type: "integer", value:parseInt(text()) }
 }

unsigned_integer
 = digit+

real_constant
 =  sign? unsigned_real {
     return { type: "real", value:parseFloat(text()) }
 }

unsigned_real
 = (digit+ "." / "." digit+) (scale_factor sign? digit+)?
 / digit* "."? digit* scale_factor sign? digit+

scale_factor
 = [eE]

boolean_constant
 = "true" {
     return { type: "boolean", value:true };
 } / "false" {
     return { type: "boolean", value:false };
 }

letter
 = [A-Za-z]

identifier
 =	!(RESERVED_WORDS) h:letter t:(letter / digit)*	{
     return {type:"identifier",value:[h,...t].join('')};
 }

digit
 =	[0-9]

sign
 = [+-]

RESERVED_WORDS
 = "PROCEDURE" / "end" / "begin" / "if" / "write" / "read" / "program" / "true" / "false"

_
 = [\n\t\r ]*

char_constant
 = "'" value:caractereASCII "'" {
     return { type:"char", value }
 }

caractereASCII
 = .

RELOP
 = "!=" / "=" / "<=" / "<" / ">=" / ">"

ADDOP
 = "+" / "-" / "or"

MULOP
 = "*" / "/" / "div" / "mod" / "and"