import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const AboutScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon-removebg-preview.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.appName}>Gestão de Organizações</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.description}>
            Este aplicativo foi desenvolvido para facilitar a gestão de pequenas organizações, igrejas e ONGs.
            Gerencie membros, doações e eventos de forma simples e eficiente.
          </Text>

          <View style={styles.linksContainer}>
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://myapp.com/terms')}>
              <Text style={styles.linkText}>Termos de Uso</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconColorLight} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://myapp.com/privacy')}>
              <Text style={styles.linkText}>Política de Privacidade</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconColorLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 C-Space Technologies.</Text>
          <Text style={styles.footerText}>Todos os direitos reservados.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.backgroundCard,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  infoContainer: {
    marginVertical: 40,
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  linksContainer: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkText: {
    fontSize: 16,
    color: theme.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: theme.textLight,
  },
});

export default AboutScreen;
