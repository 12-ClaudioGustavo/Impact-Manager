import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos Vazios", "Por favor, preencha o e-mail e a palavra-passe.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Erro de Login', 'O e-mail ou a palavra-passe estão incorretos.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
            <Ionicons name="log-in-outline" size={64} color="white" />
            <Text style={styles.headerTitle}>Bem-vindo de Volta!</Text>
            <Text style={styles.headerSubtitle}>Inicie sessão para continuar.</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu.email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Palavra-passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Digite a sua palavra-passe"
              secureTextEntry
            />
            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 20 }}
            />
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}> Crie uma agora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 4,
  },
  formContainer: {
    padding: 24,
    gap: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen; 