module.exports = {
  preset: 'jest-expo',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/*-test.[jt]s?(x)',
    '**/*.test.[jt]s?(x)',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!__tests__/**',
    '!**/__tests__/**',
    '!coverage/**',
    '!node_modules/**',
    '!.expo/**',
    '!babel.config.js',
    '!metro.config.js',
    '!jest.config.js',
    '!expo-env.d.ts',
  ],
  coverageReporters: ['text-summary', 'lcov'],
  coverageDirectory: 'coverage',
};
