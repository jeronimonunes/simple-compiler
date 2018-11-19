export type identifier = {
    type: "identifier";
    value: string;
};

export type id_return = identifier;

export type compound_stmt = {
    type: "compound_stmt";
    stmts: stmt_list;
};

export type stmt_list = stmt[];

export type ident_list = identifier[];

export type if_stmt = {
    type: "if";
    condition: cond;
    then: stmt;
    else?: stmt;
}

export type cond = expr;

export type repeat_stmt = {
    type: "repeat";
    body: stmt_list;
    condition: expr;
}

export type read_stmt = {
    type: "read";
    params: ident_list;
}

export type write_stmt = {
    type: "write";
    params: expr_list;
}

export type expr_list = expr[];

export type stmt = assign_stmt
    | if_stmt
    | repeat_stmt
    | read_stmt
    | write_stmt
    | compound_stmt
    | function_ref_par;

export type assign_stmt = {
    type: "assign";
    identifier: identifier,
    expression: expr;
}

export type rel_expr = {
    type: "rel";
    head: Simple_expr;
    tail: { op: "!=" | "=" | "<=" | "<" | ">=" | ">", expr: Simple_expr }[];
};

export type expr = rel_expr | Simple_expr;

export type Simple_expr = {
    type: "simple",
    head: term;
    tail: { op: "+" | "-" | "or", expr: term }[];
} | term;

export type term = {
    type: "term",
    head: factor_a;
    tail: { op: "*" | "/" | "div" | "mod" | "and", expr: factor_a }[];
} | factor_a;

export type factor_a = {
    type: "neg",
    expr: factor;
} | factor;

export type block_expr = {
    type: "block",
    expr: expr;
};

export type not_expr = {
    type: "not",
    factor: factor
};

export type factor = constant | block_expr | not_expr | function_ref_par;

export type function_ref_par = {
    type: "call",
    identifier: variable;
    params: expr_list;
} | identifier;

export type variable = Simple_variable_or_proc;

export type Simple_variable_or_proc = identifier;

export type constant = {
    type: "constant";
    value: char_constant | integer_constant | boolean_constant | real_constant;
};

export type real_constant = {
    type: "real";
    value: number
}

export type boolean_constant = {
    type: "boolean";
    value: boolean;
}

export type integer_constant = {
    type: "integer";
    value: number
}

export type char_constant = {
    type: "char"
    value: string
}

export type corpo = {
    declarations?: decl_list;
    stmt: compound_stmt;
    "return"?: id_return;
}

export type parametro = {
    mode: "value" | "reference";
    type: var_type;
    identifier: identifier;
}

export type lista_de_parametros = parametro[];

export type dcl_proc = {
    type: "procedure",
    identifier: identifier;
    returnType: tipo_retornado;
    params: lista_de_parametros
    body: corpo
}

export type tipo_retornado = "integer"
    | "real"
    | "boolean"
    | "char"
    | "";

export type var_type = "integer" | "real" | "boolean" | "char";

export type dcl_var = {
    type: "var";
    value: {
        type: var_type;
        identifier: identifier;
    }
}

export type decl = dcl_var | dcl_proc;

export type decl_list = decl[];

export interface AST {

    identifier: identifier;
    body: compound_stmt;
    declarations?: decl_list;

}