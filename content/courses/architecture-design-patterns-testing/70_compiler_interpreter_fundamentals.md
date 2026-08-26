# 70. Compiler/Interpreter Fundamentals — AST, Lexer, Parser

## Coverage Level
**Not Covered** — These concepts are not applied in the codebase, but understanding them explains how TypeScript, Zod, and the tools you use daily actually work — which in turn makes you a significantly better user of them.

## What It Is
Every piece of code you write is processed by a compiler or interpreter that transforms text into something executable. Understanding the pipeline — lexing, parsing, AST transformation, code generation — has practical benefits even if you never build a compiler yourself.

The pipeline has three main stages. The **lexer** (tokenizer) reads raw source text and converts it into a flat list of tokens: keywords, identifiers, operators, literals, and punctuation. `const x = 42` becomes `[CONST, IDENT("x"), EQUALS, NUMBER(42)]`. The **parser** reads those tokens and builds an **AST (Abstract Syntax Tree)**: a tree of nodes that represents the grammatical structure. The variable declaration becomes a `VariableDeclaration` node with `kind: "const"`, an identifier node `x`, and a numeric literal `42`. The **semantic analysis / code generation** stage walks the AST to type-check, transform, or generate output code.

Why does a full-stack developer need this? Because you interact with ASTs constantly: TypeScript's type checker walks your code's AST. ESLint rules are AST transformations. Babel plugins transform your JSX into `React.createElement` calls by walking and modifying the AST. Zod parses a schema definition and builds an internal validation tree that is structurally similar to an AST. When you write a custom ESLint rule, you are writing an AST visitor. When you debug TypeScript's behavior on complex generics, thinking in AST terms gives you a mental model for why the type checker makes certain decisions.

## Key Concepts
- **Token** — the smallest meaningful unit from source text: keyword, identifier, number, string, operator, punctuation
- **Lexer / Tokenizer** — splits source into a flat token stream; handles whitespace, comments, string literals
- **Parser** — reads the token stream and builds a tree (AST); implements the grammar of the language
- **AST (Abstract Syntax Tree)** — a tree where each node represents a syntactic construct (expression, statement, declaration); "abstract" because whitespace and parentheses are implicit in structure, not explicit nodes
- **Recursive descent parser** — the most common hand-written parser style; each grammar rule becomes a function
- **CST (Concrete Syntax Tree)** — includes all tokens (including whitespace) for lossless round-trips; used by formatters like Prettier
- **Visitor pattern** — a way to walk an AST; a visitor object has one method per node type; used by ESLint, TypeScript transformers, Babel plugins
- **Code generation** — the final stage; walks the (possibly transformed) AST and emits output text (JavaScript, binary, SQL, etc.)

## Example Code
```typescript
// Build a tiny expression parser for a filter DSL
// e.g., parsing "age > 18 AND status = 'active'" from a query string
// This is the exact problem that Zod, tRPC, and ORM query builders solve

// ── 1. Lexer ─────────────────────────────────────────────────────────────────
type TokenType = 'IDENT' | 'NUMBER' | 'STRING' | 'OP' | 'AND' | 'OR' | 'EOF';
interface Token { type: TokenType; value: string; pos: number }

function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }  // skip whitespace

    if (/[a-zA-Z_]/.test(input[i])) {
      let word = '';
      const pos = i;
      while (i < input.length && /\w/.test(input[i])) word += input[i++];
      const type = word === 'AND' ? 'AND' : word === 'OR' ? 'OR' : 'IDENT';
      tokens.push({ type, value: word, pos });
      continue;
    }

    if (/\d/.test(input[i])) {
      let num = '';
      const pos = i;
      while (i < input.length && /\d/.test(input[i])) num += input[i++];
      tokens.push({ type: 'NUMBER', value: num, pos });
      continue;
    }

    if (input[i] === "'") {
      let str = '';
      const pos = i++;
      while (i < input.length && input[i] !== "'") str += input[i++];
      i++;  // skip closing quote
      tokens.push({ type: 'STRING', value: str, pos });
      continue;
    }

    if (/[><=!]/.test(input[i])) {
      const pos = i;
      let op = input[i++];
      if (input[i] === '=') op += input[i++];
      tokens.push({ type: 'OP', value: op, pos });
      continue;
    }

    throw new Error(`Unexpected character '${input[i]}' at position ${i}`);
  }

  tokens.push({ type: 'EOF', value: '', pos: i });
  return tokens;
}

// ── 2. AST node types ────────────────────────────────────────────────────────
type ASTNode =
  | { kind: 'BinaryExpr'; left: ASTNode; op: string; right: ASTNode }
  | { kind: 'Comparison'; field: string; op: string; value: string | number }

// ── 3. Recursive descent parser ─────────────────────────────────────────────
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek() { return this.tokens[this.pos]; }
  private consume() { return this.tokens[this.pos++]; }

  parse(): ASTNode { return this.parseExpr(); }

  private parseExpr(): ASTNode {
    let left = this.parseComparison();

    while (this.peek().type === 'AND' || this.peek().type === 'OR') {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = { kind: 'BinaryExpr', left, op, right };
    }

    return left;
  }

  private parseComparison(): ASTNode {
    const field = this.consume().value;   // IDENT
    const op    = this.consume().value;   // OP
    const tok   = this.consume();          // NUMBER or STRING
    const value = tok.type === 'NUMBER' ? parseInt(tok.value) : tok.value;
    return { kind: 'Comparison', field, op, value };
  }
}

// ── 4. Code generation: AST → SQL WHERE clause ──────────────────────────────
function toSQL(node: ASTNode): string {
  if (node.kind === 'Comparison') {
    const val = typeof node.value === 'string' ? `'${node.value}'` : node.value;
    return `"${node.field}" ${node.op} ${val}`;
  }
  return `(${toSQL(node.left)} ${node.op} ${toSQL(node.right)})`;
}

// Usage: parse user-provided filter and convert to SQL safely
const tokens = lex("age > 18 AND status = 'active'");
const ast    = new Parser(tokens).parse();
const sql    = toSQL(ast);
// → `("age" > 18 AND "status" = 'active')`
// In production: use parameterized queries, not string interpolation
```

## When to Use
1. **Writing custom ESLint rules** — ESLint exposes your codebase as an AST; a custom rule is an AST visitor that finds patterns and reports violations. Understanding AST structure makes this straightforward.
2. **Understanding TypeScript errors** — "Conditional type resolved to `never`" or "Type instantiation is excessively deep" are symptoms of how TypeScript walks the type AST; knowing the model helps you reason about the error.
3. **Building a DSL** — a filter query language for your SaaS admin dashboard, a permissions expression language, a configuration template syntax — all require a lexer and parser.
4. **Code transformation** — Babel, ts-morph, and jscodeshift let you programmatically refactor code by transforming ASTs; useful for large-scale migrations.
5. **Understanding Zod / type validators** — Zod's `.object()`, `.string()`, `.union()` build a schema AST at runtime; `.parse()` walks it. Knowing this makes Zod error messages and behavior intuitive.

## Common Mistakes
- **String-based parsing with regex** — regex is the wrong tool for parsing nested or recursive structures. It works for tokenization but fails for grammar.
- **Conflating the lexer and parser** — mixing tokenization and parsing into one pass makes grammars hard to extend. Keep them separate.
- **Mutable global parser state** — parsers that use module-level variables for position fail on concurrent use. Always make the parser a class or closure with local state.
- **Not handling errors gracefully** — a parser that throws unrecoverable errors on the first mistake is unusable in a UI. Add error recovery so the parser can continue and report multiple errors at once.

## Further Reading
- Crafting Interpreters (Robert Nystrom) — free online, best intro to this topic: https://craftinginterpreters.com/
- `@typescript-eslint/parser` — the actual TypeScript AST parser used by ESLint: https://typescript-eslint.io/packages/parser/
- ts-morph — TypeScript AST manipulation library: https://ts-morph.com/
