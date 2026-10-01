import { render } from '@testing-library/react-native';
import Inclinometer from '../app/components/Inclinometer';

interface JsonNode {
  type?: string;
  props?: { content?: unknown; matrix?: unknown };
  children?: unknown;
}

// Coleta os rótulos desenhados dentro do SVG. O testing-library só enxerga
// componentes host do React Native, então a consulta por texto não alcança
// os RNSVGText — o conteúdo fica em `props.content`.
function svgLabels(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => svgLabels(child));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  const { type, props, children } = node as JsonNode;
  const nested = svgLabels(children);
  const content = props?.content;
  const own = content !== null && content !== undefined && nested.length === 0 ? [String(content)] : [];
  if (type === 'RNSVGText' || type === 'RNSVGTSpan') {
    return [...own, ...nested];
  }
  return nested;
}

// Coleta as matrizes aplicadas pelo mostrador — é por elas que dá para
// verificar o giro do anel e o deslize da régua sem depender do pixel final.
// O react-native-svg converte `transform` em `matrix` [a, b, c, d, e, f].
function svgMatrices(node: unknown): number[][] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => svgMatrices(child));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  const { props, children } = node as JsonNode;
  const matrix = props?.matrix;
  const own = Array.isArray(matrix) && matrix.length === 6 ? [matrix as number[]] : [];
  return [...own, ...svgMatrices(children)];
}

// Translação pura é [1, 0, 0, 1, tx, ty]; rotação tem a ≠ 1 ou b ≠ 0.
function svgRotations(node: unknown): number[][] {
  return svgMatrices(node).filter(([a, b]) => a !== 1 || b !== 0);
}

describe('Inclinometer', () => {
  it('desenha o mostrador (SVG) e a legenda', () => {
    const { getByTestId, getByText, toJSON } = render(
      <Inclinometer roll={45} trim={10} testID="inclinometer" />,
    );

    expect(getByTestId('inclinometer')).toBeTruthy();
    expect(getByText('ROLL 45,0°')).toBeTruthy();
    expect(getByText('TRIM 10,0°')).toBeTruthy();

    const labels = svgLabels(toJSON());

    // escala do Roll: 180 aparece uma única vez, no pé do anel; 120 nos dois lados
    expect(labels.filter((label) => label === '180')).toHaveLength(1);
    expect(labels.filter((label) => label === '120')).toHaveLength(2);
    // 90 aparece na escala do Roll (2x) e na régua do Trim (2x, acima e abaixo do centro)
    expect(labels.filter((label) => label === '90')).toHaveLength(4);
  });

  it('formata a leitura com vírgula decimal', () => {
    const { getByText } = render(<Inclinometer roll={0} trim={3.2} />);

    expect(getByText('TRIM 3,2°')).toBeTruthy();
    expect(getByText('ROLL 0,0°')).toBeTruthy();
  });

  it('atualiza a leitura quando os ângulos mudam', () => {
    const { getByText, rerender } = render(<Inclinometer roll={12} trim={4} />);

    expect(getByText('ROLL 12,0°')).toBeTruthy();

    rerender(<Inclinometer roll={90} trim={45} />);

    expect(getByText('ROLL 90,0°')).toBeTruthy();
    expect(getByText('TRIM 45,0°')).toBeTruthy();
  });

  it('gira o anel e desliza a régua nos dois sentidos', () => {
    const direita = render(<Inclinometer roll={45} trim={90} />);
    const esquerda = render(<Inclinometer roll={-45} trim={-90} />);

    expect(direita.getByText('ROLL 45,0°')).toBeTruthy();
    expect(direita.getByText('TRIM 90,0°')).toBeTruthy();
    expect(esquerda.getByText('ROLL -45,0°')).toBeTruthy();
    expect(esquerda.getByText('TRIM -90,0°')).toBeTruthy();

    // Na matriz de rotação b = sen(ângulo): o anel gira para um lado e para o outro.
    expect(svgRotations(direita.toJSON())[0][1]).toBeCloseTo(Math.sin(Math.PI / 4), 6);
    expect(svgRotations(esquerda.toJSON())[0][1]).toBeCloseTo(-Math.sin(Math.PI / 4), 6);

    // A régua do trim desliza os 52 px de curso para baixo e para cima.
    expect(svgMatrices(direita.toJSON())).toContainEqual([1, 0, 0, 1, 0, 52]);
    expect(svgMatrices(esquerda.toJSON())).toContainEqual([1, 0, 0, 1, 0, -52]);
  });
});
