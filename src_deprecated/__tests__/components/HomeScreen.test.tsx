/**
 * Contrato da Home — Medição.
 *
 * O ponto não é o layout (esse é do design system), é a arquitetura: a tela
 * **não** consome o `useInclination`. Se consumisse, haveria dois sensores e dois
 * filtros vivos, e a tela inteira re-renderizaria a 60 Hz junto com o
 * mostrador. Quem lê o sensor e dono de `start`/`stop` é o `Inclinometer`.
 */

import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react-native';
import { TamaguiProvider } from '@tamagui/core';

import { useInclination } from '../../core/hooks/useInclination';
import HomeScreen from '../../app/screens/HomeScreen';
import appConfig from '../../tamagui.config';

jest.mock('../../core/hooks/useInclination', () => ({ useInclination: jest.fn() }));

const mockUseInclination = useInclination as unknown as jest.Mock;

/**
 * A tela vai direto, sem o shell — mas o `ScreenHeader` embaixo dela usa
 * primitivas do Tamagui, que leem o tema de um contexto. No app quem monta esse
 * contexto é o `App.tsx`; aqui ele é reconstruído para que o teste exercite a
 * tela, não a ausência do provider.
 */
function renderHome(ui: ReactElement) {
  return render(<TamaguiProvider config={appConfig} defaultTheme="dark">{ui}</TamaguiProvider>);
}

function mockHook(overrides: Record<string, unknown> = {}) {
  mockUseInclination.mockReturnValue({
    roll: 0,
    trim: 0,
    isRunning: true,
    isCalibrated: false,
    error: null,
    start: jest.fn(async () => {}),
    stop: jest.fn(),
    calibrate: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHook();
});

describe('HomeScreen', () => {
  it('tem o inclinômetro como único consumidor do sensor', () => {
    renderHome(<HomeScreen />);

    // Uma única chamada: a do `Inclinometer`. A tela não pede leitura nenhuma.
    expect(mockUseInclination).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Inclinação. Trim 0,0°, roll 0,0°.')).toBeTruthy();
  });

  it('mostra o erro do sensor, vindo do componente', () => {
    mockHook({ error: 'Sensor não identificado' });
    renderHome(<HomeScreen />);

    expect(screen.getByText('Sensor não identificado')).toBeTruthy();
  });

  it('some com o aviso quando o sensor volta', () => {
    mockHook({ error: 'Falha ao iniciar o sensor' });
    const { rerender } = renderHome(<HomeScreen />);

    mockHook({ error: null });
    rerender(
      <TamaguiProvider config={appConfig} defaultTheme="dark">
        <HomeScreen />
      </TamaguiProvider>,
    );

    expect(screen.queryByText('Falha ao iniciar o sensor')).toBeNull();
  });

  it('abre com o título da tela e sem moldura em volta do mostrador', () => {
    renderHome(<HomeScreen />);

    expect(screen.getByText('Medição')).toBeTruthy();
    expect(screen.getByTestId('inclinometer-roll-scale')).toBeTruthy();
  });
});
