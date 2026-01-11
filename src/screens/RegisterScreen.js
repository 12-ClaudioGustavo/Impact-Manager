import React, { useState, useRef } from "react";
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
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState({
    organizationName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.organizationName) {
      Alert.alert("Atenção", "Por favor, informe o nome da organização.");
      return;
    }
    if (step === 2 && !formData.fullName) {
      Alert.alert("Atenção", "Por favor, informe seu nome completo.");
      return;
    }

    animateStepChange(() => setStep(step + 1));
  };

  const prevStep = () => {
    animateStepChange(() => setStep(step - 1));
  };

  const animateStepChange = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
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

  const validateForm = () => {
    const { email, password, confirmPassword } = formData;

    if (!email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um e-mail válido");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("🚀 Iniciando processo de registro...");

      // 1. Criar usuário no Supabase Auth
      console.log("📧 Criando conta de autenticação...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
          emailRedirectTo: undefined, // Desabilitar email automático
        },
      });

      if (authError) {
        console.error("❌ Erro ao criar conta de autenticação:", authError);
        Alert.alert("Erro ao criar conta", authError.message);
        return;
      }

      if (!authData?.user?.id) {
        console.error("❌ Dados de autenticação inválidos");
        Alert.alert("Erro", "Não foi possível criar a conta de autenticação.");
        return;
      }

      console.log("✅ Conta de autenticação criada:", authData.user.id);

      // 2. Criar organização
      console.log("🏢 Criando organização...");
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert([
          {
            name: formData.organizationName.trim(),
            email: formData.email.trim().toLowerCase(),
            status: "active",
            subscription_plan: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (orgError) {
        console.error("❌ Erro ao criar organização:", orgError);
        Alert.alert(
          "Erro ao criar organização",
          orgError.message ||
            "Não foi possível criar a organização. Verifique as permissões no Supabase.",
        );
        await supabase.auth.admin
          .deleteUser(authData.user.id)
          .catch(console.error);
        return;
      }

      if (!orgData?.id) {
        console.error("❌ Organização criada sem ID");
        Alert.alert("Erro", "Organização criada mas ID não retornado.");
        return;
      }

      console.log("✅ Organização criada:", {
        id: orgData.id,
        name: orgData.name,
      });

      // 3. Criar perfil do usuário
      console.log("👤 Criando perfil de usuário...");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            auth_id: authData.user.id,
            organization_id: orgData.id,
            full_name: formData.fullName.trim(),
            email: formData.email.trim().toLowerCase(),
            role: "admin",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error("❌ Erro ao criar perfil de usuário:", userError);
        Alert.alert(
          "Erro ao criar perfil",
          userError.message ||
            "Não foi possível criar o perfil de usuário. Verifique as permissões no Supabase.",
        );
        await supabase
          .from("organizations")
          .delete()
          .eq("id", orgData.id)
          .catch(console.error);
        await supabase.auth.admin
          .deleteUser(authData.user.id)
          .catch(console.error);
        return;
      }

      console.log("✅ Perfil de usuário criado:", userData);

      // 4. Gerar código de verificação de 6 dígitos
      console.log("🔢 Gerando código de verificação...");
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_verification_code",
        {
          p_user_id: authData.user.id,
          p_email: formData.email.trim().toLowerCase(),
        },
      );

      if (codeError) {
        console.error("❌ Erro ao gerar código:", codeError);
        Alert.alert(
          "Aviso",
          "Conta criada, mas não foi possível gerar o código de verificação. Você pode solicitar um novo código na tela de login.",
        );
      } else {
        console.log("✅ Código de verificação gerado:", codeData);
      }

      console.log("🎉 Registro concluído com sucesso!");

      // Redirecionar para tela de verificação de email
      navigation.navigate("EmailVerification", {
        email: formData.email.trim().toLowerCase(),
      });

      Alert.alert(
        "Conta Criada!",
        "Enviamos um código de verificação de 6 dígitos para seu email.",
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("❌ Erro geral no registro:", error);
      Alert.alert(
        "Erro",
        "Ocorreu um erro inesperado ao criar sua conta. Por favor, tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>
              Qual o nome da sua organização?
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Ex: ONG Esperança"
                placeholderTextColor="#9CA3AF"
                value={formData.organizationName}
                onChangeText={(text) =>
                  updateFormData("organizationName", text)
                }
                autoFocus
              />
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Como devemos te chamar?</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#9CA3AF"
                value={formData.fullName}
                onChangeText={(text) => updateFormData("fullName", text)}
                autoFocus
              />
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Dados de acesso</Text>
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
              />
            </View>
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(text) => updateFormData("password", text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Confirme a senha"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData("confirmPassword", text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </>
        );
      default:
        return null;
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>
              Junte-se a nós e comece a fazer a diferença.
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]}
            />
          </View>

          <View style={styles.glassContainer}>
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
                <TouchableOpacity
                  onPress={prevStep}
                  style={styles.navButtonSecondary}
                >
                  <Text style={styles.navButtonTextSecondary}>Voltar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={step < 3 ? nextStep : handleRegister}
                style={[styles.navButtonPrimary, step === 1 && { flex: 1 }]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1a2a6c" />
                ) : (
                  <Text style={styles.navButtonTextPrimary}>
                    {step < 3 ? "Próximo" : "Cadastro"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.socialContainer}>
            <Text style={styles.socialText}>Ou registre-se com</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.loginLinkContainer}
          >
            <Text style={styles.loginLinkText}>
              Já tem uma conta? <Text style={styles.loginLinkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  headerTitleContainer: {
    marginBottom: 20,
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
  progressContainer: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 30,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F59E0B",
  },
  glassContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  navigationButtons: {
    flexDirection: "row",
    marginTop: 30,
    gap: 12,
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonTextPrimary: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "bold",
  },
  navButtonSecondary: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonTextSecondary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  socialContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
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
  loginLinkContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loginLinkText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
  },
  loginLinkBold: {
    fontWeight: "bold",
    color: "#F59E0B",
  },
});

export default RegisterScreen;
