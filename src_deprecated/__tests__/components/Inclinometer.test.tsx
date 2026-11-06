/**
 * Contrato do `Inclinometer` — o único consumidor do `useInclination`.
 *
 * O `useInclination` é mockado: o que está em teste aqui é o **componente**, e
 * o contrato do hook já é coberto em `__tests__/core/useInclination.test.ts`.
 * Otimização é o maior teste deste arquivo: nenhum elemento de SVG pode ser
 * recriado quando `roll`/`trim` mudam, e nenhuma amostra pode passar por estado
 * ou prop — só por `setValue` no `Animated.Value` nativo.
 */

import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

import { useInclination } from '../../core/hooks/useInclination';
import { colors, formatAngle } from '../../style/app';
import Inclinometer, { DOT_TEST_ID, TRIM_TRAVEL } from '../../app/components/features/Inclinometer';

/**
 * Contador de renders por elemento de SVG.
 *
 * O `react-native-svg` é mockado por componentes que contam quantas vezes foram
 * renderizados. É o que permite afirmar o contrato de otimização: a geometria
 * estática é montada uma vez, e mudar `roll`/`trim` não pode redesenhá-la.
 */
const renders: Record<string, number> = {};

jest.mock('react-native-svg', () => {
  // `require` dentro da factory: o hoist do `jest.mock` só deixa passar globais,
  // então nada importado no topo do arquivo pode ser usado aqui.
  const { createElement } = require('react') as typeof import('react');

  const tracked = (name: string) => {
    const Component = (props: Record<string, unknown>) => {
      renders[name] = (renders[name] ?? 0) + 1;
      return createElement(name, props, props.children as ReactNode);
    };
    Component.displayName = name;
    return Component;
  };

  return {
    __esModule: true,
    default: tracked('Svg'),
    Circle: tracked('Circle'),
    G: tracked('G'),
    Line: tracked('Line'),
    Path: tracked('Path'),
    Rect: tracked('Rect'),
    Text: tracked('SvgText'),
  };
});

jest.mock('../../core/hooks/useInclination', () => ({ useInclination: jest.fn() }));

const mockUseInclination = useInclination as unknown as jest.Mock;

type HookState = ReturnType<typeof makeState>;

function makeState(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    roll: 0,
    trim: 0,
    isRunning: true,
    isCalibrated: false,
    error: null as string | null,
    start: jest.fn(async () => {}),
    stop: jest.fn(),
    calibrate: jest.fn(),
    ...overrides,
  };
}

function mockHook(state: HookState) {
  mockUseInclination.mockReturnValue(state);
}

/** Emite uma amostra nova, como o `useInclination` faria a 60 Hz. */
function sample(roll: number, trim: number) {
  const state = makeState({ roll, trim });
  mockHook(state);
  return state;
}

let setValueSpy: jest.SpyInstance;
let interpolateSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(renders)) delete renders[key];
  mockHook(makeState());
  setValueSpy = jest.spyOn(Animated.Value.prototype, 'setValue');
  interpolateSpy = jest.spyOn(Animated.Value.prototype, 'interpolate');
});

afterEach(() => {
  setValueSpy.mockRestore();
  interpolateSpy.mockRestore();
});

/**
 * Últimos dois valores publicados nos `Animated.Value` do componente: `[roll, trim]`.
 *
 * É a prova de que a amostra chega ao grafo animado nativo por `setValue`, e não
 * por estado ou prop — o caminho que evita re-renderizar a tela.
 */
function publishedAngles(): unknown[] {
  const calls = setValueSpy.mock.calls;
  return [calls.at(-2)?.[0], calls.at(-1)?.[0]];
}

/** Estilo de um elemento da árvore. */
function styleOf(testID: string): ViewStyle {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style as ViewStyle) ?? {};
}

/** Nó animado do grafo nativo, com o par de métodos internos que o teste usa. */
type AnimatedInterpolation = Animated.AnimatedInterpolation<number | string> & {
  _parent: NativeValue;
};

type NativeValue = Animated.Value & {
  __isNative: boolean;
  __getValue: () => number;
};

/**
 * Por que o teste lê o nó animado, e não o valor na árvore.
 *
 * As camadas ficam num `useMemo`, então o React nunca re-renderiza aquele
 * subárvore: o `style` visível no teste é o do primeiro render e não muda com as
 * amostras. Esse é justamente o contrato de otimização — na aplicação quem
 * aplica o valor é o grafo animado nativo, sem render nenhum. Para então
 * observar o ângulo, o teste localiza a `AnimatedInterpolation` criada pelo
 * componente e a avalia com `__getValue()`.
 */

/** `Animated.Value` do eixo indicado (`0` = roll, `1` = trim). */
function angleValue(axis: 0 | 1): NativeValue {
  return interpolateSpy.mock.results[axis].value._parent as NativeValue;
}

/** Empurra um ângulo direto para o valor animado, como a UI thread receberia. */
function pushAngle(axis: 0 | 1, value: number) {
  angleValue(axis).setValue(value);
}

/** Valor que a interpolação do eixo mostra para o ângulo atual. */
function interpolatedAngle(axis: 0 | 1): number | string {
  return interpolateSpy.mock.results[axis].value.__getValue() as number | string;
}

/** Entrada de `transform` de uma camada, já resolvida para o ângulo da montagem. */
function transformEntry(testID: string, key: 'rotate' | 'translateY') {
  const transforms = (styleOf(testID).transform ?? []) as unknown as Record<string, unknown>[];
  const entry = transforms.find((t) => key in t);
  if (!entry) throw new Error(`nenhuma transformação "${key}" em ${testID}`);
  return entry;
}

// ---------------------------------------------------------------------------
// Contrato com o core
// ---------------------------------------------------------------------------

describe('Inclinometer · sensor', () => {
  it('liga o sensor ao montar e desliga ao desmontar', () => {
    const { unmount } = render(<Inclinometer />);
    expect(mockUseInclination().start).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockUseInclination().stop).toHaveBeenCalledTimes(1);
  });

  it('repassa o erro do core e o limpa quando ele some', () => {
    const onError = jest.fn();
    mockHook(makeState({ error: 'Sensor não identificado' }));
    const { rerender } = render(<Inclinometer onError={onError} />);
    expect(onError).toHaveBeenLastCalledWith('Sensor não identificado');

    mockHook(makeState({ error: null }));
    rerender(<Inclinometer onError={onError} />);
    expect(onError).toHaveBeenLastCalledWith(null);
  });

  it('não quebra sem o onError', () => {
    mockHook(makeState({ error: 'qualquer' }));
    expect(() => render(<Inclinometer />)).not.toThrow();
  });

  it('é a única fonte de roll/trim: não aceita ângulo por prop', () => {
    // O ângulo vem do core, nunca de prop — é o que impede a tela de re-renderizar.
    sample(12, -4);
    render(<Inclinometer />);

    expect(publishedAngles()).toEqual([12, -4]);
    expect(angleValue(0).__getValue()).toBe(12);
    expect(angleValue(1).__getValue()).toBe(-4);
  });

  it('publica cada amostra direto no valor animado, sem passar por estado', () => {
    // É o contrato de otimização: a amostra vira `setValue` no `Animated.Value`.
    // Se alguém passar a renderizar a rotação como estado/prop, este teste avisa.
    render(<Inclinometer />);

    for (const [roll, trim] of [
      [7.5, 2],
      [-31.25, -18],
      [180, 90],
    ]) {
      sample(roll, trim);
      screen.rerender(<Inclinometer />);
      expect(publishedAngles()).toEqual([roll, trim]);
    }
  });

  it('cria os valores no driver nativo, para o movimento ficar na UI thread', () => {
    render(<Inclinometer />);

    // Se alguém voltar ao driver JS, o movimento passa a depender do JS thread
    // e este teste falha.
    expect(angleValue(0).__isNative).toBe(true);
    expect(angleValue(1).__isNative).toBe(true);
  });

  it('mantém as camadas animadas intactas a cada amostra', () => {
    render(<Inclinometer />);
    const rollEntry = { ...transformEntry('inclinometer-roll-scale', 'rotate') };
    const trimEntry = { ...transformEntry('inclinometer-trim-ruler', 'translateY') };

    for (const [roll, trim] of [
      [15, 8],
      [-22, -11],
      [90, -45],
    ]) {
      sample(roll, trim);
      screen.rerender(<Inclinometer />);
    }

    // Subárvore intocada: se a camada fosse recriada a cada amostra, o React
    // gastaria o frame reconciliando o mostrador inteiro.
    expect(transformEntry('inclinometer-roll-scale', 'rotate')).toEqual(rollEntry);
    expect(transformEntry('inclinometer-trim-ruler', 'translateY')).toEqual(trimEntry);
  });
});

// ---------------------------------------------------------------------------
// Semântica do mostrador
// ---------------------------------------------------------------------------

describe('Inclinometer · leitura do anel', () => {
  it('gira o anel com o roll, em graus, com sinal', () => {
    render(<Inclinometer />);

    pushAngle(0, 30);
    expect(interpolatedAngle(0)).toBe('30deg');

    pushAngle(0, -30);
    expect(interpolatedAngle(0)).toBe('-30deg');
  });

  it('satura o roll em ±180', () => {
    render(<Inclinometer />);

    pushAngle(0, 400);
    expect(interpolatedAngle(0)).toBe('180deg');

    pushAngle(0, -400);
    expect(interpolatedAngle(0)).toBe('-180deg');
  });

  it('trata ângulo não finito como zero', () => {
    sample(Number.NaN, Number.NaN);
    render(<Inclinometer />);

    expect(publishedAngles()).toEqual([0, 0]);
    expect(angleValue(0).__getValue()).toBe(0);
    expect(interpolatedAngle(0)).toBe('0deg');
    expect(interpolatedAngle(1)).toBe(0);
  });
});

describe('Inclinometer · leitura da régua', () => {
  it('desliza a régua com o trim, proporcionalmente', () => {
    render(<Inclinometer />);

    pushAngle(1, 90);
    expect(interpolatedAngle(1)).toBeCloseTo(TRIM_TRAVEL, 5);

    pushAngle(1, 45);
    expect(interpolatedAngle(1)).toBeCloseTo(TRIM_TRAVEL / 2, 5);

    pushAngle(1, -45);
    expect(interpolatedAngle(1)).toBeCloseTo(-TRIM_TRAVEL / 2, 5);
  });

  it('satura o trim em ±90 (proa para cima desloca a régua para baixo)', () => {
    render(<Inclinometer />);

    pushAngle(1, 120);
    expect(interpolatedAngle(1)).toBeCloseTo(TRIM_TRAVEL, 5);

    pushAngle(1, -120);
    expect(interpolatedAngle(1)).toBeCloseTo(-TRIM_TRAVEL, 5);
  });

  it('mantém a linha de índice fixa — é por ela que se lê o trim', () => {
    sample(0, 40);
    render(<Inclinometer />);

    // A referência da leitura não pode se mover com a régua.
    expect(styleOf('inclinometer-trim-index').transform).toBeUndefined();
  });

  it('separa os dois eixos: o anel gira em graus e a régua desliza em pixels', () => {
    sample(30, 40);
    render(<Inclinometer />);

    // `rotate` exige string com unidade; `translateY`, número. Se as camadas
    // trocassem de eixo, um destes tipos viraria errado.
    expect(typeof transformEntry('inclinometer-roll-scale', 'rotate').rotate).toBe('string');
    expect(typeof transformEntry('inclinometer-trim-ruler', 'translateY').translateY).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Otimização — o teste que trava a promessa do componente
// ---------------------------------------------------------------------------

describe('Inclinometer · performance', () => {
  it('monta a geometria estática uma única vez', () => {
    render(<Inclinometer />);

    // 38 ticks de roll (2 lados × 19) + 19 da régua (zero + ±10..90) + o índice fixo
    expect(renders.Line).toBe(38 + 19 + 1);
    // 11 rótulos de roll (180 só embaixo, 0 só no ponteiro) + 6 da régua (30/60/90 × 2)
    expect(renders.SvgText).toBe(11 + 6);
    expect(renders.Circle).toBe(2);
    expect(renders.Rect).toBe(1);
    expect(renders.Path).toBe(2);
    expect(renders.Svg).toBe(4);
  });

  it('não redesenha nenhum elemento de SVG quando o ângulo muda', () => {
    render(<Inclinometer />);
    const baseline = { ...renders };

    for (const [roll, trim] of [
      [15, 8],
      [-22, -11],
      [90, -45],
      [0, 0],
    ]) {
      sample(roll, trim);
      screen.rerender(<Inclinometer />);
    }

    expect(renders).toEqual(baseline);
  });

  it('atualiza a legenda a 60 Hz, sem reconstruir o mostrador', () => {
    render(<Inclinometer />);
    const baseline = { ...renders };

    sample(12.34, -5.67);
    screen.rerender(<Inclinometer />);

    expect(screen.getByText(`ROLL ${formatAngle(12.34)}`)).toBeTruthy();
    expect(screen.getByText(`TRIM ${formatAngle(-5.67)}`)).toBeTruthy();
    expect(renders).toEqual(baseline);
  });
});

// ---------------------------------------------------------------------------
// Acessibilidade
// ---------------------------------------------------------------------------

describe('Inclinometer · leitura por texto', () => {
  it('formata os ângulos em pt-BR com 1 casa e sinal só quando negativo', () => {
    sample(3.24, -4.1);
    render(<Inclinometer />);

    expect(screen.getByText('ROLL 3,2°')).toBeTruthy();
    expect(screen.getByText('TRIM −4,1°')).toBeTruthy();
  });

  it('expõe os dois ângulos num único rótulo acessível, junto do nome do eixo', () => {
    sample(12.5, -3.25);
    render(<Inclinometer />);

    const dial = screen.getByLabelText('Inclinação. Trim −3,3°, roll 12,5°.');
    expect(dial.props.accessibilityRole).toBe('image');
  });

  it('usa número tabular, para o valor não pular a 60 Hz', () => {
    render(<Inclinometer />);
    const [trim] = screen.getAllByText(/°$/);

    expect(StyleSheet.flatten(trim.props.style)).toMatchObject({
      fontVariant: ['tabular-nums'],
    });
  });

  it('distingue trim (azul) de roll (âmbar) na legenda', () => {
    render(<Inclinometer />);
    const dots = screen.getAllByTestId(DOT_TEST_ID);

    expect(dots.map((dot) => StyleSheet.flatten(dot.props.style).backgroundColor)).toEqual([
      colors.trim,
      colors.roll,
    ]);
  });
});
