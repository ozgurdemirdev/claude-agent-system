// Starting ESLint configuration for a plain HTML/CSS/JS project.
// Copy it to the project root as `eslint.config.mjs`.
//
// Only `eslint` itself is required, on purpose: every rule below is either
// core or expressed through `no-restricted-syntax`, so a new project needs
// one dev dependency and no plugin chain to keep current.
//
//   npm i -D eslint
//   npx eslint .
//
// Each block names the row it enforces in `library/web/rules.md`. A row in
// that file with no rule here is not in force; that is the gap to close,
// not a reason to relax the row.

import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        matchMedia: 'readonly',
        AbortController: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Release: production console stays quiet. `warn` and `error` survive
      // because they are the two levels a user report is built from.
      'no-console': ['error', { allow: ['warn', 'error'] }],

      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // `event` as an implicit global is a legacy IE leftover that silently
      // reads the wrong object.
      'no-restricted-globals': [
        'error',
        { name: 'event', message: 'Take the event as a handler parameter instead of reading the global.' },
      ],

      'no-restricted-syntax': [
        'error',
        {
          // Security: data derived text goes in through textContent.
          selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]",
          message: 'Assigning innerHTML is an XSS sink. Use textContent, or build nodes with createElement. If HTML really must be rendered, sanitize it with a maintained library first.',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name=/^write(ln)?$/]",
          message: 'document.write blocks the parser and is an injection sink. Build the node instead.',
        },
        {
          // Events: unload disables the back forward cache.
          selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value='unload']",
          message: "The unload event disables the back forward cache. Use 'pagehide', or 'visibilitychange' with a hidden check.",
        },
        {
          // Events: passive intent is written on the page, never inferred.
          selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^(scroll|wheel|touchstart|touchmove)$/][arguments.length<3]",
          message: 'Pass an options object with an explicit passive value. The browser default only applies at window, document and body, so leaving it out means the intent is unreadable and possibly wrong.',
        },
        {
          // Rendering: per frame work belongs on the frame callback.
          selector: "CallExpression[callee.name='setInterval'][arguments.1.value<=32]",
          message: 'A short interval driving visual updates drifts against the frame clock. Use requestAnimationFrame and cancel it on teardown.',
        },
        {
          // Shape: shared state travels through modules, not globals.
          selector: "AssignmentExpression[left.object.name='window'][left.property.name!=/^on(error|unhandledrejection)$/]",
          message: 'Do not hang state off window. Export it from a module and import it where it is needed.',
        },
      ],
    },
  },
];
