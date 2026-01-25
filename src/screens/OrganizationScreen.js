import React, { useState, useEffect } from "react";
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
import { supabase } from "../lib/supabase";
import { useTheme } from '../contexts/ThemeContext';

const OrganizationScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [orgData, setOrgData] = useState({
    id: null,
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("auth_id", session.user.id)
        .single();

      if (userError || !userData?.organization_id) {
        Alert.alert("Aviso", "Organização não encontrada para este usuário.");
        setFetching(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userData.organization_id)
        .single();

      if (orgError) throw orgError;

      setOrgData({
        id: org.id,
        name: org.name || "",
        description: org.description || "",
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados da organização.");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!orgData.name.trim()) {
      Alert.alert("Erro", "O nome da organização é obrigatório.");
      return;
    }

    if (!orgData.id) {
      Alert.alert("Erro", "ID da organização não encontrado.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgData.name.trim(),
          description: orgData.description?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgData.id);

      if (error) throw error;

      Alert.alert("Sucesso", "Organização atualizada com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Erro", "Falha ao atualizar organização: " + error.message);
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
        <Text style={styles.headerTitle}>Minha Organização</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={40} color={theme.primary} />
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Organização</Text>
              <TextInput
                style={styles.input}
                value={orgData.name}
                onChangeText={(text) => setOrgData({ ...orgData, name: text })}
                placeholder="Nome da sua ONG/Igreja"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={orgData.description}
                onChangeText={(text) =>
                  setOrgData({ ...orgData, description: text })
                }
                placeholder="Breve descrição sobre a organização"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={theme.inputPlaceholder}
              />
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
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
  textArea: {
    minHeight: 100,
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

export default OrganizationScreen;
