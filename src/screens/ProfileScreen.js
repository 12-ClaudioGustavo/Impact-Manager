import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PhoneInputField from "../components/PhoneInputField";
import { supabase } from "../lib/supabase";

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const phoneInput = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const user = session.user;

      // Get data from metadata first
      let fullName = user.user_metadata?.full_name || "";
      let phone = user.user_metadata?.phone || "";
      const email = user.email;

      // Try to get from users table for more complete info
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (userData && !error) {
        fullName = userData.full_name || fullName;
        phone = userData.phone || phone;
      }

      setFormData({
        fullName,
        email,
        phone,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Erro", "O nome não pode ficar vazio.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        },
      });

      if (authError) throw authError;

      // 2. Update Users Table
      const { error: dbError } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          updated_at: new Date(),
        })
        .eq("auth_id", session.user.id);

      if (dbError) {
        console.log(
          "DB Update Error (might be RLS, ignoring if Auth updated):",
          dbError,
        );
      }

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Erro", "Falha ao atualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.fullName
                  ? formData.fullName.charAt(0).toUpperCase()
                  : "U"}
              </Text>
            </View>
            <Text style={styles.emailText}>{formData.email}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Seu nome completo"
              />
            </View>

            <PhoneInputField
              ref={phoneInput}
              value={formData.phone}
              onChangeFormattedText={(text) => {
                setFormData({ ...formData, phone: text });
              }}
              label="Telefone"
              placeholder="Digite seu telefone"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
              />
              <Text style={styles.helperText}>
                O e-mail não pode ser alterado.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  emailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ProfileScreen;
