/**
 * Prevent the record update after removal
 */
"use strict";

//------------------------------------------------------------------------------
// Utility methods
//------------------------------------------------------------------------------

/**
 * Construct the error message to be report when rule fails
 *
 * @param {String} objName
 * @param {String[]} utilityMethods
 */
function getReportMessage(objName = "obj", utilityMethods = []) {
  let msg = `Wrap '${objName}.set' in 'if (!${objName}.isDestroying) { ${objName}.set(...) }'`;
  if (utilityMethods.length) {
    msg = `Use the utility method(s) '${utilityMethods.join(
      "' OR '"
    )}' to verify the '${objName}' is not being destroyed before calling '${objName}.set(...)'`;
  }
  return msg;
}

/**
 * Get a property from and object, useful to get nested props without checking for null values
 *
 * @param {Object} obj
 * @param {String} path
 * @returns {Any}
 */
function get(obj, path) {
  return path.split(".").reduce(function(currentObject, pathSegment) {
    return typeof currentObject == "undefined" || currentObject === null
      ? currentObject
      : currentObject[pathSegment];
  }, obj);
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
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
    /**
     * Iterates recursively over the test node of conditional and extracts the nodes matching
     * either call expressions or member expressions
     * @param {Expression} testNode
     * @returns {Expression[]}
     */
    function getConditionalParams(testNode) {
      const type = get(testNode, "type");
      if (type === "LogicalExpression") {
        return []
          .concat(getConditionalParams(get(testNode, "left")))
          .concat(getConditionalParams(get(testNode, "right")));
      }
      if (type === "UnaryExpression") {
        return [].concat(getConditionalParams(get(testNode, "argument")));
      }
      if (type === "MemberExpression" || type === "CallExpression") {
        return [testNode];
      }
      return [];
    }

    /**
     * Checks if the `statement` is wrapped in the destroy conditional
     *
     * @param {Scope} scope
     * @param {String} objName
     * @returns boolean
     */
    function isWrappedInDestroyConditional(scope, objName) {
      if (get(scope, "block.parent.type") !== "IfStatement") {
        return false;
      }
      return getConditionalParams(get(scope, "block.parent.test")).some(
        param => {
          const type = get(param, "type");
          if (type === "MemberExpression") {
            return (
              get(param, "object.name") === objName &&
              get(param, "property.name") === "isDestroying"
            );
          } else {
            return (
              context.options.includes(get(param, "callee.name")) &&
              get(param, "arguments").some(arg => get(arg, "name") === objName)
            );
          }
        }
      );
    }

    /**
     * Main entry point for rule
     *
     * Parses all the `set` Identifier expressions in the code and report if it can fail in tests
     *
     * @param {Identifier} node
     */
    function checkForObjectUpdate(node) {
      if (
        get(node, "name") === "set" &&
        get(node, "parent.type") !== "CallExpression" &&
        get(node, "parent.object.type") !== "ThisExpression"
      ) {
        const objName = get(node, "parent.object.name");
        let scope = context.getScope(node);
        while (scope && get(scope, "type") !== "function") {
          if (isWrappedInDestroyConditional(scope, objName)) {
            return;
          }
          scope = get(scope, "upper");
        }

        const pNodeScope = get(scope, "block.parent");
        const pNodeScopeCallee =
          get(pNodeScope, "type") === "CallExpression"
            ? pNodeScope.callee
            : null;

        if (!pNodeScopeCallee) {
          return;
        } else {
          const propName = get(pNodeScopeCallee, "property.name");
          const isSetWrappedInPromise =
            propName === "then" ||
            propName === "catch" ||
            propName === "finally";

          if (isSetWrappedInPromise) {
            context.report(node, getReportMessage(objName, context.options));
          }
        }
      }
    }
    return { Identifier: checkForObjectUpdate };
  }
};
