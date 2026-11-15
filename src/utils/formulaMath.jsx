import { Fragment } from "react";

// A small JavaScript-expression parser used only for the visual formula
// preview. It intentionally supports the arithmetic/function subset that makes
// sense as a formula; anything else falls back to showing the raw text.

const OPERATOR_TOKENS = ["**", "=>"];

function tokenize(source) {
    const tokens = [];
    let i = 0;

    while (i < source.length) {
        const ch = source[i];

        if (/\s/.test(ch)) {
            i++;
            continue;
        }

        // Number, including decimals and scientific notation.
        if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
            const start = i;
            while (i < source.length && /[0-9]/.test(source[i])) i++;
            if (source[i] === ".") {
                i++;
                while (i < source.length && /[0-9]/.test(source[i])) i++;
            }
            const exponent = source[i];
            const exponentNext = source[i + 1] ?? "";
            const exponentAfterSign = source[i + 2] ?? "";
            if ((exponent === "e" || exponent === "E") && /[0-9]/.test(exponentNext)) {
                i++;
                while (i < source.length && /[0-9]/.test(source[i])) i++;
            } else if (
                (exponent === "e" || exponent === "E") &&
                (exponentNext === "+" || exponentNext === "-") &&
                /[0-9]/.test(exponentAfterSign)
            ) {
                i += 2;
                while (i < source.length && /[0-9]/.test(source[i])) i++;
            }
            tokens.push({ type: "number", value: source.slice(start, i) });
            continue;
        }

        // Identifier or keyword.
        if (/[A-Za-z_$]/.test(ch)) {
            const start = i;
            i++;
            while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i++;
            tokens.push({ type: "identifier", value: source.slice(start, i) });
            continue;
        }

        const two = source.slice(i, i + 2);
        if (OPERATOR_TOKENS.includes(two)) {
            tokens.push({ type: "operator", value: two });
            i += 2;
            continue;
        }

        if ("+-*/%^(),.!".includes(ch)) {
            tokens.push({ type: "operator", value: ch });
            i++;
            continue;
        }

        throw new Error(`Unsupported character "${ch}"`);
    }

    tokens.push({ type: "eof", value: "" });
    return tokens;
}

class FormulaParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    peek(offset = 0) {
        return this.tokens[this.position + offset];
    }

    next() {
        return this.tokens[this.position++];
    }

    match(value) {
        if (this.peek().value === value) {
            this.position++;
            return true;
        }
        return false;
    }

    expect(value) {
        const token = this.next();
        if (token.value !== value) {
            throw new Error(`Expected "${value}" but found "${token.value || "end of formula"}"`);
        }
        return token;
    }

    parse() {
        const expression = this.parseExpression();
        if (this.peek().type !== "eof") {
            throw new Error(`Unsupported token "${this.peek().value}"`);
        }
        return expression;
    }

    parseExpression() {
        return this.parseArrow();
    }

    parseArrow() {
        if (this.peek().type === "identifier" && this.peek(1).value === "=>") {
            const param = this.next().value;
            this.expect("=>");
            return { type: "arrow", param, body: this.parseArrow() };
        }
        return this.parseAdditive();
    }

    parseAdditive() {
        let left = this.parseMultiplicative();
        while (this.peek().value === "+" || this.peek().value === "-") {
            const op = this.next().value;
            left = { type: "binary", op, left, right: this.parseMultiplicative() };
        }
        return left;
    }

    parseMultiplicative() {
        let left = this.parseUnary();
        while (["*", "/", "%"].includes(this.peek().value)) {
            const op = this.next().value;
            left = { type: "binary", op, left, right: this.parseUnary() };
        }
        return left;
    }

    parseUnary() {
        if (["+", "-"].includes(this.peek().value)) {
            const op = this.next().value;
            return { type: "unary", op, operand: this.parseUnary() };
        }
        return this.parsePower();
    }

    parsePower() {
        const base = this.parsePrimary();
        if (this.match("**")) {
            return { type: "binary", op: "**", left: base, right: this.parseUnary() };
        }
        if (this.match("^")) {
            return { type: "binary", op: "^", left: base, right: this.parseUnary() };
        }
        return base;
    }

    parsePrimary() {
        const token = this.peek();

        if (token.type === "number") {
            this.next();
            return { type: "number", value: token.value };
        }

        if (token.type === "identifier") {
            return this.parseIdentifierOrCall();
        }

        if (this.match("(")) {
            const expression = this.parseExpression();
            this.expect(")");
            return { type: "group", expression };
        }

        throw new Error(`Unexpected token "${token.value || "end of formula"}"`);
    }

    parseIdentifierOrCall() {
        let node = { type: "identifier", name: this.next().value };

        while (this.match(".")) {
            const property = this.next();
            if (property.type !== "identifier") {
                throw new Error("Expected a property name after '.'");
            }
            node = { type: "member", object: node, property: property.value };
        }

        if (this.match("(")) {
            const args = [];
            if (!this.match(")")) {
                do {
                    args.push(this.parseExpression());
                } while (this.match(","));
                this.expect(")");
            }
            node = { type: "call", callee: node, args };
        }

        return node;
    }
}

export function parseFormula(source) {
    return new FormulaParser(tokenize(source)).parse();
}

function memberName(node) {
    if (node.type === "identifier") return node.name;
    if (node.type === "member") return `${memberName(node.object)}.${node.property}`;
    return "";
}

function calleeName(node) {
    if (node.type === "identifier") return node.name;
    if (node.type === "member") return node.property;
    return "";
}

function renderArgs(args) {
    return args.map((arg, index) => (
        <Fragment key={index}>
            {index > 0 && <span className="math-punctuation">,</span>}
            {renderNode(arg)}
        </Fragment>
    ));
}

function renderFunctionCall(name, args) {
    return (
        <span className="math-function-call">
            <span className="math-function">{name || "f"}</span>
            <span className="math-punctuation">(</span>
            {renderArgs(args)}
            <span className="math-punctuation">)</span>
        </span>
    );
}

function renderRadical(symbol, content) {
    return (
        <span className="math-radical">
            <span className="math-radical-symbol">{symbol}</span>
            <span className="math-radicand">{content}</span>
        </span>
    );
}

function renderPower(base, exponent) {
    return (
        <span className="math-power">
            {base}
            <sup className="math-exponent">{exponent}</sup>
        </span>
    );
}

function renderCall(node) {
    const name = calleeName(node.callee);

    if (name === "sqrt" && node.args.length === 1) {
        return renderRadical("√", renderNode(node.args[0]));
    }
    if (name === "cbrt" && node.args.length === 1) {
        return renderRadical("∛", renderNode(node.args[0]));
    }
    if (name === "abs" && node.args.length === 1) {
        return (
            <span className="math-expression">
                <span className="math-bar">|</span>
                {renderNode(node.args[0])}
                <span className="math-bar">|</span>
            </span>
        );
    }
    if (name === "pow" && node.args.length === 2) {
        return renderPower(renderNode(node.args[0]), renderNode(node.args[1]));
    }
    if (name === "ln" && node.args.length === 1) {
        return (
            <span className="math-function-call">
                <span className="math-function">ln</span>
                <span className="math-punctuation">(</span>
                {renderNode(node.args[0])}
                <span className="math-punctuation">)</span>
            </span>
        );
    }

    return renderFunctionCall(name, node.args);
}

function renderNode(node) {
    switch (node.type) {
        case "number":
            return <span className="math-number">{node.value}</span>;

        case "identifier":
            if (node.name === "PI") return <span className="math-identifier">π</span>;
            if (node.name === "E") return <span className="math-identifier">e</span>;
            return <span className="math-identifier">{node.name}</span>;

        case "member":
            if (memberName(node) === "Math.PI") return <span className="math-identifier">π</span>;
            if (memberName(node) === "Math.E") return <span className="math-identifier">e</span>;
            return <span className="math-identifier">{memberName(node)}</span>;

        case "group":
            return (
                <span className="math-expression">
                    <span className="math-punctuation">(</span>
                    {renderNode(node.expression)}
                    <span className="math-punctuation">)</span>
                </span>
            );

        case "unary":
            return (
                <span className="math-expression">
                    <span className="math-operator math-unary">{node.op === "-" ? "−" : node.op}</span>
                    {renderNode(node.operand)}
                </span>
            );

        case "binary":
            if (node.op === "/") {
                return (
                    <span className="math-fraction">
                        <span className="math-numerator">{renderNode(node.left)}</span>
                        <span className="math-denominator">{renderNode(node.right)}</span>
                    </span>
                );
            }
            if (node.op === "**" || node.op === "^") {
                return renderPower(renderNode(node.left), renderNode(node.right));
            }
            return (
                <span className="math-expression">
                    {renderNode(node.left)}
                    <span className="math-operator">
                        {node.op === "*" ? "·" : node.op === "%" ? "mod" : node.op === "-" ? "−" : node.op}
                    </span>
                    {renderNode(node.right)}
                </span>
            );

        case "call":
            return renderCall(node);

        case "arrow":
            return (
                <span className="math-expression">
                    <span className="math-identifier">{node.param}</span>
                    <span className="math-operator">↦</span>
                    {renderNode(node.body)}
                </span>
            );

        default:
            return null;
    }
}

export function renderFormula(node) {
    return renderNode(node);
}
