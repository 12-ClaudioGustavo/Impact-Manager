import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const AdBanner = () => {
  const { theme } = useTheme();
  const { profile } = useAuth();

  // Só mostra o anúncio se o utilizador for do plano 'free'
  if (profile?.subscription_tier !== 'free') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryLight }]}>
      <Ionicons name="rocket" size={24} color={theme.primary} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>Passe para o Pro!</Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>Remova os anúncios e tenha mais funcionalidades.</Text>
      </View>
      <TouchableOpacity>
        <Ionicons name="close-circle" size={24} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 12,
  },
});

export default AdBanner;
