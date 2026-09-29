import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { appStyles } from './style/app';
import HomeScreen from './app/screens/HomeScreen';

export default function App() {
  return (
    <View style={appStyles.container}>
      <StatusBar style="auto" />
      <View style={appStyles.header}>
        <Text style={appStyles.headerTitle}>Inclination Test</Text>
      </View>
      <View style={appStyles.content}>
        <HomeScreen />
      </View>
      <View style={appStyles.navBar}>
        <Text style={appStyles.navItem}>Home</Text>
      </View>
    </View>
  );
}
