import acorn from "acorn";
import { LiteralValueType, VariableDeclarationKind } from "./types";
import { readFileSync } from "node:fs";

const input = readFileSync("./input.js", "utf8");

const output = acorn.parse(input, { ecmaVersion: "latest" });

// console.log(output)

class Visitor {
    constructor(
        private evaluator: Evaluator,
        private environment: Environment,
    ) { }

    visit(node: acorn.AnyNode) {
        switch (node.type) {
            case "Program":
                return this.visitProgramNode(node);
            case "ExpressionStatement":
                return this.visitExpressionStatement(node);
            case "BinaryExpression":
                return this.visitBinaryExpression(node);
            case "Literal":
                return this.visitLiteral(node);
            case "CallExpression":
                return this.visitCallExpression(node);
            case "MemberExpression":
                return this.visitMemberExpression(node);
            case "Identifier":
                return this.visitIdentifier(node);
            case "VariableDeclaration":
                return this.visitVariableDeclaration(node);
            case "VariableDeclarator":
                return this.visitVariableDeclarator(node);
            default:
                throw new Error("Unhandled node type");
        }
    }

    visitProgramNode(programNode: acorn.Program) {
        let lastResult: any;

        for (const node of programNode.body) {
            lastResult = this.visit(node);
        }

        return lastResult;
    }

    visitExpressionStatement(
        expressionStatementNode: acorn.ExpressionStatement,
    ): any {
        return this.visit(expressionStatementNode.expression);
    }

    visitBinaryExpression(binaryExpressionNode: acorn.BinaryExpression) {
        const leftValue = this.visit(binaryExpressionNode.left);
        const rightValue = this.visit(binaryExpressionNode.right);

        const res = this.evaluator.performBinaryOperation({
            left: leftValue,
            right: rightValue,
            operator: binaryExpressionNode.operator,
        });

        return res;
    }

    visitLiteral(literal: acorn.Literal) {
        return literal.value;
    }

    visitCallExpression(callExpressionNode: acorn.CallExpression) {
        const fn = this.visit(callExpressionNode.callee);

        const visitedArgs = callExpressionNode.arguments.map((arg) => {
            return this.visit(arg);
        });

        fn(...visitedArgs);
    }

    visitMemberExpression(memberExpressionNode: acorn.MemberExpression): any {
        const object = this.visit(memberExpressionNode.object);

        if(memberExpressionNode.property.type === 'Identifier') {
            const res = object[memberExpressionNode.property.name];
            return res;
        }

        // TODO: support bracket access
    }

    visitIdentifier(identifierNode: acorn.Identifier) {
        return this.environment.getBinding(identifierNode.name);
    }

    visitVariableDeclaration(variableDeclarationNode: acorn.VariableDeclaration) {
        const { kind } = variableDeclarationNode;
        for (const declaration of variableDeclarationNode.declarations) {
            const { name, value } = this.visit(declaration);

            this.environment.setBindings({ name, value, kind });
        }
    }

    visitVariableDeclarator(variableDeclaratorNode: acorn.VariableDeclarator) {
        if(variableDeclaratorNode.id.type === 'Identifier') {
            const value = variableDeclaratorNode.init
                ? this.visit(variableDeclaratorNode.init)
                : undefined;

            const result: any = { name: variableDeclaratorNode.id.name, value };

            return result;
        }

        //TODO: handle destructuring etc
    }
}

class Evaluator {
    performBinaryOperation(params: {
        left: LiteralValueType;
        right: LiteralValueType;
        operator: acorn.BinaryOperator;
    }) {
        const { left, right, operator } = params;

        //TODO: at some point in the future maybe handle this myself
        //as currently i have another scope and things to learn in mind
        //i'll let javascript handle operations.
        return eval(`${left}${operator}${right}`);
    }
}

class Environment {
    constructor(private bindings: Map<string, any> = new Map()) {
        this.bindings.set("console", {
            log: (...args: any[]) => console.log(...args),
        });
    }

    getBinding(name: string) {
        if (!this.bindings.has(name)) {
            throw new Error(`${name} is not defined`);
        }

        return this.bindings.get(name);
    }

    //TODO: handle let vs var
    //TODO: handle using and await using
    setBindings(params: {
        name: string;
        value: any;
        kind: VariableDeclarationKind;
    }) {
        if (params.kind === "const" && this.bindings.has(params.name)) {
            throw new Error("Cannot reassign a const value");
        }

        this.bindings.set(params.name, params.value);
    }
}

const env = new Environment();
const evaluator = new Evaluator();
const visitor = new Visitor(evaluator, env);

visitor.visit(output);
