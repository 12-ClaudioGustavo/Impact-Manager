import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const animateStepChange = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const nextStep = () => {
    if (step === 1 && !formData.organizationName.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o nome da organização.');
      return;
    }
    if (step === 2 && !formData.fullName.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o seu nome completo.');
      return;
    }
    animateStepChange(() => setStep(step + 1));
  };

  const prevStep = () => {
    animateStepChange(() => setStep(step - 1));
  };

  const handleSignUp = async () => {
    const { organizationName, fullName, email, password } = formData;

    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos Vazios', 'Por favor, preencha o e-mail e a palavra-passe.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Palavra-passe Fraca', 'A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        Alert.alert('Erro ao Criar Conta', authError.message);
        return;
      }

      if (!authData?.user?.id) {
        Alert.alert('Erro', 'Não foi possível criar a conta de autenticação.');
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: organizationName.trim(),
            email: email.trim().toLowerCase(),
            status: 'active',
            subscription_plan: 'free',
          },
        ])
        .select()
        .single();

      if (orgError) {
        Alert.alert('Erro ao Criar Organização', orgError.message);
        await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error);
        return;
      }

      const { error: userError } = await supabase.from('users').insert([
        {
          auth_id: authData.user.id,
          organization_id: orgData.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: 'admin',
          status: 'active',
        },
      ]);

      if (userError) {
        Alert.alert('Erro ao Criar Perfil', userError.message);
        await supabase.from('organizations').delete().eq('id', orgData.id).catch(console.error);
        await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error);
        return;
      }

      navigation.navigate('EmailVerification', { email: email.trim().toLowerCase() });
      Alert.alert('Conta Criada!', 'Enviamos um código de verificação para o seu e-mail.');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Qual o nome da sua organização?</Text>
            <Input
              value={formData.organizationName}
              onChangeText={(text) => updateFormData('organizationName', text)}
              placeholder="Ex: ONG Esperança"
              icon="business-outline"
              autoFocus
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Como devemos te chamar?</Text>
            <Input
              value={formData.fullName}
              onChangeText={(text) => updateFormData('fullName', text)}
              placeholder="O seu nome completo"
              icon="person-outline"
              autoFocus
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Dados de acesso</Text>
            <Input
              label="E-mail"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="seu.email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />
            <Input
              label="Palavra-passe"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              icon="lock-closed-outline"
            />
          </>
        );
      default:
        return null;
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
            <Ionicons name="person-add-outline" size={64} color="white" />
            <Text style={styles.headerTitle}>Crie a Sua Conta</Text>
            <Text style={styles.headerSubtitle}>Comece a gerir o seu impacto hoje.</Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
            >
              {renderStepContent()}
            </Animated.View>

            <View style={styles.navigationButtons}>
              {step > 1 && (
                <Button
                  title="Voltar"
                  onPress={prevStep}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title={step < 3 ? 'Próximo' : 'Criar Conta'}
                onPress={step < 3 ? nextStep : handleSignUp}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}> Iniciar Sessão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
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
    progressContainer: {
      width: '100%',
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
      marginTop: 24,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: 'white',
      borderRadius: 2,
    },
    formContainer: {
      padding: 24,
      gap: 16,
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    navigationButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
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

export default RegisterScreen;