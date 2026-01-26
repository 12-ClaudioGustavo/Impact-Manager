import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();

  // Componente reutilizável para itens de configuração
  const SettingItem = ({ icon, title, subtitle, onPress, color }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: (color || theme.primary) + '20' }]}>
        <Ionicons name={icon} size={22} color={color || theme.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.iconColorLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.header, { color: theme.text }]}>Configurações</Text>

        {/* Seção de Subscrição */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ASSINATURA</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundCard }]}>
            <SettingItem
              icon="rocket"
              title="Gerir Subscrição"
              subtitle="Veja os planos e benefícios"
              color="#7C3AED"
              onPress={() => navigation.navigate('Subscriptions')}
            />
          </View>
        </View>

        {/* Seção Geral */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>GERAL</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundCard }]}>
            <SettingItem
              icon="language"
              title="Idioma"
              subtitle="Português (Brasil)"
              color="#10B981"
              onPress={() => Alert.alert('Em Breve', 'Suporte a outros idiomas será adicionado futuramente.')}
            />
             <SettingItem
              icon="key"
              title="Segurança"
              subtitle="Gerir senha e autenticação"
              color="#F59E0B"
              onPress={() => navigation.navigate('Security')}
            />
          </View>
        </View>

         {/* Seção Dados */}
         <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DADOS</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.backgroundCard }]}>
            <SettingItem
              icon="cloud-upload"
              title="Backup e Sincronização"
              subtitle="Gerir backups na nuvem"
              color="#3B82F6"
              onPress={() => Alert.alert('Em Breve', 'Funcionalidade a ser implementada.')}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.02)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default SettingsScreen;
