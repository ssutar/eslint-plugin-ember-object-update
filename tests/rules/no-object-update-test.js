const rule = require("../../lib/rules/no-object-update");
const MESSAGE = rule.meta.message;
const RuleTester = require("eslint").RuleTester;
const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module"
  }
});

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
    }
  ]
});
