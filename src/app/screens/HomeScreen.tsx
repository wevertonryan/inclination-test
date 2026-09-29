import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useInclination } from '../../core/hooks/useInclination';
import { homeStyles } from '../../style/app';
import Inclinometer from '../components/Inclinometer';

export default function HomeScreen() {
  const { roll, trim, error, start } = useInclination();

  useEffect(() => {
    void start();
  }, [start]);

  return (
    <View style={homeStyles.container}>
      <Inclinometer roll={roll} trim={trim} />
      {error !== null && <Text style={homeStyles.error}>{error}</Text>}
    </View>
  );
}
