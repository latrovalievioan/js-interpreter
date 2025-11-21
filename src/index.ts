import acorn from "acorn";
import { LiteralValueType } from "./types";
import { readFileSync } from "node:fs";

const input = readFileSync('./input.js', 'utf8')

const output = acorn.parse(input,
    { ecmaVersion: "latest" },
);


class Visitor {
    visit(node: acorn.AnyNode) {
        switch (node.type) {
            case "Program":
                return this.visitProgramNode(node)
            case "ExpressionStatement":
                return this.visitExpressionStatement(node)
            case "BinaryExpression":
                return this.visitBinaryExpression(node)
            case "Literal":
                return this.visitLiteral(node)
            default:
                throw new Error('Unhandled node type')
        }
    }

    visitProgramNode(programNode: acorn.Program) {
        let lastResult: any;

        for (const node of programNode.body) {
            lastResult = this.visit(node)
        }

        return lastResult
    }

    visitExpressionStatement(expressionStatementNode: acorn.ExpressionStatement): any {
        return this.visit(expressionStatementNode.expression)
    }

    visitBinaryExpression(binaryExpressionNode: acorn.BinaryExpression) {
        const leftValue = this.visit(binaryExpressionNode.left)
        const rightValue = this.visit(binaryExpressionNode.right)

        const res = this.performBinaryOperation({ left: leftValue, right: rightValue, operator: binaryExpressionNode.operator })

        return res
    }

    visitLiteral(literal: acorn.Literal) {
        return literal.value
    }

    performBinaryOperation(params: { left: LiteralValueType, right: LiteralValueType, operator: acorn.BinaryOperator }) {
        const { left, right, operator } = params;

        //TODO: at some point in the future maybe handle this myself
        //as currently i have another scope and things to learn in mind
        //i'll let javascript handle operations.
        return eval(`${left}${operator}${right}`)
    }
}

const visitor = new Visitor()

console.log(visitor.visit(output))
