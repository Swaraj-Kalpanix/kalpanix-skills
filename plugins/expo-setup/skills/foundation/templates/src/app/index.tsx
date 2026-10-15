import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder home route — replace with a feature screen.
export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: '{{APP_NAME}}' }} />
      <Text>{{APP_NAME}}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
