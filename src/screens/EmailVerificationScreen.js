import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const EmailVerificationScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text, index) => {
    // Apenas números
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus próximo input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verificar quando todos os dígitos forem preenchidos
    if (text && index === 5 && newCode.every((digit) => digit !== "")) {
      Keyboard.dismiss();
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeString = null) => {
    const verificationCode = codeString || code.join("");

    if (verificationCode.length !== 6) {
      Alert.alert("Erro", "Por favor, digite o código completo de 6 dígitos.");
      return;
    }

    setLoading(true);

    try {
      console.log("🔢 Verificando código:", verificationCode);

      const { data, error } = await supabase.rpc("verify_code", {
        p_email: email,
        p_code: verificationCode,
      });

      if (error) {
        console.error("❌ Erro ao verificar código:", error);
        Alert.alert(
          "Erro",
          "Não foi possível verificar o código. Tente novamente.",
        );
        setLoading(false);
        return;
      }

      console.log("📦 Resposta da verificação:", data);

      if (data.success) {
        console.log("✅ Código verificado com sucesso!");
        Alert.alert(
          "Email Confirmado!",
          "Seu email foi verificado com sucesso. Você pode fazer login agora.",
          [
            {
              text: "OK",
              onPress: () => {
                supabase.auth.signOut();
                navigation.navigate("Login");
              },
            },
          ],
        );
      } else {
        console.log("❌ Verificação falhou:", data.error);

        let message = data.message || "Código inválido.";

        if (data.error === "code_expired") {
          Alert.alert("Código Expirado", message, [
            { text: "Solicitar Novo Código", onPress: handleResendCode },
            { text: "Cancelar", style: "cancel" },
          ]);
        } else if (data.error === "max_attempts") {
          Alert.alert("Tentativas Excedidas", message, [
            { text: "Solicitar Novo Código", onPress: handleResendCode },
            { text: "OK" },
          ]);
        } else {
          Alert.alert("Código Inválido", message);
        }

        // Limpar código
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("❌ Erro ao verificar código:", error);
      Alert.alert("Erro", "Ocorreu um erro ao verificar o código.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);

    try {
      console.log("📧 Verificando se pode reenviar código...");

      const { data: canResendData, error: canResendError } = await supabase.rpc(
        "can_resend_code",
        { p_email: email },
      );

      if (canResendError) {
        console.error("❌ Erro ao verificar reenvio:", canResendError);
        Alert.alert("Erro", "Não foi possível verificar o reenvio.");
        setLoading(false);
        return;
      }

      if (!canResendData.can_resend) {
        const waitSeconds = canResendData.wait_seconds || 60;
        setResendCooldown(waitSeconds);
        Alert.alert(
          "Aguarde",
          `Por favor, aguarde ${waitSeconds} segundos antes de solicitar um novo código.`,
        );
        setLoading(false);
        return;
      }

      // Buscar user_id
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        Alert.alert(
          "Erro",
          "Sessão não encontrada. Por favor, faça login novamente.",
        );
        navigation.navigate("Login");
        setLoading(false);
        return;
      }

      console.log("🔢 Gerando novo código...");

      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_verification_code",
        {
          p_user_id: session.user.id,
          p_email: email,
        },
      );

      if (codeError) {
        console.error("❌ Erro ao gerar código:", codeError);
        Alert.alert("Erro", "Não foi possível gerar um novo código.");
        setLoading(false);
        return;
      }

      console.log("✅ Novo código gerado:", codeData);

      Alert.alert(
        "Código Enviado!",
        "Um novo código de verificação foi enviado para seu email.",
        [{ text: "OK" }],
      );

      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("❌ Erro ao reenviar código:", error);
      Alert.alert("Erro", "Ocorreu um erro ao reenviar o código.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (text) => {
    // Extrair apenas números
    const numbers = text.replace(/\D/g, "").slice(0, 6);

    if (numbers.length === 6) {
      const newCode = numbers.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();

      // Auto-verificar
      setTimeout(() => {
        handleVerifyCode(numbers);
      }, 100);
    }
  };

  const handleBackToLogin = () => {
    supabase.auth.signOut();
    navigation.navigate("Login");
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#1E40AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={60} color="#2563EB" />
          </View>
        </View>

        <Text style={styles.title}>Verificar Email</Text>

        <Text style={styles.description}>
          Digite o código de 6 dígitos enviado para:
        </Text>

        <View style={styles.emailContainer}>
          <Ionicons name="mail" size={20} color="#2563EB" />
          <Text style={styles.emailText}>{email || "seu email"}</Text>
        </View>

        <Text style={styles.instructions}>O código expira em 15 minutos</Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              onPaste={(e) => {
                if (index === 0) {
                  handlePaste(e.nativeEvent.data);
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerifyCode()}
          disabled={loading || code.some((d) => !d)}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.verifyButtonText}>Verificar Código</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resendButton,
            (loading || resendCooldown > 0) && styles.resendButtonDisabled,
          ]}
          onPress={handleResendCode}
          disabled={loading || resendCooldown > 0}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={resendCooldown > 0 ? "#9CA3AF" : "#2563EB"}
          />
          <Text
            style={[
              styles.resendButtonText,
              resendCooldown > 0 && styles.resendButtonTextDisabled,
            ]}
          >
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : "Reenviar Código"}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Dicas:</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Verifique sua caixa de spam</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>O código expira em 15 minutos</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Máximo de 5 tentativas por código
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 32,
    marginTop: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
  instructions: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
    width: "100%",
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeInputFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  resendButtonTextDisabled: {
    color: "#9CA3AF",
  },
  tipsContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    flex: 1,
  },
});

export default EmailVerificationScreen;
