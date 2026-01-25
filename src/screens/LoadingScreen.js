import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const LoadingScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  return (
    <LinearGradient colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.success, theme.successLight]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={40} color={theme.textOnPrimary} />
        </View>
        <ActivityIndicator size="large" color={theme.textOnPrimary} />
      </View>
    </LinearGradient>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});

export default LoadingScreen;
