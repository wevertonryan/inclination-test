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
  // Mesma classe do Lucide, mas com a solução oposta: o campo "exports" do
  // `tamagui` resolve no Jest para `dist/esm/index.native.js`, e o build CJS
  // (`dist/cjs`) exige `react-native-web`, que não faz sentido num app Android.
  // Então em vez de remapear para um caminho, deixa o babel transformar o ESM.
  // A lista é a do preset do jest-expo com `tamagui`, `@tamagui` e
  // `react-native-safe-area-context` acrescentados ao lookahead (o pacote raiz
  // não tem escopo no diretório do node_modules). O último precisa entrar
  // porque o mock oficial do safe-area é `.tsx` dentro de node_modules — sem
  // transform, o `jest.setup.js` não consegue importá-lo.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|tamagui|@tamagui|react-native-safe-area-context))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
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
