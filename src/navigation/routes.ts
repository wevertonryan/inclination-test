/**
 * Fonte única das rotas (`DESIGN.md` §7.2).
 *
 * `App.tsx` e `NavBar` consomem esta lista — nenhum dos dois declara tabs por
 * conta própria. Navegação é por estado, sem biblioteca: `ScreenId` aqui, o
 * `useState` que decide a tela mora no shell.
 */

import type { LucideIcon } from 'lucide-react-native';
import {
  ClipboardCheck,
  Crosshair,
  FileText,
  House,
  Palette,
  Settings,
} from 'lucide-react-native';

export type ScreenId =
  | 'home'
  | 'calibration'
  | 'reports'
  | 'reportDetail'
  | 'integrity'
  | 'settings'
  | 'design';

export interface Tab {
  readonly id: ScreenId;
  readonly label: string;
  readonly Icon: LucideIcon;
}

/**
 * `design` é uma tab temporária, só para navegar na página de demonstração do
 * design system. Sai daqui junto com a `DesignSystemScreen`.
 */
export const TABS: readonly Tab[] = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'calibration', label: 'Calibração', Icon: Crosshair },
  { id: 'reports', label: 'Relatórios', Icon: FileText },
  { id: 'integrity', label: 'Testes', Icon: ClipboardCheck },
  { id: 'settings', label: 'Ajustes', Icon: Settings },
  { id: 'design', label: 'Design', Icon: Palette },
] as const;

/** Telas fora das tabs: a NavBar some enquanto elas estiverem ativas. */
export const SCREENS_WITHOUT_NAV_BAR: readonly ScreenId[] = ['reportDetail'] as const;

export function showsNavBar(screen: ScreenId): boolean {
  return !SCREENS_WITHOUT_NAV_BAR.includes(screen);
}