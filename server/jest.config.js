module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
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
      '!**/node_modules/**'
    ]
  };