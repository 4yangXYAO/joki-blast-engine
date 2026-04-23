/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/workers/index.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 70, functions: 75, lines: 75, statements: 75 }
  },
  moduleNameMapper: { '@/(.*)': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/tests/setup.ts']
}
