const rule = require("../../lib/rules/no-object-update");
const MESSAGE = rule.meta.message;
const RuleTester = require("eslint").RuleTester;
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module"
  }
});

const MESSAGE_WITH_OPTIONS = `Use the utility method(s) 'isAlive' OR 'isRemoved' to verify the 'obj' is not being destroyed before calling 'obj.set(...)'`;

ruleTester.run("no-object-update", rule, {
  valid: [
    {
      code: `
        somePromise
          .then(() => {
            this.set('prop1', true);
          })
          .catch(() => {
            this.set('prop2', true);
          })
          .finally(() => {
            this.set('prop3', false);
          });
        `
    },
    {
      code: `
        somePromise
          .then(() => {
            if(!obj.isDestroying) {
              obj.set('prop1', true);
            }
          })
          .catch(() => {
            if(!obj.isDestroying) {
              if(someOtherCondition()) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          })
          .finally(() => {
            if(someOtherCondition()) {
              if(!obj.isDestroying) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          });
        `
    },
    {
      code: `
        somePromise
          .then(() => {
            if(!isRemoved(obj)) {
              obj.set('prop1', true);
            }
          })
          .catch(() => {
            if(isAlive(obj)) {
              if(someOtherCondition()) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          })
          .finally(() => {
            if(someOtherCondition()) {
              if(!isMarkedForDelete(obj)) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          });
        `,
      options: ["isAlive", "isRemoved", "isMarkedForDelete"]
    }
  ],
  invalid: [
    {
      code: `
        somePromise
          .then(() => {
            obj.set('prop1', true);
          })
          .catch(() => {
            obj.set('prop2', true);
          })
          .finally(() => {
            obj.set('prop3', false);
          });
        `,
      errors: [
        {
          message: MESSAGE
        },
        {
          message: MESSAGE
        },
        {
          message: MESSAGE
        }
      ]
    },
    {
      code: `
        somePromise
          .then(() => {
            if(!isRemoved(obj)) {
              obj.set('prop1', true);
            }
          })
          .catch(() => {
            if(isAlive(obj)) {
              if(someOtherCondition()) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          })
          .finally(() => {
            if(someOtherCondition()) {
              if(!isMarkedForDelete(obj)) {
                if(someOtherNestedCondition) {
                  obj.set('prop2', true);
                }
              }
            }
          });
        `,
      errors: [
        {
          message: MESSAGE
        },
        {
          message: MESSAGE
        },
        {
          message: MESSAGE
        }
      ]
    },
    {
      code: `
        somePromise
          .then(() => {
            obj.set('prop1', true);
          })
          .catch(() => {
            if(someOtherCondition()) {
              if(someOtherNestedCondition) {
                obj.set('prop2', true);
              }
            }
          })
          .finally(() => {
            if(someOtherCondition()) {
              if(someOtherNestedCondition) {
                obj.set('prop2', true);
              }
            }
          });
        `,
      options: ["isAlive", "isRemoved"],
      errors: [
        {
          message: MESSAGE_WITH_OPTIONS
        },
        {
          message: MESSAGE_WITH_OPTIONS
        },
        {
          message: MESSAGE_WITH_OPTIONS
        }
      ]
    }
  ]
});
