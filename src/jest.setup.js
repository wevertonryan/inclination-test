/**
 * Setup global do Jest.
 *
 * `react-native-safe-area-context` mede a safe area chamando código nativo
 * (`RNCSafeAreaProvider`), que não existe no ambiente de teste: sem mock,
 * qualquer componente que use `useSafeAreaInsets` estoura. O próprio pacote
 * entrega o mock oficial — usá-lo em vez de escrever um mantém os testes
 * alinhados com o que o app vê em runtime.
 *
 * Detalhe do mock oficial que já custou um bug: ele é um `export default`, então
 * `require(...)` devolve o namespace do módulo (`{ default }`), não o objeto de
 * exports. Devolver o namespace faz `useSafeAreaInsets` ser `undefined` em vez
 * de ausente — o sintoma é "is not a function", que não aponta para o mock.
 *
 * Os insets do mock são fixos em zero, o caso de um device sem notch.
 */

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);