import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Notificações</Text>
      <View style={styles.content}>
        <Text style={{ color: theme.textSecondary }}>Ainda não há notificações.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }
});

export default NotificationsScreen;
