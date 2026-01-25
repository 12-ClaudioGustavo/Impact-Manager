import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const HelpScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const faqItems = [
    {
      question: 'Como adicionar um novo membro?',
      answer: 'Vá até a aba "Membros" e clique no botão "+" no canto inferior direito, ou use o atalho "Novo Membro" na tela inicial.'
    },
    {
      question: 'Como registrar uma doação?',
      answer: 'Na aba "Doações", clique no botão "+" ou use o atalho "Registrar Doação" na tela inicial.'
    },
    {
      question: 'Posso exportar os relatórios?',
      answer: 'Ainda estamos trabalhando nessa funcionalidade. Em breve você poderá exportar relatórios em PDF e Excel.'
    },
    {
      question: 'Como altero minha senha?',
      answer: 'Atualmente a alteração de senha deve ser feita através do processo de "Esqueci minha senha" na tela de login.'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda e FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
        
        {faqItems.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Ainda precisa de ajuda?</Text>
          <Text style={styles.contactText}>Entre em contato com nosso suporte técnico.</Text>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:suporte@myapp.com')}
          >
            <Ionicons name="mail" size={20} color={theme.textOnPrimary} />
            <Text style={styles.contactButtonText}>Enviar E-mail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: theme.backgroundCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: theme.textOnPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HelpScreen;
