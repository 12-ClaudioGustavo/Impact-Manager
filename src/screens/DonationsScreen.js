import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const DonationsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'cash', 'goods'
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    count: 0,
  });

  const fetchDonationData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Erro', 'Sessão não encontrada.');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user's organization", userError);
        Alert.alert('Erro', 'Não foi possível encontrar a organização do usuário.');
        return;
      }

      const orgId = userData.organization_id;

      if (orgId) {
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (donationsError) {
          console.error('Error fetching donations', donationsError);
          Alert.alert('Erro', 'Não foi possível buscar as doações.');
        } else {
          setDonations(donationsData || []);

          // Calcular estatísticas
          const now = new Date();
          const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

          const total = donationsData.reduce((sum, d) => sum + Number(d.amount || 0), 0);
          const thisMonth = donationsData
            .filter((d) => new Date(d.created_at) >= firstDayThisMonth)
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
          const lastMonth = donationsData
            .filter(
              (d) =>
                new Date(d.created_at) >= firstDayLastMonth &&
                new Date(d.created_at) <= lastDayLastMonth
            )
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);

          setStats({
            total,
            thisMonth,
            lastMonth,
            count: donationsData.length,
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching donations', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao buscar as doações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchDonationData();
    }, [fetchDonationData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDonationData();
  }, [fetchDonationData]);

  const filteredDonations = useMemo(() => {
    let filtered = donations;

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((d) => d.donation_type === filterType);
    }

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [donations, searchQuery, filterType]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Dinheiro':
        return theme.success;
      case 'Bens':
        return theme.warning;
      default:
        return theme.info;
    }
  };

  const FilterChip = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[styles.filterChip, filterType === value && styles.filterChipActive]}
      onPress={() => setFilterType(value)}
    >
      <Ionicons
        name={icon}
        size={18}
        color={filterType === value ? theme.textOnPrimary : theme.textSecondary}
      />
      <Text
        style={[
          styles.filterChipText,
          filterType === value && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const DonationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.donationItem}
      onPress={() => navigation.navigate('DonationDetails', { donationId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.donationLeft}>
        <View
          style={[
            styles.donationIcon,
            { backgroundColor: getTypeColor(item.donation_type) + '20' },
          ]}
        >
          <Ionicons
            name={item.donation_type === 'Dinheiro' ? 'cash' : 'gift'}
            size={24}
            color={getTypeColor(item.donation_type)}
          />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donorName} numberOfLines={1}>
            {item.donor_name}
          </Text>
          {item.description && (
            <Text style={styles.donationDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <View style={styles.donationMeta}>
            <Ionicons name="calendar-outline" size={12} color={theme.textLight} />
            <Text style={styles.donationDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.donationRight}>
        <Text style={[styles.donationAmount, { color: getTypeColor(item.donation_type) }]}>
          {formatCurrency(item.amount)}
        </Text>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeColor(item.donation_type) + '20' },
          ]}
        >
          <Text style={[styles.typeText, { color: getTypeColor(item.donation_type) }]}>
            {item.donation_type}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="trending-up" size={20} color={theme.success} />
            <Text style={styles.statLabel}>Total Arrecadado</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
          <Text style={styles.statSubtext}>{stats.count} doações</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="calendar" size={20} color={theme.primary} />
            <Text style={styles.statLabel}>Este Mês</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(stats.thisMonth)}</Text>
          {stats.lastMonth > 0 && (
            <View style={styles.statTrend}>
              <Ionicons
                name={stats.thisMonth >= stats.lastMonth ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={stats.thisMonth >= stats.lastMonth ? theme.success : theme.error}
              />
              <Text
                style={[
                  styles.statTrendText,
                  {
                    color:
                      stats.thisMonth >= stats.lastMonth ? theme.success : theme.error,
                  },
                ]}
              >
                {Math.abs(
                  ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
                ).toFixed(0)}
                %
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.iconColorLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por doador ou descrição..."
          placeholderTextColor={theme.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <FilterChip label="Todas" value="all" icon="list" />
        <FilterChip label="Dinheiro" value="Dinheiro" icon="cash" />
        <FilterChip label="Bens" value="Bens" icon="gift" />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {filteredDonations.length}{' '}
          {filteredDonations.length === 1 ? 'doação' : 'doações'}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient
        colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Doações</Text>
            <Text style={styles.headerSubtitle}>
              Gerencie as doações recebidas
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddDonation')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={28} color={theme.textOnPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando doações...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDonations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <DonationItem item={item} />}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={64} color={theme.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma doação registrada'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Não encontramos doações para "${searchQuery}"`
                  : 'Comece registrando a primeira doação'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddDonation')}
                >
                  <Ionicons name="add-circle" size={20} color={theme.textOnPrimary} />
                  <Text style={styles.emptyButtonText}>Registrar Doação</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
      paddingBottom: 14,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      marginTop: 4,
    },
    addButton: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    addButtonGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    statSubtext: {
      fontSize: 12,
      color: theme.textLight,
    },
    statTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statTrendText: {
      fontSize: 12,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      height: 48,
      marginLeft: 12,
      fontSize: 16,
      color: theme.text,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundCard,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: theme.textOnPrimary,
    },
    listHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    donationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundCard,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 12,
      borderRadius: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    donationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    donationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    donationInfo: {
      flex: 1,
    },
    donorName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    donationDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    donationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    donationDate: {
      fontSize: 12,
      color: theme.textLight,
    },
    donationRight: {
      alignItems: 'flex-end',
      marginLeft: 12,
    },
    donationAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    typeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      marginTop: 40,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    emptyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
  });

export default DonationsScreen;