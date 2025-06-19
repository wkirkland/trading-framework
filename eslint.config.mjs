import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Security: Prevent API key exposure in URLs
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/api_key=/]",
          message: "Direct API key in URL string is not allowed for security reasons. Use secure HTTP client instead."
        },
        {
          selector: "TemplateLiteral[quasis.0.value.raw=/.*api_key=.*/]",
          message: "API key in template literal is not allowed for security reasons. Use secure HTTP client instead."
        },
        {
          selector: "CallExpression[callee.name='fetch'][arguments.0.type='Literal'][arguments.0.value=/.*api_key=.*/]",
          message: "Direct fetch with API key in URL is not allowed. Use secure HTTP client instead."
        },
        {
          selector: "CallExpression[callee.name='fetch'][arguments.0.type='TemplateLiteral'][arguments.0.quasis.0.value.raw=/.*api_key=.*/]",
          message: "Direct fetch with API key in template literal is not allowed. Use secure HTTP client instead."
        }
      ],
      
      // Additional security rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Code quality rules
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Import organization
      "import/order": ["error", {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always"
      }]
    }
  },
  {
    // Allow API key usage specifically in the secure HTTP client
    files: ["lib/http/fredClient.ts"],
    rules: {
      "no-restricted-syntax": "off"
    }
  }
];

export default eslintConfig;
