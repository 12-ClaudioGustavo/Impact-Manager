import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
//import MemberFormModal from '../components/MemberFormModal';
import { useTheme } from '../contexts/ThemeContext';


const DonationsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDonationData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Erro", "Sessão não encontrada.");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user's organization", userError);
        Alert.alert("Erro", "Não foi possível encontrar a organização do usuário.");
        return;
      }

      const orgId = userData.organization_id;

      if (orgId) {
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('*')
          .eq('organization_id', orgId);

        if (donationsError) {
          console.error("Error fetching donations", donationsError);
          Alert.alert("Erro", "Não foi possível buscar as doações.");
        } else {
          setDonations(donationsData || []);
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching donations", error);
      Alert.alert("Erro", "Ocorreu um erro inesperado ao buscar as doações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchDonationData();
    }, [fetch])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDonationData();
  }, [fetchDonationData]);

  const filteredDonations = useMemo(() => {
    return donations.filter(donation =>
      donation.donor_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [donations, searchQuery]);

  const renderDonationItem = ({ item }) => (
    <View style={styles.donationItem}>
      <Text style={styles.donorName}>{item.donor_name}</Text>
      <Text style={styles.donationAmount}>${item.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doações</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar doador..."
        placeholderTextColor={theme.textLight}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDonations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDonationItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma doação encontrada.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.backgroundCard,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  searchInput: {
    height: 40,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.inputBackground,
    color: theme.text,
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  donorName: {
    fontSize: 16,
    color: theme.text,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textLight,
  },
});

export default DonationsScreen;
