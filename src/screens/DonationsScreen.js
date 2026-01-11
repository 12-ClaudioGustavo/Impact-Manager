import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DonationsScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Ionicons name="heart" size={80} color="#10B981" />
      <Text style={styles.title}>Doações</Text>
      <Text style={styles.subtitle}>Em desenvolvimento...</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 8,
  },
});

export default DonationsScreen;
