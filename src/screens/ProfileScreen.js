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
import { useTheme } from '../contexts/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

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

      let fullName = user.user_metadata?.full_name || "";
      let phone = user.user_metadata?.phone || "";
      const email = user.email;

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

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        },
      });

      if (authError) throw authError;

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
        <ActivityIndicator size="large" color={theme.primary} />
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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
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
                placeholderTextColor={theme.inputPlaceholder}
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
                placeholderTextColor={theme.inputPlaceholder}
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
              <ActivityIndicator color={theme.textOnPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    borderBottomColor: theme.border,
    backgroundColor: theme.backgroundCard,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
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
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.textOnPrimary,
  },
  emailText: {
    fontSize: 14,
    color: theme.textSecondary,
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
    color: theme.text,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
  },
  disabledInput: {
    backgroundColor: theme.inputDisabled,
    color: theme.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  footer: {
    padding: 24,
    backgroundColor: theme.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.textOnPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ProfileScreen;
