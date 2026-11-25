import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["coverage/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
