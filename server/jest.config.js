module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'models/**/*.ts',
    'middlewares/**/*.ts',
    'routes/**/*.ts',
    'services/**/*.ts',
    '!**/node_modules/**'
  ]
};