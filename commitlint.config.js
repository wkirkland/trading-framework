module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Ensure commit messages follow conventional format
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD related changes
        'build',    // Build system changes
        'perf',     // Performance improvements
        'revert',   // Revert previous commit
        'security', // Security improvements
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'api',       // API route changes
        'ui',        // UI component changes
        'config',    // Configuration changes
        'http',      // HTTP client changes
        'fred',      // FRED service specific
        'test',      // Testing related
        'lint',      // Linting related
        'security',  // Security related
        'docker',    // Docker related
        'hooks',     // Git hooks related
        'analysis',  // Analysis/business logic
        'project',   // Project-wide changes
        'deps',      // Dependency changes
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};