import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // URL da imagem de fundo escolhida. Representa união e comunidade.
  const backgroundImage = { uri: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' };

  return (
    <ImageBackground source={backgroundImage} style={styles.background}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Impact Manager</Text>
            <Text style={styles.subtitle}>
              Organize a sua comunidade, gira os seus membros, e maximize o seu impacto social, tudo num só lugar.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => navigation.navigate('Register')}
            >
              <Ionicons name="rocket-outline" size={20} color={theme.textOnPrimary} />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Comece Agora</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Iniciar Sessão</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const getStyles = (theme) => StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // Sobreposição escura para legibilidade
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Alinha todo o conteúdo ao fundo
    padding: 24,
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16, // Espaço entre os botões
  },
  button: {
    flex: 1, // Faz os botões dividirem o espaço
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: theme.textOnPrimary,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
});

export default WelcomeScreen;
