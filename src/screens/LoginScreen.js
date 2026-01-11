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

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
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
      console.log("🔐 Tentando fazer login...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (error) {
        console.error("❌ Erro ao fazer login:", error);
        Alert.alert("Erro ao fazer login", error.message);
        return;
      }

      console.log("✅ Login realizado:", data.user.email);

      // Verificar se o email foi confirmado
      if (!data.user.email_confirmed_at) {
        console.log("⚠️ Email não confirmado");

        Alert.alert(
          "Email Não Confirmado",
          "Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.",
          [
            {
              text: "Reenviar Email",
              onPress: () => {
                // Fazer logout e ir para tela de verificação
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

      console.log("🎉 Login bem-sucedido! Email confirmado.");
      // O navegador redirecionará automaticamente devido ao estado de sessão
    } catch (error) {
      console.error("❌ Erro inesperado ao fazer login:", error);
      Alert.alert("Erro", "Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
          colors={["#2563EB", "#1E40AF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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

          {/* Glass Form Container */}
          <View style={styles.glassContainer}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) => updateFormData("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#9CA3AF"
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
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#1a2a6c" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <Text style={styles.socialText}>Ou entre com</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Link */}
            <View style={styles.registerLink}>
              <Text style={styles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLinkText}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
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

const styles = StyleSheet.create({
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
    justifyContent: "center", // Center vertically if possible
    paddingBottom: 30,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  glassContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#fdbb2d", // Gold accent
    fontWeight: "600",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#fdbb2d",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#1a2a6c",
    fontSize: 18,
    fontWeight: "bold",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  socialText: {
    color: "rgba(255,255,255,0.8)",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: "rgba(255,255,255,0.8)",
  },
  registerLinkText: {
    color: "#F59E0B",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  footerBold: {
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
});

export default LoginScreen;
