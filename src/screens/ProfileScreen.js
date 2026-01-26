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
import Button from "../components/common/Button";
import { supabase } from "../lib/supabase";
import { useTheme } from '../contexts/ThemeContext';
import * as Localization from 'expo-localization';

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
  const [countryCode, setCountryCode] = useState('AO'); // Default para Angola
  const phoneInput = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não encontrado");

      // Garante que o email (que é imutável) está sempre presente
      setFormData(prev => ({ ...prev, email: user.email }));

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`full_name, phone, country_code`)
        .eq("id", user.id)
        .single();

      // O erro 406 significa "nenhuma linha encontrada", o que é esperado para um perfil novo.
      // Ignoramos esse erro específico.
      if (error && status !== 406) {
        throw error;
      }
      
      if (data) {
        // Se o perfil já existe, preenchemos os dados.
        setFormData(prev => ({
          ...prev,
          fullName: data.full_name || "",
          phone: data.phone || "",
        }));
        setCountryCode(data.country_code || Localization.getLocales()[0]?.regionCode || 'AO');
      } else {
        // Se o perfil não existe, apenas detectamos a localização para o novo perfil.
        setCountryCode(Localization.getLocales()[0]?.regionCode || 'AO');
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o seu perfil.");
      console.error("Error fetching profile:", error);
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
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado");


      const updates = {
        id: user.id,
        full_name: formData.fullName,
        phone: formData.phone,
        country_code: countryCode, // Salva o código do país
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar perfil: " + error.message);
      console.error("Update error:", error);
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
              defaultCode={countryCode}
              value={formData.phone}
              onChangeFormattedText={(text) => {
                setFormData({ ...formData, phone: text });
              }}
              onCountryChange={(country) => {
                setCountryCode(country.cca2); // cca2 é o código do país, ex: 'AO'
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
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <Button
              title="Salvar Alterações"
              onPress={handleUpdate}
              disabled={loading}
            />
          )}
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
});

export default ProfileScreen;
