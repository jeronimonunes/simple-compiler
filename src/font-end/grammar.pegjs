program
    = "program" _ identifier _ ";" _ decl_list _ compound_stmt _

decl_list
    = decl (_ ";" decl)*

decl
	= dcl_var
    / dcl_proc

dcl_var
	= ident_list _ ":" _ type

ident_list
	= identifier (_ "," _ identifier)*

type
	= "integer"
    / "real"
    / "boolean"
    / "char"

dcl_proc
	= tipo_retornado _ "PROCEDURE" _ identifier _ espec_parametros _ corpo

tipo_retornado
	= "integer"
    / "real"
    / "boolean"
    / "char"
    / ""

corpo
	= ":" _ decl_list ";" _ compound_stmt _ id_return

id_return
    = identifier / ""

espec_parametros
	= "(" _ lista_de_parametros _ ")"

lista_de_parametros
	= parametro (_ "," _ parametro)*

parametro
	= modo _ type _ ":" _ identifier

modo
	= "value" / "reference"

compound_stmt
    =   "begin" _ stmt_list _ "end"

stmt_list
    = stmt (_ ";" _ stmt)*

stmt
    = assign_stmt
    / if_stmt
    / repeat_stmt
    / read_stmt
    / write_stmt
    / compound_stmt
    / function_ref_par

assign_stmt
    = identifier _ ":=" _ expr

if_stmt
    = "if" _ cond _ "then" _ stmt (_ "else" _ stmt)*

cond
    = expr

repeat_stmt
    = "repeat" _ stmt_list _ "until" _ expr

read_stmt
    = "read" _ "(" _ ident_list _ ")"

write_stmt
    = "write" _ "(" _ expr_list _ ")"

expr_list
    = expr (_ "," _ expr)*

expr
    = Simple_expr (_ RELOP _ Simple_expr)*

Simple_expr
    = term (_ ADDOP _ term)*

term
    = factor_a (_ MULOP _ factor_a)*

factor_a
    = "-"? factor

factor
    = identifier
    / constant
    / "(" _ expr _ ")"
    / "NOT" factor
    / function_ref_par

function_ref_par
    = variable _ "(" _ expr_list _ ")"

variable   
    = Simple_variable_or_proc

Simple_variable_or_proc
    = identifier

constant
    = integer_constant
    / real_constant
    / char_constant
    / boolean_constant

boolean_constant
    = "true" / "false"

letter
	= [A-Za-z]

digit
	= [0-9]

identifier
	=	letter (letter / digit)*

_
	= [\n\t\r ]*

unsigned_integer
    = digit digit*

sign
    = "+" / "-" / ""

scale_factor
    = "E" sign unsigned_integer

unsigned_real
    = unsigned_integer ("" / "." digit*)("" / scale_factor)

integer_constant
    = unsigned_integer

real_constant
    = unsigned_real

char_constant
    = "'" caractereASCII "'"

caractereASCII
    = .

RELOP
    = "!=" / "=" / "<=" / "<" / ">=" / ">"

ADDOP
    = "+" / "-" / "or"

MULOP
    = "*" / "/" / "div" / "mod" / "and"