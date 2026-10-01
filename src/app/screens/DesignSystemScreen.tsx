/**
 * Página de demonstração do design system.
 *
 * Página temporária, só para conferir como o "Escuro Instrument" ficou: tokens
 * de cor e tipografia, e a biblioteca de `ui/` em todos os estados. Sai junto
 * com a tab `design` de `navigation/routes.ts` quando as telas reais entrarem.
 */

import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  Bell,
  Check,
  Crosshair,
  FileDown,
  MapPin,
  Radio,
  Search,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react-native';

import { Card } from '../components/layout/Card';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Divider } from '../components/ui/Divider';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { ListRow } from '../components/ui/ListRow';
import { Modal } from '../components/ui/Modal';
import { StatusDot, STATUS_LABEL, type StatusKind } from '../components/ui/StatusDot';
import { Toast } from '../components/ui/Toast';
import {
  colors,
  elevation,
  formatAngle,
  formatDuration,
  formatStopwatch,
  iconSize,
  layout,
  radii,
  spacing,
  tabular,
  typography,
} from '../../style/app';

type ColorToken = keyof typeof colors;

const SURFACE_ROWS: { token: ColorToken; label: string }[] = [
  { token: 'bg', label: 'bg — fundo do app' },
  { token: 'bgElevated', label: 'bgElevated — header e NavBar' },
  { token: 'bgCard', label: 'bgCard — cards e chips' },
  { token: 'bgInput', label: 'bgInput — campos de texto' },
];

const CONTENT_ROWS: { token: ColorToken; label: string; note: string }[] = [
  { token: 'text', label: 'text', note: '≈ 14:1 · AAA' },
  { token: 'textMuted', label: 'textMuted', note: '≈ 5:1 · AA' },
  { token: 'accent', label: 'accent — marca e ação primária', note: '≈ 7:1 · AAA' },
  { token: 'accentStrong', label: 'accentStrong — pressionado/foco', note: '' },
  { token: 'ok', label: 'ok — calibrado, salvo', note: '≈ 6:1 · AAA' },
  { token: 'warn', label: 'warn — alerta (≡ accent)', note: '' },
  { token: 'danger', label: 'danger — erro, excluir', note: '≈ 6:1 · AAA' },
  { token: 'rec', label: 'rec — botão de gravar', note: '≠ danger' },
  { token: 'textFaint', label: 'textFaint — só desabilitado', note: 'nunca informação' },
];

const DOMAIN_ROWS: { token: ColorToken; label: string }[] = [
  { token: 'roll', label: 'roll — série e eixo do anel' },
  { token: 'trim', label: 'trim — série e régua' },
  { token: 'chartGrid', label: 'chartGrid — grade' },
  { token: 'chartAxis', label: 'chartAxis — rótulos de eixo' },
];

const TYPE_ROWS: { role: keyof typeof typography; label: string; sample: string }[] = [
  { role: 'display', label: 'display 40/800', sample: '04:35 · 128' },
  { role: 'title', label: 'title 17/700', sample: 'Medição' },
  { role: 'heading', label: 'heading 16/700', sample: 'Informações' },
  { role: 'body', label: 'body 14/400', sample: 'Abertura em graus (máx − mín)' },
  { role: 'label', label: 'label 13/600', sample: 'Acelerômetro' },
  { role: 'caption', label: 'caption 11/700', sample: 'Nº X Y Z' },
  { role: 'micro', label: 'micro 10/500', sample: 'Calibração' },
];

const STATUSES: StatusKind[] = ['ok', 'uncalibrated', 'calibrating', 'unknown', 'error'];

const ICON_ROWS = [
  { size: 'sm', label: 'sm 14' },
  { size: 'md', label: 'md 16' },
  { size: 'lg', label: 'lg 20' },
  { size: 'xl', label: 'xl 24' },
  { size: 'xxl', label: '2xl 28' },
] as const;

const SPACING_ROWS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;

const RADIUS_ROWS = ['sm', 'md', 'lg', 'pill'] as const;

/** `elevation` é uma união de `ViewStyle` — este alias evita espalhar união. */
const ELEVATIONS: ViewStyle[] = [elevation[1], elevation[2], elevation[3]];

export default function DesignSystemScreen() {
  const [chip, setChip] = useState('7 dias');
  const [text, setText] = useState('');
  const [modal, setModal] = useState(false);
  const [floating, setFloating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <>
      <ScreenHeader
        title="Design"
        right={
          <IconButton
            Icon={Crosshair}
            accessibilityLabel="Ação de header"
            onPress={() => flash('IconButton 48')}
          />
        }
      />

      <ScreenContainer>
        <Section title="Superfície" note="três níveis de elevação · borda hairline de 1px">
          <Card padded={false} style={styles.listCard}>
            {SURFACE_ROWS.map(({ token, label }, index) => (
              <Swatch key={token} token={token} label={label} first={index === 0} />
            ))}
          </Card>
        </Section>

        <Section title="Conteúdo e semântica" note="cor é canal de informação, nunca decoração">
          <Card padded={false} style={styles.listCard}>
            {CONTENT_ROWS.map(({ token, label, note }, index) => (
              <Swatch
                key={token}
                token={token}
                label={label}
                note={note}
                first={index === 0}
              />
            ))}
          </Card>
        </Section>

        <Section title="Domínio" note="fixas — Roll/Trim não acompanham o accent">
          <Card padded={false} style={styles.listCard}>
            {DOMAIN_ROWS.map(({ token, label }, index) => (
              <Swatch key={token} token={token} label={label} first={index === 0} />
            ))}
          </Card>
        </Section>

        <Section title="Tipografia" note="Roboto do sistema · todo número com tabular-nums">
          <Card padded={false} style={styles.listCard}>
            {TYPE_ROWS.map(({ role, label, sample }, index) => (
              <View key={role}>
                {index === 0 ? null : <Divider />}
                <View style={styles.typeRow}>
                  <Text style={styles.meta}>{label}</Text>
                  <Text style={[typography[role], styles.typeSample]} numberOfLines={1}>
                    {sample}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Leitura numérica" note="pt-BR · 1 casa · unidade fora do número · sinal só se negativo">
          <Card style={styles.demoCard}>
            <Numeric label="Ângulo" value={formatAngle(3.2)} tint={colors.roll} />
            <Numeric label="Ângulo negativo" value={formatAngle(-4.1)} tint={colors.roll} />
            <Numeric label="Duração (relatório)" value={formatDuration(275_000)} tint={colors.text} />
            <Numeric label="Cronômetro (gravação)" value={formatStopwatch(275_128)} tint={colors.accent} />
          </Card>
        </Section>

        <Section title="Espaçamento" note="escala base 4">
          <Card>
            <View style={styles.scaleRow}>
              {SPACING_ROWS.map((token) => (
                <View key={token} style={styles.scaleItem}>
                  <View
                    style={[styles.spacingBar, { width: spacing[token], height: spacing[token] }]}
                  />
                  <Text style={styles.meta}>{token}</Text>
                  <Text style={styles.value}>{spacing[token]}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Raios" note="sm 8 · md 12 · lg 16 · pill 999">
          <Card>
            <View style={styles.scaleRow}>
              {RADIUS_ROWS.map((token) => (
                <View key={token} style={styles.scaleItem}>
                  <View
                    style={[
                      styles.radiusBox,
                      { borderRadius: radii[token] },
                      ELEVATIONS[RADIUS_ROWS.indexOf(token)],
                    ]}
                  />
                  <Text style={styles.meta}>{token}</Text>
                  <Text style={styles.value}>{radii[token]}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Elevação" note="elevation 2/6/12 — Android só lê elevation; iOS/web leem shadow*">
          <Card>
            <View style={styles.scaleRow}>
              {([1, 2, 3] as const).map((level) => (
                <View key={level} style={styles.scaleItem}>
                  <View style={[styles.radiusBox, ELEVATIONS[level - 1]]} />
                  <Text style={styles.meta}>elevation.{level}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Ícones · Lucide" note="strokeWidth 2 · currentColor via prop color">
          <Card>
            <View style={styles.scaleRow}>
              {ICON_ROWS.map(({ size, label }) => (
                <View key={size} style={styles.scaleItem}>
                  <Star size={iconSize[size]} color={colors.accent} strokeWidth={2} />
                  <Text style={styles.meta}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Button" note="primary · ghost · danger / sm 32 · md 44 · lg 52 / radius.md">
          <Card style={styles.demoCard}>
            <View style={styles.buttonRow}>
              <Button label="Primário" onPress={() => flash('Primário')} />
              <Button label="Com ícone" icon={Wrench} onPress={() => flash('Com ícone')} />
              <Button label="Carregando" loading onPress={() => {}} />
              <Button label="Desabilitado" disabled onPress={() => {}} />
            </View>
            <View style={styles.buttonRow}>
              <Button variant="ghost" label="Ghost" onPress={() => flash('Ghost')} />
              <Button variant="danger" label="Danger" onPress={() => flash('Danger')} />
            </View>
            <View style={styles.buttonRow}>
              <Button size="sm" label="sm 32" onPress={() => {}} />
              <Button size="md" label="md 44" onPress={() => {}} />
              <Button size="lg" label="lg 52" onPress={() => {}} />
            </View>
            <Button
              fullWidth
              tabularText
              label="Largura total · tempo tabular · 04:35 · 128"
              onPress={() => {}}
            />
          </Card>
        </Section>

        <Section title="IconButton" note="redondo · 48 header · 60 flutuante · pressed = scale 0.94">
          <Card style={styles.demoCard}>
            <View style={styles.buttonRow}>
              <IconButton Icon={Search} accessibilityLabel="Buscar" />
              <IconButton Icon={Bell} accessibilityLabel="Notificações" tone="accent" />
              <IconButton Icon={Check} accessibilityLabel="Calibrado" tone="ok" />
              <IconButton Icon={Trash2} accessibilityLabel="Excluir" tone="danger" />
            </View>
            <View style={styles.buttonRow}>
              <IconButton
                Icon={Wrench}
                accessibilityLabel="Calibrar em 1 clique"
                size={60}
                tone="accent"
              />
              <IconButton Icon={FileDown} accessibilityLabel="Exportar PDF" size={60} />
              <IconButton
                Icon={Radio}
                accessibilityLabel="Sensor ausente"
                size={60}
                disabled
              />
            </View>
          </Card>
        </Section>

        <Section title="Chip" note="radius.pill · bgCard + borda · ativo = accentSoft + borda accent">
          <View style={styles.buttonRow}>
            {['Hoje', '7 dias', '30 dias', 'Todos'].map((label) => (
              <Chip
                key={label}
                label={label}
                active={chip === label}
                onPress={() => setChip(label)}
              />
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Chip label="sm" Icon={MapPin} size="sm" onPress={() => {}} />
            <Chip label="sm ativo" Icon={MapPin} size="sm" active onPress={() => {}} />
            <Chip label="sm desabilitado" size="sm" disabled onPress={() => {}} />
          </View>
        </Section>

        <Section title="StatusDot" note="18px com ícone 14px · cor isolada é proibida">
          <Card padded={false} style={styles.listCard}>
            {STATUSES.map((status, index) => (
              <View key={status}>
                {index === 0 ? null : <Divider />}
                <View style={styles.statusRow}>
                  <StatusDot status={status} />
                  <Text style={styles.bodyText}>{STATUS_LABEL[status]}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Input" note="bgInput mais fundo que o card · foco = borda accent · erro = danger">
          <Card style={styles.demoCard}>
            <Input
              label="Título do registro"
              placeholder="Prova de Mar — Convés"
              value={text}
              onChangeText={setText}
            />
            <Input label="Com busca" Icon={Search} placeholder="Buscar por título ou local" />
            <Input label="Com erro" defaultValue="—" error="Campo obrigatório" />
            <Input label="Numérico" placeholder="0" numeric />
          </Card>
        </Section>

        <Section title="ListRow" note="sem card próprio · padding 12/16 · divisor border entre linhas">
          <Card padded={false} style={styles.listCard}>
            <ListRow
              Icon={Radio}
              title="Acelerômetro"
              subtitle="DeviceMotion"
              right={<StatusDot status="ok" />}
              onPress={() => flash('Acelerômetro')}
              first
            />
            <ListRow
              Icon={Radio}
              title="Giroscópio"
              subtitle="Não identificado"
              right={<StatusDot status="unknown" />}
              onPress={() => flash('Giroscópio')}
            />
            <ListRow
              Icon={Radio}
              title="Magnetômetro"
              subtitle="Calibrando"
              right={<StatusDot status="calibrating" />}
              onPress={() => flash('Magnetômetro')}
            />
          </Card>
        </Section>

        <Section title="EmptyState" note="ícone 40 textFaint · título label · descrição body textMuted">
          <Card>
            <EmptyState
              Icon={FileDown}
              title="Nenhum relatório encontrado"
              description="Ajuste a busca ou limpe os filtros para ver os registros salvos."
              action={<Button variant="ghost" label="Limpar filtros" onPress={() => {}} />}
            />
          </Card>
        </Section>

        <Section title="Modal" note="entrada motion.base · saída motion.exit · bgElevated · maxWidth 340">
          <Card style={styles.demoCard}>
            <View style={styles.buttonRow}>
              <Button label="Com backdrop" onPress={() => setModal(true)} />
              <Button
                variant="ghost"
                label="Card flutuante"
                onPress={() => setFloating(true)}
              />
            </View>
            <Button
              fullWidth
              variant="danger"
              icon={Trash2}
              label="Ação destrutiva"
              onPress={() => setModal(true)}
            />
          </Card>
        </Section>

        <Section
          title="Toast"
          note="acima da NavBar · radius.md · some sozinho em 2s com motion.exit"
        >
          <Card style={styles.demoCard}>
            <Toast message="PDF exportado" tone="ok" autoHide={false} />
            <Toast message="Sensor não identificado" tone="danger" autoHide={false} />
            <View style={styles.buttonRow}>
              <Button
                variant="ghost"
                label="Disparar toast"
                onPress={() => flash('PDF exportado')}
              />
            </View>
          </Card>
        </Section>

        <Section
          title="Área flutuante"
          note={`appStyles.floating — sobreposta à Screen, ${layout.navHeight}px acima da NavBar`}
        >
          <Card style={styles.demoCard}>
            <View style={styles.buttonRow}>
              <IconButton Icon={Crosshair} accessibilityLabel="Calibrar" size={60} tone="accent" />
              <IconButton Icon={Check} accessibilityLabel="Salvar" size={60} tone="ok" />
              <IconButton Icon={Trash2} accessibilityLabel="Cancelar" size={60} tone="danger" />
            </View>
            {toast ? <Toast message={toast} tone="ok" autoHide={false} /> : null}
          </Card>
        </Section>
      </ScreenContainer>

      <Modal
        visible={modal}
        onClose={() => setModal(false)}
        title="Excluir relatório?"
        description="Esta ação não pode ser desfeita."
      >
        <View style={styles.buttonRow}>
          <Button variant="ghost" label="Voltar" onPress={() => setModal(false)} />
          <Button variant="danger" label="Excluir" onPress={() => setModal(false)} />
        </View>
      </Modal>

      <Modal
        visible={floating}
        backdrop={false}
        dismissible
        onClose={() => setFloating(false)}
        title="Acelerômetro"
        description="Calibrado às 14:32. Toque fora para fechar."
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Blocos auxiliares da própria página de demonstração
// ---------------------------------------------------------------------------

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Swatch({
  token,
  label,
  note,
  first,
}: {
  token: ColorToken;
  label: string;
  note?: string;
  first?: boolean;
}) {
  return (
    <View>
      {first ? null : <Divider />}
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: colors[token] }]} />
        <View style={styles.swatchText}>
          <Text style={styles.bodyText}>{label}</Text>
          <Text style={styles.value}>{colors[token]}</Text>
        </View>
        {note ? <Text style={styles.swatchNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

function Numeric({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={styles.numericRow}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={[styles.numericValue, tabular, { color: tint }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.s4,
  },
  sectionHead: {
    gap: spacing.s1,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionNote: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.textMuted,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.micro,
    ...tabular,
    color: colors.textFaint,
  },
  bodyText: {
    ...typography.label,
    color: colors.text,
  },

  listCard: {
    paddingVertical: spacing.s1,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    paddingVertical: spacing.s3,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchText: {
    flex: 1,
    gap: spacing.s1,
  },
  swatchNote: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'right',
    maxWidth: 110,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s4,
    paddingVertical: spacing.s3,
  },
  typeSample: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },

  numericRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.s4,
  },
  numericValue: {
    ...typography.display,
    color: colors.text,
  },

  scaleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  scaleItem: {
    alignItems: 'center',
    gap: spacing.s1,
    flex: 1,
  },
  spacingBar: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
  },
  radiusBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },

  demoCard: {
    gap: spacing.s4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.s3,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    paddingVertical: spacing.s3,
  },
});