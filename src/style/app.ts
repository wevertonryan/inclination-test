import { StyleSheet } from 'react-native';

// Paleta espelhando as variáveis do protótipo (--bg, --bg-card, ...), adaptada ao tema claro atual.
export const colors = {
  bg: '#ffffff',
  bgElevated: '#f4f6fa',
  bgCard: '#e9edf5',
  border: '#ccd4e2',
  text: '#1b2436',
  textMuted: '#7d8aa6',
  accent: '#f5a623',
  roll: '#f5a623',
  trim: '#4aa3ff',
  danger: '#c0392b',
};

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  navBar: {
    height: 48,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    fontSize: 14,
    color: colors.text,
  },
});

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  error: {
    marginTop: 16,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 13,
    color: colors.danger,
  },
});

export const inclinometerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
