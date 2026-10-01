/**
 * Contrato da Home — Medição.
 *
 * O ponto não é o layout (esse é do design system), é a arquitetura: a tela
 * **não** consome o `useInclination`. Se consumisse, haveria dois sensores e dois
 * filtros vivos, e a tela inteira re-renderizaria a 60 Hz junto com o
 * mostrador. Quem lê o sensor e dono de `start`/`stop` é o `Inclinometer`.
 */

import { render, screen } from '@testing-library/react-native';

import { useInclination } from '../../core/hooks/useInclination';
import HomeScreen from '../../app/screens/HomeScreen';

jest.mock('../../core/hooks/useInclination', () => ({ useInclination: jest.fn() }));

const mockUseInclination = useInclination as unknown as jest.Mock;

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
    render(<HomeScreen />);

    // Uma única chamada: a do `Inclinometer`. A tela não pede leitura nenhuma.
    expect(mockUseInclination).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Inclinação. Trim 0,0°, roll 0,0°.')).toBeTruthy();
  });

  it('mostra o erro do sensor, vindo do componente', () => {
    mockHook({ error: 'Sensor não identificado' });
    render(<HomeScreen />);

    expect(screen.getByText('Sensor não identificado')).toBeTruthy();
  });

  it('some com o aviso quando o sensor volta', () => {
    mockHook({ error: 'Falha ao iniciar o sensor' });
    const { rerender } = render(<HomeScreen />);

    mockHook({ error: null });
    rerender(<HomeScreen />);

    expect(screen.queryByText('Falha ao iniciar o sensor')).toBeNull();
  });

  it('abre com o título da tela e sem moldura em volta do mostrador', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Medição')).toBeTruthy();
    expect(screen.getByTestId('inclinometer-roll-scale')).toBeTruthy();
  });
});
