module.exports = {
  preset: 'jest-expo',
  // O preset resolve `lucide-react-native` pelo campo "react-native" do
  // package.json, que aponta para o bundle ESM (.mjs). O transform do preset é
  // `\.[jt]sx?$` e não cobre .mjs, então o import dos ícones estoura no Jest com
  // "Unexpected token 'export'". O Metro resolve; o Jest precisa do build CJS.
  // Caminho absoluto de propósito: o campo "exports" do pacote só expõe `.` e
  // `./icons*`, então um subpath relativo não resolve.
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
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
