import { Text, View } from 'react-native';
import { inclinometerStyles } from '../../style/app';

export interface InclinometerProps {
  roll: number;
  trim: number;
}

function formatDeg(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}°`;
}

export default function Inclinometer({ roll, trim }: InclinometerProps) {
  return (
    <View style={inclinometerStyles.readout}>
      <View style={inclinometerStyles.row}>
        <Text style={[inclinometerStyles.label, inclinometerStyles.rollColor]}>ROLL</Text>
        <Text style={[inclinometerStyles.value, inclinometerStyles.rollColor]}>
          {formatDeg(roll)}
        </Text>
      </View>
      <View style={inclinometerStyles.row}>
        <Text style={[inclinometerStyles.label, inclinometerStyles.trimColor]}>TRIM</Text>
        <Text style={[inclinometerStyles.value, inclinometerStyles.trimColor]}>
          {formatDeg(trim)}
        </Text>
      </View>
    </View>
  );
}
