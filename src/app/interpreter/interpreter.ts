import { AST, decl_list, decl, dcl_var, dcl_proc, lista_de_parametros, parametro, corpo, stmt, compound_stmt, read_stmt, write_stmt, expr, rel_expr, Simple_expr, term, factor_a, factor, identifier, block_expr, function_ref_par, constant, not_expr, assign_stmt, if_stmt, repeat_stmt, var_type } from "../ast";

class Writer {
    private buffer = "";

    write(v: any) {
        this.buffer += v;
    }

    toString() {
        return this.buffer;
    }
}

class Reader {

    private input: string;

    constructor(input: string) {
        this.input = input.trim();
    }

    read(v: var_type) {
        switch (v) {
            case "boolean":
                if (this.input.startsWith("true")) {
                    this.input = this.input.substring("true".length).trim();
                    return true;
                }
                if (this.input.startsWith("false")) {
                    this.input = this.input.substring("false".length).trim();
                    return false;
                }
                return null;
            case "char": {
                if (this.input.length) {
                    let v = this.input[0];
                    this.input = this.input.substring(1).trim();
                    return v;
                } else {
                    return null;
                }
            }
            case "integer": {
                let match = /^[+-]?\d+/.exec(this.input);
                if (match) {
                    let v = match[0];
                    this.input = this.input.substring(v.length).trim();
                    return parseInt(v);
                } else {
                    return null;
                }
            }
            case "real": {
                let match = /^[+-]?((\d+\.\d*)|(\.\d+)|(\d+))([eE][+-]?\d+)?/.exec(this.input);
                if (match) {
                    let v = match[0];
                    this.input = this.input.substring(v.length).trim();
                    return parseFloat(v);
                } else {
                    return null;
                }
            }
            default:
                return fail(v);
        }
    }

}

class Scope {

    varDeclarations = new Map<string, dcl_var>();
    procedureDeclarations = new Map<string, dcl_proc>();
    values = new Map<string, number | string | boolean>();

    constructor(private parent: Scope, private reader: Reader, private writer: Writer) {

    }

    setValue(id: identifier, value: number | string | boolean) {
        if (this.varDeclarations.has(id.value)) {
            this.values.set(id.value, value);
        } else if (this.parent) {
            this.parent.setValue(id, value);
        } else {
            throw new Error("tried to assign to an undeclared var");
        }
    }

    getValue(id: identifier): number | string | boolean {
        if (this.varDeclarations.has(id.value)) {
            return this.values.get(id.value);
        } else if (this.parent) {
            return this.parent.getValue(id);
        } else {
            throw new Error("Tried to get the value of " + id.value + " that does not exists");
        }
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

    getVar(id: identifier): dcl_var {
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

    read(identifier: identifier): void {
        let v = this.getVar(identifier);
        if (v) {
            let r = this.reader.read(v.value.type);
            if (r === null) {
                throw new Error("It was not possible to read the input as " + v.value.type)
            }
            this.setValue(identifier, r);
        } else {
            throw new Error(`Variable ${identifier.value} not declared`)
        }
    }

    write(v: any) {
        this.writer.write(v);
    }

    createChild() {
        return new Scope(this, this.reader, this.writer);
    }
}

function fail(param: never): never {
    throw new Error("Function did not treat exaustivelly all cases.");
}

export function run(ast: AST, input: string): string {
    let output = new Writer();
    let global = new Scope(null, new Reader(input), output);
    if (ast.declarations) {
        ast.declarations.forEach(d => decl(d, global));
    }
    compound_stmt(ast.body, global);
    return output.toString();
}

function compound_stmt(compound_stmt: compound_stmt, scope: Scope) {
    compound_stmt.stmts.forEach(s => stmt(s, scope));
}

function decl_var(decl: dcl_var, scope: Scope) {
    scope.declareVar(decl);
}

function stmt(stmt: stmt, scope: Scope) {
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

function repeat_stmt(repeat_stmt: repeat_stmt, scope: Scope) {
    let r = expr(repeat_stmt.condition, scope);
    while (r === true) {
        repeat_stmt.body.forEach(v => stmt(v, scope));
        r = expr(repeat_stmt.condition, scope);
    }
    if (r !== false) {
        throw new Error("The repeat condition didn't evaluated to a boolean");
    }
}

function if_stmt(if_stmt: if_stmt, scope: Scope) {
    let r = expr(if_stmt.condition, scope);
    if (r === true) {
        stmt(if_stmt.then, scope);
    } else if (r === false && if_stmt.otherwise) {
        stmt(if_stmt.otherwise, scope);
    } else {
        throw new Error("If condition didn't returned a boolean");
    }
}

function assign_stmt(assign_stmt: assign_stmt, scope: Scope) {
    let result = expr(assign_stmt.expression, scope);
    scope.setValue(assign_stmt.identifier, result);
}

function read_stmt(stmt: read_stmt, scope: Scope) {
    stmt.params.forEach(i => {
        scope.read(i);
    });
}

function call(call: function_ref_par, scope: Scope) {
    if (call.type == "call") {
        let proc = scope.getProcedure(call.identifier);

        let fscope = scope.createChild();

        for (let i = 0; i < proc.params.length; i++) {
            let param = proc.params[i];
            if (param.mode == "value") {
                fscope.declareVar({ type: "var", value: param });
                fscope.setValue(param.identifier, expr(call.params[i], scope));
            }
        }

        if (proc.body.declarations) {
            proc.body.declarations.forEach(d => decl(d, fscope));
        }

        compound_stmt(proc.body.stmt, fscope);
        return fscope.getValue(proc.body.return);
    } else {
        return identifier(call, scope);
    }
}

function identifier(id: identifier, scope: Scope) {
    return scope.getValue(id);
}

function factor(expr: factor, scope: Scope) {
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

function not(not: not_expr, scope: Scope) {
    return !factor(not.factor, scope);
}

function constant(constant: constant, scope: Scope) {
    return constant.value.value;
}

function factor_a(factor_a: factor_a, scope: Scope) {
    if (factor_a.type == "neg") {
        let v = -factor(factor_a.expr, scope);
    } else {
        return factor(factor_a, scope);
    }
}

function term(expr: term, scope: Scope) {
    if (expr.type == "term") {
        let v = factor_a(expr.head, scope);
        expr.tail.forEach(t => {
            switch (t.op) {
                case "*":
                    v *= factor_a(t.expr, scope);
                    break;
                case "/":
                case "div":
                    v /= factor_a(t.expr, scope);
                    break;
                case "and":
                    v &= factor_a(t.expr, scope);
                    break;
                case "mod":
                    v %= factor_a(t.expr, scope);
                    break;
            }
        });
        return v;
    } else {
        return factor_a(expr, scope);
    }
}

function Simple_expr(expr: Simple_expr, scope: Scope) {
    if (expr.type == "simple") {
        let v = term(expr.head, scope);
        expr.tail.forEach(t => {
            switch (t.op) {
                case "+":
                    v += term(t.expr, scope);
                    break;
                case "-":
                    v -= term(t.expr, scope);
                    break;
                case "or":
                    v |= term(t.expr, scope);
                    break;
            }
        });
        return v;
    } else {
        return term(expr, scope);
    }
}

function rel_expr(expr: rel_expr, scope: Scope): boolean | number | string {
    let v = Simple_expr(expr.head, scope);
    for (let t of expr.tail) {
        switch (t.op) {
            case "!=":
                v = v != Simple_expr(t.expr, scope);
                break;
            case "<":
                v = v < Simple_expr(t.expr, scope);
                break;
            case "<=":
                v = v <= Simple_expr(t.expr, scope);
                break;
            case "=":
                v = v == Simple_expr(t.expr, scope);
                break;
            case ">":
                v = v > Simple_expr(t.expr, scope);
                break;
            case ">=":
                v = v >= Simple_expr(t.expr, scope);
                break;
        }
    }
    return v;
}

function block(block_expr: block_expr, scope: Scope) {
    return expr(block_expr.expr, scope);
}

function expr(expr: expr, scope: Scope) {
    switch (expr.type) {
        case "rel":
            return rel_expr(expr, scope);
        case "block":
            return block(expr, scope);
        case "call":
            return call(expr, scope);
        case "constant":
            return constant(expr, scope);
        case "identifier":
            return identifier(expr, scope);
        case "neg":
            return factor_a(expr, scope);
        case "not":
            return not(expr, scope);
        case "rel":
            return rel_expr(expr, scope);
        case "simple":
            return Simple_expr(expr, scope);
        case "term":
            return term(expr, scope);
        default:
            return fail(expr);
    }
}

function write_stmt(stmt: write_stmt, scope: Scope) {
    stmt.params.forEach(p => {
        let result = expr(p, scope);
        scope.write(result);
    })
}

function decl_proc(decl: dcl_proc, scope: Scope) {
    scope.declareProcedure(decl);
}

function decl(decl: decl, scope: Scope) {
    if (decl.type == "var") {
        return decl_var(decl, scope);
    } else if (decl.type == "procedure") {
        return decl_proc(decl, scope);
    } else {
        return fail(decl);
    }
}