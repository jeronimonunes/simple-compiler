import { AST, decl_list, decl, dcl_var, dcl_proc, lista_de_parametros, parametro, corpo, stmt, compound_stmt, read_stmt, write_stmt, expr, rel_expr, Simple_expr, term, factor_a, factor, identifier, block_expr, function_ref_par, constant, not_expr, assign_stmt, if_stmt, repeat_stmt } from "../ast";
import { Network, Options, Data, DataSet, Node, Edge } from 'vis';

/**
 * Ids for the nodes on the graph
 */
let ID = 0;

/**
 * All functions return one of these, so it can be easylly placed on the graph
 */
interface Three {
  root: Node;
  nodes: Node[];
  edges: Edge[];
}

/**
 * Function that should be placed at the end of a switch case
 * So the compiler throw an error if not all cases have been treated
 */
function fail(param: never): never {
  throw new Error("Function did not treat exaustivelly all cases.");
}

/**
 * Main method, receives an AST and plots a graph into a given HtmlDiv
 */
export function generateAST(ast: AST, div: HTMLDivElement) {

  let options: Options = {
    layout: {
      randomSeed: undefined,
      improvedLayout: true,
      hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'LR',
        sortMethod: 'directed' // hubsize, directed
      }
    }
  };

  let declarations = decl_list(ast.declarations);

  let body = compound_stmt(ast.body);

  let nodes = new DataSet<Node>([
    { id: "program", label: "PROGRAM" },
    { id: "p-identifier", label: ast.identifier.value },
    { id: "body", label: "BODY" },
    ...declarations.nodes,
    ...body.nodes
  ])

  let edges = new DataSet<Edge>([
    { from: "program", to: "p-identifier" },
    { from: 'p-identifier', to: declarations.root.id },
    { from: "p-identifier", to: "body" },
    { from: "body", to: body.root.id },
    ...declarations.edges,
    ...body.edges
  ])

  let data: Data = {
    nodes,
    edges
  };

  return new Network(div, data, options);
}

function decl_var(decl: dcl_var): Three {
  let root: Node = {
    id: ID++,
    label: decl.value.identifier.value + ": " + decl.value.type
  };
  return { root, nodes: [root], edges: [] }
}

function parametro(p: parametro): Three {
  let root: Node = {
    id: ID++,
    label: p.mode + " " + p.identifier.value + ": " + p.type
  }
  return { root, nodes: [root], edges: [] }
}

function espec_parametros(params: lista_de_parametros): Three {
  let root: Node = {
    id: ID++,
    label: "Parameters"
  }
  let nodes: Node[] = [root];
  let edges: Edge[] = [];
  for (let p of params) {
    let r = parametro(p);
    edges.push({ from: root.id, to: r.root.id });
    edges.push(...r.edges);
    nodes.push(...r.nodes);
  }
  return { root, nodes, edges };
}

function stmt(stmt: stmt): Three {
  switch (stmt.type) {
    case "compound_stmt":
      return compound_stmt(stmt);
    case "read":
      return read_stmt(stmt);
    case "write":
      return write_stmt(stmt);
    case "assign":
      return assign_stmt(stmt);
    case "call":
      return call(stmt);
    case "if":
      return if_stmt(stmt);
    case "repeat":
      return repeat_stmt(stmt);
    case "identifier":
      return identifier(stmt);
    default:
      return fail(stmt);
  }
}

function repeat_stmt(repeat_stmt: repeat_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "REPEAT"
  };
  let condition: Node = {
    id: ID++,
    label: "CONDITION"
  }
  let body: Node = {
    id: ID++,
    label: "BODY"
  };
  let nodes: Node[] = [root, condition, body];
  let edges: Edge[] = [{ from: root.id, to: condition.id }, { from: root.id, to: body.id }];
  for (let v of repeat_stmt.body) {
    let s = stmt(v);
    edges.push({ from: body.id, to: s.root.id });
    nodes.push(...s.nodes);
    edges.push(...s.edges);
  }
  return { root, nodes, edges };
}

function if_stmt(if_stmt: if_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "IF"
  }
  let condition: Node = {
    id: ID++,
    label: "CONDITION"
  }
  let then: Node = {
    id: ID++,
    label: "THEN"
  };
  let nodes: Node[] = [root, condition, then];
  let edges: Edge[] = [{ from: root.id, to: condition.id }, { from: root.id, to: then.id }];
  let condition_expr = expr(if_stmt.condition);
  edges.push({ from: condition.id, to: condition_expr.root.id });
  nodes.push(...condition_expr.nodes);
  edges.push(...condition_expr.edges);
  let then_expr = stmt(if_stmt.then);
  edges.push({ from: then.id, to: then_expr.root.id });
  nodes.push(...then_expr.nodes);
  edges.push(...then_expr.edges);
  if (if_stmt.otherwise) {
    let otherwise: Node = {
      id: ID++,
      label: "OTHERWISE"
    };
    nodes.push(otherwise);
    edges.push({ from: root.id, to: otherwise.id });
    let otherwise_expr = stmt(if_stmt.otherwise);
    edges.push({ from: otherwise.id, to: otherwise_expr.root.id });
    edges.push(...otherwise_expr.edges);
    nodes.push(...otherwise_expr.nodes);
  }
  return { root, nodes, edges };
}

function assign_stmt(assign_stmt: assign_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "Assign to: " + assign_stmt.identifier.value
  }
  let inner = expr(assign_stmt.expression);
  let nodes: Node[] = [root, ...inner.nodes];
  let edges: Edge[] = [{ from: root.id, to: inner.root.id }, ...inner.edges];
  return { root, nodes, edges };
}

function compound_stmt(compound_stmt: compound_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "Compound Stmt"
  };
  let nodes: Node[] = [root];
  let edges: Edge[] = [];
  for (let st of compound_stmt.stmts) {
    let s = stmt(st);
    edges.push({ from: root.id, to: s.root.id });
    edges.push(...s.edges);
    nodes.push(...s.nodes);
  }
  return { root, edges, nodes };
}

function read_stmt(stmt: read_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "READ Stmt"
  };
  let nodes: Node[] = [root];
  let edges: Edge[] = [];
  for (let st of stmt.params) {
    let node: Node = {
      id: ID++,
      label: st.value
    };
    edges.push({ from: root.id, to: node.id });
    nodes.push(node);
  }
  return { root, edges, nodes };
}

function identifier(identifier: identifier) {
  let root: Node = {
    id: ID++,
    label: "identifier: " + identifier.value
  };
  return { root, nodes: [root], edges: [] };
}

function block(block: block_expr) {
  let root: Node = {
    id: ID++,
    label: "BLOCK"
  };
  let inner = expr(block);
  return { root, nodes: [root, ...inner.nodes], edges: [{ from: root.id, to: inner.root.id }, ...inner.edges] };
}

function call(call: function_ref_par) {
  if (call.type == "call") {
    let root: Node = {
      id: ID++,
      label: "Call (" + call.identifier.value + ")"
    };
    let params: Node = {
      id: ID++,
      label: "PARAMS"
    }
    let nodes: Node[] = [root, params];
    let edges: Edge[] = [{ from: root.id, to: params.id }];
    for (let p of call.params) {
      let v = expr(p);
      edges.push({ from: params.id, to: v.root.id });
      edges.push(...v.edges);
      nodes.push(...v.nodes);
    }
    return { root, nodes, edges };
  } else {
    return identifier(call);
  }
}

function factor(expr: factor) {
  switch (expr.type) {
    case "identifier":
      return identifier(expr);
    case "block":
      return block(expr);
    case "call":
      return call(expr);
    case "constant":
      return constant(expr);
    case "not":
      return not(expr);
    default:
      return fail(expr);
  }
}

function not(not: not_expr) {
  let root: Node = {
    id: ID++,
    label: "not"
  };
  let inner = factor(not.factor);
  let nodes: Node[] = [root];
  let edges: Edge[] = [{ from: root.id, to: inner.root.id }];
  nodes.push(...inner.nodes);
  edges.push(...inner.edges);
  return { root, nodes, edges };
}

function constant(constant: constant) {
  let root: Node = {
    id: ID++,
    label: constant.value.type + ": " + constant.value.value
  };
  return { root, nodes: [root], edges: [] };
}

function factor_a(factor_a: factor_a) {
  if (factor_a.type == "neg") {
    let root: Node = {
      id: ID++,
      label: "NEG_EXPR"
    };
    let sub = expr(factor_a.expr);
    let nodes: Node[] = [root];
    let edges: Edge[] = [{ from: root.id, to: sub.root.id }];
    nodes.push(...sub.nodes);
    edges.push(...sub.edges);
    return { root, nodes, edges };
  } else {
    return factor(factor_a);
  }
}

function term(expr: term): Three {
  switch (expr.type) {
    case "term":
      let root: Node = {
        id: ID++,
        label: "TERM_EXPR"
      };
      let head: Node = {
        id: ID++,
        label: "HEAD"
      };
      let tail: Node = {
        id: ID++,
        label: "TAIL"
      }
      let head_expr = factor_a(expr.head);
      let nodes: Node[] = [root];
      let edges: Edge[] = [
        { from: root.id, to: head.id },
        { from: head.id, to: head_expr.root.id },
        { from: root.id, to: tail.id }
      ];
      edges.push(...head_expr.edges);
      nodes.push(...head_expr.nodes);
      for (let v of expr.tail) {
        let op: Node = {
          id: ID++,
          label: v.op
        };
        let tail_expr = factor_a(v.expr);
        edges.push({ from: tail.id, to: op.id });
        edges.push({ from: op.id, to: tail_expr.root.id });
        edges.push(tail_expr.edges);
        nodes.push(op);
        nodes.push(...tail_expr.nodes);
      }
      return { root, edges, nodes };
    default:
      return factor_a(expr);
  }
}

function Simple_expr(expr: Simple_expr): Three {
  switch (expr.type) {
    case "simple":
      let root: Node = {
        id: ID++,
        label: "SIMPLE_EXPR"
      };
      let head: Node = {
        id: ID++,
        label: "HEAD"
      };
      let tail: Node = {
        id: ID++,
        label: "TAIL"
      }
      let head_expr = term(expr.head);
      let nodes: Node[] = [root];
      let edges: Edge[] = [
        { from: root.id, to: head.id },
        { from: head.id, to: head_expr.root.id },
        { from: root.id, to: tail.id }
      ];
      edges.push(...head_expr.edges);
      nodes.push(...head_expr.nodes);
      for (let v of expr.tail) {
        let op: Node = {
          id: ID++,
          label: v.op
        };
        let tail_expr = term(v.expr);
        edges.push({ from: tail.id, to: op.id });
        edges.push({ from: op.id, to: tail_expr.root.id });
        edges.push(tail_expr.edges);
        nodes.push(op);
        nodes.push(...tail_expr.nodes);
      }
      return { root, edges, nodes };
    default:
      return term(expr);
  }
}

function rel_expr(expr: rel_expr): Three {
  let root: Node = {
    id: ID++,
    label: "REL_EXPR"
  };
  let head: Node = {
    id: ID++,
    label: "HEAD"
  };
  let tail: Node = {
    id: ID++,
    label: "TAIL"
  }
  let head_expr = Simple_expr(expr.head);
  let nodes: Node[] = [root, head, tail];
  let edges: Edge[] = [
    { from: root.id, to: head.id },
    { from: head.id, to: head_expr.root.id },
    { from: root.id, to: tail.id }
  ];
  edges.push(...head_expr.edges);
  nodes.push(...head_expr.nodes);
  for (let v of expr.tail) {
    let op: Node = {
      id: ID++,
      label: v.op
    };
    let tail_expr = Simple_expr(v.expr);
    edges.push({ from: tail.id, to: op.id });
    edges.push({ from: op.id, to: tail_expr.root.id });
    edges.push(tail_expr.edges);
    nodes.push(op);
    nodes.push(...tail_expr.nodes);
  }
  return { root, edges, nodes };
}

function expr(expr: expr): Three {
  switch (expr.type) {
    case "rel":
      return rel_expr(expr);
    case "block":
      return block(expr);
    case "call":
      return call(expr);
    case "constant":
      return constant(expr);
    case "identifier":
      return identifier(expr);
    case "neg":
      return factor_a(expr);
    case "not":
      return not(expr);
    case "rel":
      return rel_expr(expr);
    case "simple":
      return Simple_expr(expr);
    case "term":
      return term(expr);
    default:
      return fail(expr);
  }
}

function write_stmt(stmt: write_stmt): Three {
  let root: Node = {
    id: ID++,
    label: "WRITE Stmt"
  };
  let nodes: Node[] = [root];
  let edges: Edge[] = [];
  for (let st of stmt.params) {
    let v = expr(st);
    edges.push({ from: root.id, to: v.root.id });
    nodes.push(...v.nodes);
    edges.push(...v.edges);
  }
  return { root, edges, nodes };
}

function corpo(body: corpo) {
  let root: Node = {
    id: ID++,
    label: "Body"
  };
  let ret: Node = {
    id: ID++,
    label: "Return: " + (body.return || "void")
  }
  let nodes: Node[] = [root, ret];
  let edges: Edge[] = [{ from: root.id, to: ret.id }];
  if (body.declarations) {
    let d = decl_list(body.declarations);
    edges.push({ from: root.id, to: d.root.id });
    edges.push(...d.edges);
    nodes.push(...d.nodes);
  }
  let stmt = compound_stmt(body.stmt);
  edges.push({ from: root.id, to: stmt.root.id });
  edges.push(...stmt.edges);
  nodes.push(...stmt.nodes);
  return { root, nodes, edges };
}

function decl_proc(decl: dcl_proc): Three {
  let root: Node = {
    id: ID++,
    label: decl.identifier.value + ": ()=> " + (decl.returnType || "void")
  }
  let params = espec_parametros(decl.params);
  let body = corpo(decl.body);
  let nodes: Node[] = [root, ...params.nodes, ...body.nodes];
  let edges: Edge[] = [{ from: root.id, to: params.root.id }, { from: root.id, to: body.root.id }, ...params.edges, ...body.edges];
  return {
    root,
    nodes,
    edges
  }
}

function decl(decl: decl) {
  if (decl.type == "var") {
    return decl_var(decl);
  } else if (decl.type == "procedure") {
    return decl_proc(decl);
  } else {
    return fail(decl);
  }
}

function decl_list(declarations: decl_list) {
  let root: Node = {
    id: ID++,
    label: "Declarations"
  }
  let nodes: Node[] = [root];
  let edges: Edge[] = [];
  for (let d of declarations) {
    let t = decl(d);
    nodes.push(...t.nodes);
    edges.push(...t.edges);
    edges.push({ from: root.id, to: t.root.id });
  }
  return {
    root,
    nodes,
    edges
  }
}