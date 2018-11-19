import { AST, decl, dcl_var, dcl_proc, identifier, parametro, compound_stmt, stmt, read_stmt, var_type, write_stmt, expr, Simple_expr, term, factor_a, factor, block_expr, function_ref_par, constant, not_expr, assign_stmt, if_stmt, repeat_stmt } from "../ast";

type var_or_parameter = { mode?: "reference" | "value", value: { identifier: identifier, type: var_type } };

class Scope {

    varDeclarations = new Map<string, var_or_parameter>();
    procedureDeclarations = new Map<string, dcl_proc>();

    constructor(private parent: Scope) {

    }

    getProcedure(id: identifier): dcl_proc {
        if (this.procedureDeclarations.has(id.value)) {
            return this.procedureDeclarations.get(id.value);
        } else if (this.parent) {
            return this.parent.getProcedure(id);
        } else {
            return null;
        }
    }

    getVar(id: identifier): var_or_parameter {
        if (this.varDeclarations.has(id.value)) {
            return this.varDeclarations.get(id.value);
        } else if (this.parent) {
            return this.parent.getVar(id);
        } else {
            return null;
        }
    }

    declareVar(dcl_var: dcl_var): void {
        let id = dcl_var.value.identifier.value;
        if (this.varDeclarations.has(id)) {
            throw new Error("Variable " + id + " have been declared before");
        } else {
            this.varDeclarations.set(id, dcl_var);
        }
    }

    declareProcedure(dcl_proc: dcl_proc): void {
        let id = dcl_proc.identifier.value;
        if (this.procedureDeclarations.has(id)) {
            throw new Error("Procedure " + id + " have been declared before");
        } else {
            this.procedureDeclarations.set(id, dcl_proc);
        }
    }

    createChild() {
        return new Scope(this);
    }
}

export function cgenerate(ast: AST): string {
    let scope = new Scope(null);
    let output = `//Program: ${ast.identifier.value} C transpilation
//Jerônimo Nunes Rocha implementation from Simple

#include <stdio.h>
typedef char boolean;
typedef double real;
typedef int integer;

`;
    console.log(ast);
    if (ast.declarations) {
        output = ast.declarations.reduce((a, v) => `${a}\n${decl(v, scope)}`, output);
    }
    output += `\n\n int main()${compound_stmt(ast.body, scope)}`
    return output;
}

function decl(decl: decl, scope: Scope): string {
    switch (decl.type) {
        case "var":
            return dcl_var(decl, scope);
        case "procedure":
            return dcl_proc(decl, scope);
        default:
            return fail(decl);
    }
}

function parametro(p: parametro) {
    return `${p.type} ${p.mode == "reference" ? '*' : ''}${p.identifier.value}`;
}

function dcl_proc(dcl_proc: dcl_proc, scope: Scope) {
    scope.declareProcedure(dcl_proc);
    let fnScope = new Scope(scope);
    return `${(dcl_proc.returnType || "void")} fn_${dcl_proc.identifier.value}(${dcl_proc.params.map(p => { fnScope.declareVar({ type: "var", value: p }); return parametro(p) }).join(', ')}){
        ${dcl_proc.body.declarations ? dcl_proc.body.declarations.map(d => decl(d, fnScope)).join("\n") : ''}
        ${compound_stmt(dcl_proc.body.stmt, fnScope)}
        return ${dcl_proc.body.return ? dcl_proc.body.return.value : ''};
    }`;
}

function compound_stmt(compound_stmt: compound_stmt, scope: Scope): string {
    return `{
        ${compound_stmt.stmts.map(s => stmt(s, scope)).join("\n")}
    }`;
}

function stmt(stmt: stmt, scope: Scope): string {
    switch (stmt.type) {
        case "compound_stmt":
            return compound_stmt(stmt, scope);
        case "read":
            return read_stmt(stmt, scope);
        case "write":
            return write_stmt(stmt, scope);
        case "assign":
            return assign_stmt(stmt, scope);
        case "call":
            return call(stmt, scope);
        case "if":
            return if_stmt(stmt, scope);
        case "repeat":
            return repeat_stmt(stmt, scope);
        case "identifier":
            return identifier(stmt, scope);
        default:
            return fail(stmt);
    }
}

function repeat_stmt(repeat_stmt: repeat_stmt, scope: Scope): string {
    return  `while(${expr(repeat_stmt.condition, scope)}) {
        ${repeat_stmt.body.map(s=>stmt(s,scope)).join('\n')};
    }`;
}

function if_stmt(if_stmt: if_stmt, scope: Scope): string {
    let v = `if(${expr(if_stmt.condition, scope)})${stmt(if_stmt.then, scope)}`;
    if(if_stmt.else) {
        v += ` else ${stmt(if_stmt.else, scope)}`;
    }
    return v;
}

function assign_stmt(assign_stmt: assign_stmt, scope: Scope): string {
    return `${assign_stmt.identifier.value} = ${expr(assign_stmt.expression, scope)};`
}

function write_stmt(write_stmt: write_stmt, scope: Scope): string {
    return write_stmt.params.map(p => {
        if (p.type == "constant") {
            switch (p.value.type) {
                case "boolean":
                    return `printf(${p.value.value ? "true" : "false"});`;
                case "char":
                case "integer":
                case "real":
                    return `printf("${p.value.value}");`
            }
        } else if (p.type == "identifier") {
            let v = scope.getVar(p);
            if (v.mode == "reference") {
                switch (v.value.type) {
                    case "boolean":
                        return `printf((*${v.value.identifier.value}) ? "true" : "false");`;
                    case "char":
                        return `printf("%c",(*${v.value.identifier.value}));`
                    case "integer":
                        return `printf("%d",(*${v.value.identifier.value}));`
                    case "real":
                        return `printf("%lf",(*${v.value.identifier.value}));`
                }
            } else {
                switch (v.value.type) {
                    case "boolean":
                        return `printf(${v.value.identifier.value} ? "true" : "false");`;
                    case "char":
                        return `printf("%c",${v.value.identifier.value});`
                    case "integer":
                        return `printf("%d",${v.value.identifier.value});`
                    case "real":
                        return `printf("%lf",${v.value.identifier.value});`
                }
            }
        } else {//TODO print other types in special way too
            return `printf("%d", (${expr(p, scope)}));`;
        }
    }).join("\n") + `\nprintf("\\n");`;
}

function expr(v: expr, scope: Scope) {
    if (v.type == "rel") {
        let r = Simple_expr(v.head, scope);
        for (let p of v.tail) {
            let op: string = p.op;
            if (op == "=") {
                op = "==";
            };
            r += ` ${op} ${Simple_expr(p.expr, scope)}`;
        }
        return r;
    } else {
        return Simple_expr(v, scope);
    }
}

function Simple_expr(Simple_expr: Simple_expr, scope: Scope): string {
    if (Simple_expr.type == "simple") {
        let r = term(Simple_expr.head, scope);
        for (let p of Simple_expr.tail) {
            let op: string = p.op;
            if (op == "or") {
                op = "|";
            };
            r += ` ${op} ${term(p.expr, scope)}`;
        }
        return r;
    } else {
        return term(Simple_expr, scope);
    }
}

function term(term: term, scope: Scope): string {
    if (term.type == "term") {
        let r = factor_a(term.head, scope);
        for (let p of term.tail) {
            let op: string = p.op;
            if (op == "div") {
                op = "/";
            } else if (op == "mod") {
                op = "%";
            } else if (op == "and") {
                op = "&";
            }
            r += ` ${op} ${factor_a(p.expr, scope)}`;
        }
        return r;
    } else {
        return factor_a(term, scope);
    }
}

function factor_a(factor_a: factor_a, scope: Scope): string {
    if (factor_a.type == "neg") {
        return `-${factor(factor_a.expr, scope)}`
    } else {

    }
    return factor(factor_a, scope);
}

function factor(expr: factor, scope: Scope): string {
    switch (expr.type) {
        case "identifier":
            return identifier(expr, scope);
        case "block":
            return block(expr, scope);
        case "call":
            return call(expr, scope);
        case "constant":
            return constant(expr, scope);
        case "not":
            return not(expr, scope);
        default:
            return fail(expr);
    }
}

function not(expr: not_expr, scope: Scope) {
    return "!" + factor(expr.factor, scope);
}

function constant(expr: constant, scope: Scope) {
    return expr.value.value.toString();
}

function call(call: function_ref_par, scope: Scope): string {
    if (call.type == "call") {
        let fn = scope.getProcedure(call.identifier);
        //TODO throw error;
        return "fn_" + call.identifier.value + "(" + call.params.map(e => expr(e, scope)).join(",") + ")"
    }
}

function block(block: block_expr, scope: Scope) {
    return `{
        ${expr(block.expr, scope)}
    }`
}

function identifier(id: identifier, scope: Scope) {
    let v = scope.getVar(id);
    if (!v) {
        throw new Error("Tried to access undeclared variable");
    }
    if (v.mode == "reference") {
        return `(*${id.value})`
    } else {
        return id.value;
    }
}

function read_stmt(read_stmt: read_stmt, scope: Scope): string {
    return read_stmt.params.map(p => {
        let v = scope.getVar(p);
        if (v === null) {
            throw new Error("Tried to read to undeclared variable");
        } else if (v.mode == "reference") {
            switch (v.value.type) {
                case "boolean":
                    return `*${v.value.identifier.value} = scanf("true");`
                case "char":
                    return `scanf("%c",${v.value.identifier.value});`
                case "integer":
                    return `scanf("%d",${v.value.identifier.value});`
                case "real":
                    return `scanf("%lf",${v.value.identifier.value});`
            }
        } else {
            switch (v.value.type) {
                case "boolean":
                    return `${v.value.identifier.value} = scanf("true");`
                case "char":
                    return `scanf("%c",&${v.value.identifier.value});`
                case "integer":
                    return `scanf("%d",&${v.value.identifier.value});`
                case "real":
                    return `scanf("%lf",&${v.value.identifier.value});`
            }
        }
    }).join("\n")
}

function dcl_var(dcl_var: dcl_var, scope: Scope) {
    scope.declareVar(dcl_var);
    return `${dcl_var.value.type} ${dcl_var.value.identifier.value};`;
}

function fail(param: never): never {
    throw new Error("Function did not treat exaustivelly all cases.");
}