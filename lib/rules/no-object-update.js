/**
 * Prevent the code to use `EmberObject.extend` favoring the ES6 native class `extends`
 */
"use strict";
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
function getReportMessage(objName = "obj") {
  return `Please wrap '${objName}.set' in 'isAlive(${objName})'`;
}

module.exports = {
  meta: {
    docs: {
      description: "disallow EmberObject.set in promise hooks",
      category: "Stylistic Issues",
      recommended: false
    },
    reportMessage: getReportMessage()
  },
  create: function create(context) {
    function checkForObjectUpdate(node) {
      if (
        node.name === "set" &&
        node.parent.type !== "CallExpression" &&
        node.parent.object.type !== "ThisExpression"
      ) {
        let scope = context.getScope(node);
        while (scope && scope.type !== "function") {
          scope = scope.upper;
        }

        const pNodeScope = scope && scope.block.parent;
        const pNodeScopeCallee =
          pNodeScope && pNodeScope.type === "CallExpression"
            ? pNodeScope.callee
            : null;

        if (!pNodeScopeCallee) {
          return;
        } else {
          const propName = pNodeScopeCallee.property.name;
          const isSetWrappedInPromise =
            propName === "then" ||
            propName === "catch" ||
            propName === "finally";

          if (isSetWrappedInPromise) {
            const objName = node.parent.object.name;
            context.report(node, getReportMessage(objName));
          }
        }
      }
    }
    return { Identifier: checkForObjectUpdate };
  }
};
