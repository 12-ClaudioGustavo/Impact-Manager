import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions, 
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const { email, password } = formData;

    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um e-mail válido");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (error) {
        console.error("❌ Erro ao fazer login:", error);
        Alert.alert("Erro ao fazer login", error.message);
        return;
      }

      if (!data.user.email_confirmed_at) {
        Alert.alert(
          "Email Não Confirmado",
          "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.",
          [
            {
              text: "Reenviar Email",
              onPress: () => {
                supabase.auth.signOut();
                navigation.navigate("EmailVerification", {
                  email: formData.email.trim().toLowerCase(),
                });
              },
            },
            {
              text: "OK",
              onPress: () => {
                supabase.auth.signOut();
              },
            },
          ],
        );
        return;
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao fazer login:", error);
      Alert.alert("Erro", "Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
          colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Image
                source={require("../../assets/icon-removebg-preview.png")}
                style={{ width: 60, height: 60, marginRight: 16 }}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Bem-vindo!</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Entre para continuar gerenciando sua organização
            </Text>
          </View>

          <View style={styles.glassContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.iconColorLight} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={formData.email}
                  onChangeText={(text) => updateFormData("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.iconColorLight}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={formData.password}
                  onChangeText={(text) => updateFormData("password", text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.iconColorLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryDark} />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.socialContainer}>
              <Text style={styles.socialText}>Ou entre com</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.registerLink}>
              <Text style={styles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLinkText}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ao entrar, você concorda com nossos{"\n"}
              <Text style={styles.footerBold}>Termos de Serviço</Text> e{" "}
              <Text style={styles.footerBold}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    justifyContent: "center",
    paddingBottom: 30,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', // Static for transparent effect
    padding: 8,
    borderRadius: 12,
  },
  headerTitleContainer: {
    marginBottom: 30,
    marginTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.textOnPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.textOnPrimary,
  },
  glassContainer: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: theme.textOnPrimary,
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: theme.warning, // Gold accent
    fontWeight: "600",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: theme.warning,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: theme.primaryDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  socialText: {
    color: theme.textOnPrimary,
    marginBottom: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 4,
    elevation: 3,
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: theme.textOnPrimary,
  },
  registerLinkText: {
    color: theme.warning,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: theme.textLight,
    fontSize: 12,
    textAlign: "center",
  },
  footerBold: {
    fontWeight: "600",
    color: theme.textOnPrimary,
  },
});

export default LoginScreen;
