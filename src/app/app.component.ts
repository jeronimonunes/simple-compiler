import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormControl, AbstractControl } from '@angular/forms';
import '../../node_modules/codemirror/mode/pascal/pascal';
import '../../node_modules/codemirror/mode/pegjs/pegjs';
import '../../node_modules/codemirror/mode/javascript/javascript';
import { generate } from 'pegjs';
import { simple_ast_grammar } from './grammar';
import { helloWorld, fib, factorial } from './examples';
import { AST } from './ast';
import { Network } from 'vis';
import { generateAST } from './ast-generator/ast.graph-generator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild("astDiv") astDiv: ElementRef;

  middle = new FormControl(null);

  network: Network;

  ast: AST;

  code = new FormControl(factorial, (c: AbstractControl) => {
    if (this.parser) {
      try {
        this.ast = this.parser.parse(c.value);
        console.log(this.ast);
        this.middle.setValue(JSON.stringify(this.ast, null, 4));
        if (this.astDiv) {
          this.network = generateAST(this.ast, this.astDiv.nativeElement);
        }
      } catch (e) {
        console.log(e);
        let line = "";
        let column = "";
        try {
          line = e.location.start.line;
          column = e.location.start.column;
        } catch  { }
        return { parser: e.message + " at line " + line + " and column " + column };
      }
    }
  });

  parser: PEG.Parser;

  grammar = new FormControl(simple_ast_grammar, (c: AbstractControl) => {
    try {
      this.parser = generate(c.value);
      this.code.updateValueAndValidity();
    } catch (e) {
      console.log(e);
      let line = "";
      let column = "";
      try {
        line = e.location.start.line;
        column = e.location.start.column;
      } catch  { }
      return { parser: e.message + " at line " + line + " and column " + column };
    }
  });

  grammar_config = {
    styleActiveLine: true,
    lineNumbers: true,
    mode: { name: "pegjs" },
    theme: "ambiance"
  }

  code_config = {
    styleActiveLine: true,
    lineNumbers: true,
    mode: "text/x-pascal",
    theme: "ambiance"
  }

  middle_config = {
    styleActiveLine: true,
    lineNumbers: true,
    readonly: true,
    mode: "application/json",
    theme: "ambiance"
  }

  ngOnInit() {
    setTimeout(() => {
      let e: HTMLDivElement = this.astDiv.nativeElement;
      e.scrollIntoView();
    })
  }
}
