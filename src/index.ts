import acorn from "acorn";
import { LiteralValueType } from "./types";
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

        const visitedArgs = callExpressionNode.arguments.map((arg) => this.visit(arg))

        fn(...visitedArgs)
    }

    visitMemberExpression(memberExpressionNode: acorn.MemberExpression): any {
        const objectName = this.visit(memberExpressionNode.object);
        const propertyName = this.visit(memberExpressionNode.property);

        const res = this.environment.getBinding(objectName)[propertyName]

        return res
    }

    visitIdentifier(identifierNode: acorn.Identifier) {
        return identifierNode.name;
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
    private bindings: Record<string, any> = {
        console: {
            log: (...args: any[]) => console.log(...args),
        },
    };

    getBinding(name: string) {
        return this.bindings[name]
    }
}

const env = new Environment();
const evaluator = new Evaluator();
const visitor = new Visitor(evaluator, env);

visitor.visit(output);
