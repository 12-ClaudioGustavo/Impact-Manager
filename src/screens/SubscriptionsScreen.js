import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PlanCard = ({ plan, price, features, isFeatured }) => {
  const { theme } = useTheme();
  const cardStyle = isFeatured
    ? [styles.planCard, { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 2 }]
    : [styles.planCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }];
  const textColor = isFeatured ? theme.textOnPrimary : theme.text;
  const priceColor = isFeatured ? '#FFFFFF' : theme.primary;
  const buttonStyle = isFeatured
    ? [styles.button, { backgroundColor: '#FFFFFF' }]
    : [styles.button, { backgroundColor: theme.primary }];
  const buttonTextColor = isFeatured ? theme.primary : '#FFFFFF';

  return (
    <View style={cardStyle}>
      <Text style={[styles.planTitle, { color: textColor }]}>{plan}</Text>
      <Text style={[styles.planPrice, { color: priceColor }]}>{price}</Text>
      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={isFeatured ? '#A7F3D0' : theme.primary} />
            <Text style={[styles.featureText, { color: textColor, opacity: 0.9 }]}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={buttonStyle} onPress={() => alert(`Plano ${plan} selecionado!`)}>
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>Escolher Plano</Text>
      </TouchableOpacity>
    </View>
  );
};

const SubscriptionsScreen = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
       <LinearGradient
          colors={isDarkMode ? [theme.backgroundHeader, theme.background] : [theme.gradientStart, theme.gradientEnd]}
          style={styles.header}
        >
        <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>Planos de Subscrição</Text>
        <Text style={[styles.headerSubtitle, { color: isDarkMode ? theme.textSecondary : '#DBEAFE' }]}>
          Desbloqueie funcionalidades exclusivas
        </Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <PlanCard
          plan="Gratuito"
          price="€0 / mês"
          features={['Gestão de até 20 membros', 'Funcionalidades básicas', 'Suporte comunitário']}
          isFeatured={false}
        />
        <PlanCard
          plan="Pro"
          price="8.999 Kz / mês"
          features={['Membros ilimitados', 'Relatórios avançados', 'Sincronização na nuvem', 'Suporte prioritário']}
          isFeatured={true}
        />
         <PlanCard
          plan="Organização"
          price="17.999 Kz / mês"
          features={['Tudo do Pro', 'Múltiplos administradores', 'Logo personalizado', 'API de integração']}
          isFeatured={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContainer: {
    padding: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubscriptionsScreen;
