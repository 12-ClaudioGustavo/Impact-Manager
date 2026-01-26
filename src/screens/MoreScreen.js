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
  const styles = getStyles(theme);
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
      if (storedNotif !== null)
        setNotificationsEnabled(JSON.parse(storedNotif));
    } catch (e) {
      console.log("Error loading preferences", e);
    }
  };

  const toggleNotifications = async (value) => {
    if (value) {
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
    rightComponent,
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (
        showArrow && (
          <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
        )
      )}
    </TouchableOpacity>
  );

  const CreditItem = ({ name, role, avatar, instagram }) => (
    <TouchableOpacity
      style={styles.creditItem}
      onPress={() => Linking.openURL(instagram)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: avatar }} style={styles.creditAvatar} />
      <View style={styles.creditContent}>
        <Text style={styles.creditName}>{name}</Text>
        <Text style={styles.creditRole}>{role}</Text>
      </View>
      <Ionicons name="logo-instagram" size={20} color={theme.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient
          colors={
            isDarkMode
              ? [theme.gradientStart, theme.gradientEnd]
              : [theme.primary, theme.primaryDark]
          }
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Image
              source={require("../../assets/icon-removebg-preview.png")}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Menu</Text>
            <Text style={styles.headerSubtitle}>
              {userEmail || "Configurações e Opções"}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Seção Conta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONTA</Text>
            <View style={styles.sectionContent}>
              <MenuItem
                icon="person-outline"
                title="Meu Perfil"
                subtitle="Editar informações pessoais"
                color="#2563EB"
                onPress={() => navigation.navigate("Profile")}
              />
              <MenuItem
                icon="business-outline"
                title="Minha Organização"
                subtitle="Gerenciar dados da organização"
                color="#7C3AED"
                onPress={() => navigation.navigate("Organization")}
              />
            </View>
          </View>

          {/* Seção Preferências */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERÊNCIAS</Text>
            <View style={styles.sectionContent}>
              <MenuItem
                icon="notifications-outline"
                title="Notificações"
                subtitle={notificationsEnabled ? "Ativadas" : "Desativadas"}
                color="#F59E0B"
                showArrow={false}
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    trackColor={{
                      false: theme.border,
                      true: theme.primary + "40",
                    }}
                    thumbColor={
                      notificationsEnabled ? theme.primary : theme.inputDisabled
                    }
                  />
                }
              />
              <MenuItem
                icon={isDarkMode ? "moon-outline" : "sunny-outline"}
                title="Aparência"
                subtitle={isDarkMode ? "Tema Escuro" : "Tema Claro"}
                color={theme.primary}
                onPress={handleToggleTheme}
              />
              <MenuItem
                icon="settings-outline"
                title="Configurações"
                subtitle="Subscrições, conta e mais"
                color="#3B82F6"
                onPress={() => navigation.navigate("Settings")}
              />
            </View>
          </View>

          {/* Seção Ferramentas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FERRAMENTAS</Text>
            <View style={styles.sectionContent}>
              <MenuItem
                icon="document-text-outline"
                title="Relatórios"
                subtitle="Visualizar e exportar relatórios"
                color="#0EA5E9"
                onPress={() => navigation.navigate("Reports")}
              />
            </View>
          </View>

          {/* Seção Suporte */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUPORTE</Text>
            <View style={styles.sectionContent}>
              <MenuItem
                icon="help-circle-outline"
                title="Ajuda e FAQ"
                subtitle="Perguntas frequentes"
                color="#10B981"
                onPress={() => navigation.navigate("Help")}
              />
              <MenuItem
                icon="information-circle-outline"
                title="Sobre o App"
                subtitle="Versão 1.0.0"
                color="#6B7280"
                onPress={() => navigation.navigate("About")}
              />
            </View>
          </View>

          {/* Seção Créditos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CRÉDITOS</Text>
            <View style={styles.sectionContent}>
              <CreditItem
                name="Cláudio Josemar Gustavo"
                role="Desenvolvedor"
                avatar="https://avatars.githubusercontent.com/u/138240836?s=96&v=4"
                instagram="https://instagram.com/claudiogustavo231"
              />
              <CreditItem
                name="Kelly Kamesso"
                role="Testador"
                avatar="../../assets/kelly.jpeg"
                instagram="https://www.instagram.com/iamkelly_wt"
              />
              <CreditItem
                name="Lwyny da Conceição Mamana"
                role="Testador"
                avatar="https://i.pravatar.cc/150?img=52"
                instagram="https://www.instagram.com/im_lwyny"
              />
              <CreditItem
                name="Malcon Gonçalves"
                role="Testador"
                avatar="https://i.pravatar.cc/150?img=53"
                instagram="https://www.instagram.com/immalcon_wg"
              />
              <CreditItem
                name="Sebastião Nginamau Seke"
                role="Testador"
                avatar="https://i.pravatar.cc/150?img=53"
                instagram="https://www.instagram.com/narcisboy7?igsh=cHcyY3o0cGhlajYy"
              />
            </View>
          </View>

          {/* Botão Sair */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
            </View>
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Desenvolvido pela C-Space Technologies
            </Text>
            <Text style={[styles.footerText, { marginTop: 4, fontSize: 11 }]}>
              © 2024 - Todos os direitos reservados
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 32,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      alignItems: "center",
    },
    headerContent: {
      alignItems: "center",
    },
    headerIcon: {
      width: 60,
      height: 60,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.textOnPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
      letterSpacing: 1.2,
    },
    sectionContent: {
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    creditItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    creditAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
      backgroundColor: theme.border,
    },
    creditContent: {
      flex: 1,
    },
    creditName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    creditRole: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.errorLight,
      padding: 16,
      borderRadius: 16,
      marginTop: 8,
      marginBottom: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.error + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.error,
    },
    footer: {
      alignItems: "center",
      paddingTop: 16,
      paddingBottom: 8,
    },
    footerText: {
      fontSize: 12,
      color: theme.textLight,
      textAlign: "center",
    },
  });

export default MoreScreen;