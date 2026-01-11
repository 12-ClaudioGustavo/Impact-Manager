import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Image,
  Linking,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useTheme } from "../contexts/ThemeContext";

// Configurar notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MoreScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme, fadeAnim } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getUserInfo();
    loadPreferences();
  }, []);

  const getUserInfo = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUserEmail(session.user.email);
    }
  };

  const loadPreferences = async () => {
    try {
      const storedNotif = await AsyncStorage.getItem("notificationsEnabled");
      const storedTheme = await AsyncStorage.getItem("isDarkMode");

      if (storedNotif !== null)
        setNotificationsEnabled(JSON.parse(storedNotif));
      if (storedTheme !== null) setIsDarkMode(JSON.parse(storedTheme));
    } catch (e) {
      console.log("Error loading preferences", e);
    }
  };

  const toggleNotifications = async (value) => {
    if (value) {
      // Solicitar permissão
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Você precisa permitir notificações nas configurações do dispositivo.",
        );
        return;
      }

      // Agendar notificação de teste
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Notificações Ativadas! 🔔",
          body: "Você receberá atualizações importantes do app.",
          data: { test: true },
        },
        trigger: { seconds: 2 },
      });
    }

    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(value));
    } catch (e) {
      console.log("Error saving notifications pref", e);
    }
  };

  const handleToggleTheme = async () => {
    await toggleTheme();
    Alert.alert(
      "Tema Alterado",
      `Tema ${!isDarkMode ? "Escuro" : "Claro"} ativado com sucesso!`,
    );
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // Navigation will be handled by the auth state listener in App.js
          } catch (error) {
            Alert.alert("Erro", "Erro ao sair: " + error.message);
          }
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    color,
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: (color || theme.iconColor) + "20" },
        ]}
      >
        <Ionicons name={icon} size={22} color={color || theme.iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.iconColorLight}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient
          colors={
            isDarkMode
              ? [theme.backgroundHeader, theme.background]
              : [theme.gradientStart, theme.gradientEnd]
          }
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Image
              source={require("../../assets/icon-removebg-preview.png")}
              style={{ width: 60, height: 60, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
              Menu
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? theme.textSecondary : "#DBEAFE" },
              ]}
            >
              {userEmail || "Configurações e Opções"}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Seção Conta */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              CONTA
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.backgroundCard },
              ]}
            >
              <MenuItem
                icon="person"
                title="Meu Perfil"
                subtitle="Editar informações pessoais"
                color="#2563EB"
                onPress={() => navigation.navigate("Profile")}
              />
              <MenuItem
                icon="business"
                title="Minha Organização"
                subtitle="Gerenciar dados da organização"
                color="#7C3AED"
                onPress={() => navigation.navigate("Organization")}
              />
            </View>
          </View>

          {/* Seção Preferências */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              PREFERÊNCIAS
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.backgroundCard },
              ]}
            >
              <View
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.borderLight },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#F59E0B20" },
                  ]}
                >
                  <Ionicons name="notifications" size={22} color="#F59E0B" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: theme.text }]}>
                    Notificações
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {notificationsEnabled ? "Ativadas" : "Desativadas"}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: theme.border, true: theme.primaryLight }}
                  thumbColor={
                    notificationsEnabled ? theme.primary : theme.inputDisabled
                  }
                />
              </View>
              <MenuItem
                icon={isDarkMode ? "moon" : "sunny"}
                title="Aparência"
                subtitle={isDarkMode ? "Tema Escuro" : "Tema Claro"}
                color={theme.primary}
                onPress={handleToggleTheme}
              />
            </View>
          </View>

          {/* Seção Suporte */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              SUPORTE
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.backgroundCard },
              ]}
            >
              <MenuItem
                icon="help-circle"
                title="Ajuda e FAQ"
                color="#10B981"
                onPress={() => navigation.navigate("Help")}
              />
              <MenuItem
                icon="information-circle"
                title="Sobre o App"
                subtitle="Versão 1.0.0"
                color="#6B7280"
                onPress={() => navigation.navigate("About")}
              />
            </View>
          </View>

          {/* Seção Créditos */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              CRÉDITOS
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: theme.backgroundCard },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.creditItem,
                  { borderBottomColor: theme.borderLight },
                ]}
                onPress={() =>
                  Linking.openURL("https://instagram.com/claudiogustavo231")
                }
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=33" }}
                  style={styles.creditAvatar}
                />
                <View style={styles.creditContent}>
                  <Text style={[styles.creditName, { color: theme.text }]}>
                    Cláudio Josemar Gustavo
                  </Text>
                  <Text
                    style={[styles.creditRole, { color: theme.textSecondary }]}
                  >
                    Desenvolvedor
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.iconColorLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.creditItem,
                  { borderBottomColor: theme.borderLight },
                ]}
                onPress={() =>
                  Linking.openURL("https://instagram.com/kelly.kamesso")
                }
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=51" }}
                  style={styles.creditAvatar}
                />
                <View style={styles.creditContent}>
                  <Text style={[styles.creditName, { color: theme.text }]}>
                    Kelly Kamesso
                  </Text>
                  <Text
                    style={[styles.creditRole, { color: theme.textSecondary }]}
                  >
                    Testador
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.iconColorLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Sair */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.errorLight }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>
              Sair da Conta
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textLight }]}>
              Desenvolvido pela C-Space Technologies
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#DBEAFE",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  logoutText: {
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  creditItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  creditAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  creditContent: {
    flex: 1,
  },
  creditName: {
    fontSize: 16,
    fontWeight: "600",
  },
  creditRole: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
  },
});

export default MoreScreen;
