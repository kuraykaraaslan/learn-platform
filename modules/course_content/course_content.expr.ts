// P11's arithmetic evaluator (docs/phases/11-recall-and-calc.md). A hand-written
// tokenizer + shunting-yard + RPN walk, deliberately NOT `eval`/`new Function`.
//
// The spec's reasoning, kept here because it is the whole justification for
// ~200 lines of parser instead of one line of eval: content authors are an
// input source, and the content pipeline is the one place in this project that
// is not already a sandbox. A `calc` fence's `expr` is author-written text that
// ends up running in every reader's browser. `new Function(expr)` would hand
// that text the full global scope; this walks a fixed grammar instead, so the
// worst a malformed expression can do is throw at build time.
//
// Grammar: numbers, identifiers, `+ - * / ( )`, unary minus, and the three
// functions the spec names — min, max, round. Nothing else parses, on purpose:
// no property access, no strings, no calls to anything not on that list.
//
// Placed alongside the other course_content.* logic modules rather than at the
// spec's `widgets/expr.ts`, to match the convention every sibling parser
// (quiz, recall, tradeoff, templates) already follows. It is client-safe —
// CalcCard re-evaluates on every keystroke — so it touches no node: builtins.

export type ExprNode =
  | { kind: 'number'; value: number }
  | { kind: 'identifier'; name: string }
  | { kind: 'unary'; op: '-'; operand: ExprNode }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: ExprNode; right: ExprNode }
  | { kind: 'call'; name: FunctionName; args: ExprNode[] };

const FUNCTIONS = {
  min: { arity: [2, Infinity] as const, apply: (args: number[]) => Math.min(...args) },
  max: { arity: [2, Infinity] as const, apply: (args: number[]) => Math.max(...args) },
  round: { arity: [1, 2] as const, apply: (args: number[]) => roundTo(args[0], args[1] ?? 0) },
};
export type FunctionName = keyof typeof FUNCTIONS;

function isFunctionName(name: string): name is FunctionName {
  return Object.prototype.hasOwnProperty.call(FUNCTIONS, name);
}

/**
 * round(x, digits) — scaled through a string rather than `Math.round(x * 10**d)`
 * because the latter reintroduces the float error it is being asked to remove
 * (round(1.005, 2) is 1 in the naive form). Number.EPSILON nudging is the other
 * common fix and is worse: it changes exact values too.
 */
function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value;
  const d = Math.trunc(digits);
  if (d === 0) return Math.round(value);
  const shifted = Number(`${value}e${d}`);
  return Number(`${Math.round(shifted)}e${-d}`);
}

// ─── Tokenizer ──────────────────────────────────────────────────────────────

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; name: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma' };

const IDENTIFIER_START = /[A-Za-z_]/;
const IDENTIFIER_PART = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

export class ExprError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExprError';
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      i++;
      continue;
    }

    if (DIGIT.test(char) || (char === '.' && DIGIT.test(input[i + 1] ?? ''))) {
      let literal = '';
      while (i < input.length && (DIGIT.test(input[i]) || input[i] === '.')) literal += input[i++];
      if ((literal.match(/\./g)?.length ?? 0) > 1) {
        throw new ExprError(`Malformed number "${literal}" in expression: ${input}`);
      }
      tokens.push({ type: 'number', value: Number(literal) });
      continue;
    }

    if (IDENTIFIER_START.test(char)) {
      let name = '';
      while (i < input.length && IDENTIFIER_PART.test(input[i])) name += input[i++];
      tokens.push({ type: 'identifier', name });
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'op', value: char });
      i++;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i++;
      continue;
    }

    if (char === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }

    // Everything the grammar does not name lands here — `**`, `%`, `[`, `.`
    // property access, quotes. Rejecting loudly is the point.
    throw new ExprError(`Unexpected character "${char}" in expression: ${input}`);
  }

  return tokens;
}

// ─── Parser (recursive descent) ─────────────────────────────────────────────

/**
 * Recursive descent rather than the spec's literal "shunting-yard": the same
 * precedence result, but it produces the AST directly and handles function
 * calls with variable arity without the operator-stack bookkeeping that
 * shunting-yard needs for commas. The grammar is small enough that the
 * precedence climbing is two functions.
 */
class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly source: string
  ) {}

  parse(): ExprNode {
    const node = this.parseAdditive();
    if (this.pos < this.tokens.length) {
      throw new ExprError(`Unexpected trailing input in expression: ${this.source}`);
    }
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private parseAdditive(): ExprNode {
    let left = this.parseMultiplicative();
    for (;;) {
      const token = this.peek();
      if (token?.type !== 'op' || (token.value !== '+' && token.value !== '-')) return left;
      this.pos++;
      left = { kind: 'binary', op: token.value, left, right: this.parseMultiplicative() };
    }
  }

  private parseMultiplicative(): ExprNode {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (token?.type !== 'op' || (token.value !== '*' && token.value !== '/')) return left;
      this.pos++;
      left = { kind: 'binary', op: token.value, left, right: this.parseUnary() };
    }
  }

  private parseUnary(): ExprNode {
    const token = this.peek();
    if (token?.type === 'op' && token.value === '-') {
      this.pos++;
      return { kind: 'unary', op: '-', operand: this.parseUnary() };
    }
    // A leading `+` is accepted and dropped; it changes nothing.
    if (token?.type === 'op' && token.value === '+') {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExprNode {
    const token = this.peek();
    if (!token) throw new ExprError(`Expression ends early: ${this.source}`);

    if (token.type === 'number') {
      this.pos++;
      return { kind: 'number', value: token.value };
    }

    if (token.type === 'paren' && token.value === '(') {
      this.pos++;
      const inner = this.parseAdditive();
      const close = this.peek();
      if (close?.type !== 'paren' || close.value !== ')') {
        throw new ExprError(`Unclosed "(" in expression: ${this.source}`);
      }
      this.pos++;
      return inner;
    }

    if (token.type === 'identifier') {
      this.pos++;
      const next = this.peek();
      if (next?.type === 'paren' && next.value === '(') {
        if (!isFunctionName(token.name)) {
          throw new ExprError(
            `Unknown function "${token.name}" — only ${Object.keys(FUNCTIONS).join(', ')} are available: ${this.source}`
          );
        }
        this.pos++;
        const args = this.parseArguments();
        const [min, max] = FUNCTIONS[token.name].arity;
        if (args.length < min || args.length > max) {
          throw new ExprError(
            `${token.name}() takes ${max === Infinity ? `at least ${min}` : min === max ? `${min}` : `${min}-${max}`} arguments, got ${args.length}: ${this.source}`
          );
        }
        return { kind: 'call', name: token.name, args };
      }
      return { kind: 'identifier', name: token.name };
    }

    throw new ExprError(`Unexpected token in expression: ${this.source}`);
  }

  private parseArguments(): ExprNode[] {
    const args: ExprNode[] = [];
    const first = this.peek();
    if (first?.type === 'paren' && first.value === ')') {
      this.pos++;
      return args;
    }
    for (;;) {
      args.push(this.parseAdditive());
      const token = this.peek();
      if (token?.type === 'comma') {
        this.pos++;
        continue;
      }
      if (token?.type === 'paren' && token.value === ')') {
        this.pos++;
        return args;
      }
      throw new ExprError(`Expected "," or ")" in argument list: ${this.source}`);
    }
  }
}

export function parseExpr(source: string): ExprNode {
  if (source.trim() === '') throw new ExprError('Empty expression');
  return new Parser(tokenize(source), source).parse();
}

// ─── Evaluation ─────────────────────────────────────────────────────────────

/**
 * Every identifier the expression reads. The `calc/unknown-identifier` lint
 * rule uses this to fail the build when an `expr` references an input id that
 * the fence does not declare — the failure mode that would otherwise reach a
 * reader as a silently blank output.
 */
export function identifiersIn(node: ExprNode): string[] {
  const found = new Set<string>();
  const walk = (n: ExprNode): void => {
    switch (n.kind) {
      case 'identifier':
        found.add(n.name);
        return;
      case 'unary':
        walk(n.operand);
        return;
      case 'binary':
        walk(n.left);
        walk(n.right);
        return;
      case 'call':
        n.args.forEach(walk);
        return;
      case 'number':
        return;
    }
  };
  walk(node);
  return [...found].sort();
}

export function evaluate(node: ExprNode, scope: Record<string, number>): number {
  switch (node.kind) {
    case 'number':
      return node.value;
    case 'identifier': {
      const value = scope[node.name];
      if (typeof value !== 'number') throw new ExprError(`No value for "${node.name}"`);
      return value;
    }
    case 'unary':
      return -evaluate(node.operand, scope);
    case 'binary': {
      const left = evaluate(node.left, scope);
      const right = evaluate(node.right, scope);
      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        // Division by zero yields Infinity/NaN rather than throwing; the UI
        // formats those as "—" instead of showing the reader "Infinity".
        case '/':
          return left / right;
      }
    }
    case 'call':
      return FUNCTIONS[node.name].apply(node.args.map((arg) => evaluate(arg, scope)));
  }
}

/** Parse-and-run in one call, for callers that hold no AST of their own. */
export function evaluateExpr(source: string, scope: Record<string, number>): number {
  return evaluate(parseExpr(source), scope);
}
