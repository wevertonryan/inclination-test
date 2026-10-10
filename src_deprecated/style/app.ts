/**
 * Estilo do shell do app — a entrada única do design system.
 *
 * `theme.ts` guarda os tokens (cor, espaçamento, raio, tipografia, elevação,
 * movimento, ícones) e este arquivo os reexporta, para que qualquer camada
 * importe o design de um lugar só:
 *
 * ```ts
 * import { colors, spacing, typography, appStyles } from '../../style/app';
 * ```
 *
 * `appStyles` cobre apenas a casca estrutural de `App.tsx` (§7.1): o container,
 * a área da Screen e a área flutuante acima da NavBar. Cada componente tem seu
 * próprio `StyleSheet` — nada de estilo espalhado pelo app.
 */

import { StyleSheet } from 'react-native';

import { colors, layout, spacing } from './theme';

export * from './theme';

export const appStyles = StyleSheet.create({
  /** Raiz do app: fundo do canvas, com a safe-area do sistema. */
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  /** Área da Screen. A NavBar é irmã dela, nunca filha. */
  screen: {
    flex: 1,
  },
  /**
   * Área flutuante: botão de gravar, toast e demais controles sobrepostos.
   * Fica no fim da ordem flex para sobrepor a área da Screen, com o
   * `paddingBottom` da NavBar para nunca ficar sob a barra.
   */
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: layout.navHeight + spacing.s5,
    alignItems: 'center',
  },
});