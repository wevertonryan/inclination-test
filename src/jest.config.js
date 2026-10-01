module.exports = {
  preset: 'jest-expo',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/*-test.[jt]s?(x)',
    '**/*.test.[jt]s?(x)',
  ],
  // testMatch acima trata qualquer .ts/.tsx dentro de __tests__ como suite de testes,
  // então os fixtures compartilhados ficam fora de __tests__ e são ignorados aqui.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test-utils/'],
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!__tests__/**',
    '!**/__tests__/**',
    '!test-utils/**',
    '!**/test-utils/**',
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
