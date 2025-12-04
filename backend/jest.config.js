/**
 * Jest Configuration for Backend Tests
 *
 * This configuration enables Jest to properly handle TypeScript files
 * and path aliases used in the backend codebase.
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment (Node.js for backend)
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Module path aliases (matches tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Minimal TypeScript config for tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
      }
    }]
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage configuration (optional)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*\\.integration\\.ts$', // Exclude integration scripts (run manually, not in CI)
  ],

  // Increase test timeout for integration tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output for debugging
  verbose: true,
};
