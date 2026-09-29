import { StyleSheet } from 'react-native';

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderTopColor: '#ddd',
  },
  navItem: {
    fontSize: 14,
    color: '#333',
  },
});

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 16,
    paddingHorizontal: 24,
    textAlign: 'center',
    fontSize: 13,
    color: '#c0392b',
  },
});

export const inclinometerStyles = StyleSheet.create({
  readout: {
    alignItems: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
  },
  value: {
    fontSize: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  rollColor: {
    color: '#f5a623',
  },
  trimColor: {
    color: '#4aa3ff',
  },
});
