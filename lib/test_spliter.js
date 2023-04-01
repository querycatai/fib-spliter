const acorn = require('acorn');
const escodegen = require('escodegen');

function traverse(node) {
    const nodes = [];

    function traverseNode(node) {
        if (node.type === 'CallExpression' && node.callee.name === 'it' && !node.callee.object)
            nodes.push(node);
        else
            for (let key in node) {
                if (node.hasOwnProperty(key)) {
                    const child = node[key];
                    if (Array.isArray(child)) {
                        child.forEach((c) => traverseNode(c));
                    } else if (child && typeof child === 'object') {
                        traverseNode(child);
                    }
                }
            }
    }

    traverseNode(node);

    return nodes;
}

class TestSpliter {
    constructor(opts) {
        this.opts = {
            ...opts
        }
    }

    split(code) {
        const ast = acorn.parse(code, {
            ecmaVersion: 'latest'
        });

        return traverse(ast).map(node => escodegen.generate(node));
    }
}

module.exports = TestSpliter;