import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, FlatList, ActivityIndicator, Alert, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import MemberFormModal from '../components/MemberFormModal';
import { useTheme } from '../contexts/ThemeContext';

const MembersScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();

  const [modalVisible, setModalVisible] = useState(false);
  const [members, setMembers] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    if (route.params?.action === 'add') {
      setModalVisible(true);
      navigation.setParams({ action: null }); 
    }
  }, [route.params?.action]);

  const fetchMemberData = useCallback(async () => {
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
      setOrganizationId(orgId);

      if (orgId) {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (membersError) {
          console.error("Erro ao carregar membros:", membersError);
          Alert.alert("Erro", "Não foi possível carregar os membros.");
        } else {
          setMembers(membersData);
          
          // Calcular estatísticas
          const now = new Date();
          const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const activeCount = membersData.filter(m => m.membership_status === 'Ativo').length;
          const inactiveCount = membersData.filter(m => m.membership_status === 'Inativo').length;
          const newThisMonth = membersData.filter(m => new Date(m.created_at) >= firstDayThisMonth).length;
          
          setStats({
            total: membersData.length,
            active: activeCount,
            inactive: inactiveCount,
            newThisMonth: newThisMonth
          });
        }
      }
    } catch (error) {
      console.error("Erro geral:", error);
      Alert.alert("Erro", "Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchMemberData();
    }, [fetchMemberData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMemberData();
  }, [fetchMemberData]);

  const filteredMembers = useMemo(() => {
    let filtered = members;
    
    // Filtrar por status
    if (filterStatus === 'active') {
      filtered = filtered.filter(m => m.membership_status === 'Ativo');
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(m => m.membership_status === 'Inativo');
    }
    
    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.phone && member.phone.includes(searchQuery))
      );
    }
    
    return filtered;
  }, [members, searchQuery, filterStatus]);
  
  const handleAddNewMember = async (memberData) => {
    try {
      const { error } = await supabase.from('members').insert([memberData]);
      if (error) throw error;
      
      Alert.alert("Sucesso", "Membro adicionado com sucesso!");
      setModalVisible(false);
      onRefresh();
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      Alert.alert("Erro", "Não foi possível adicionar o membro.");
    }
  };

  const FilterChip = ({ label, value, count }) => (
    <TouchableOpacity 
      style={[
        styles.filterChip, 
        filterStatus === value && styles.filterChipActive
      ]}
      onPress={() => setFilterStatus(value)}
    >
      <Text style={[
        styles.filterChipText,
        filterStatus === value && styles.filterChipTextActive
      ]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[
          styles.filterChipBadge,
          filterStatus === value && styles.filterChipBadgeActive
        ]}>
          <Text style={[
            styles.filterChipBadgeText,
            filterStatus === value && styles.filterChipBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const MemberItem = ({ item, index }) => {
    const animatedValue = new Animated.Value(0);
    
    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={{ opacity: animatedValue }}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('MemberDetails', { memberId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.memberItem}>
            <View style={styles.memberLeft}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.memberPhoto} />
              ) : (
                <LinearGradient
                  colors={[theme.primary + '40', theme.primary + '80']}
                  style={styles.memberAvatar}
                >
                  <Text style={styles.memberAvatarText}>
                    {item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1}>{item.full_name}</Text>
                <View style={styles.memberMetaRow}>
                  {item.email && (
                    <View style={styles.memberMeta}>
                      <Ionicons name="mail-outline" size={12} color={theme.textSecondary} />
                      <Text style={styles.memberMetaText} numberOfLines={1}>{item.email}</Text>
                    </View>
                  )}
                </View>
                {item.phone && (
                  <View style={styles.memberMeta}>
                    <Ionicons name="call-outline" size={12} color={theme.textSecondary} />
                    <Text style={styles.memberMetaText}>{item.phone}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.memberRight}>
              <View style={[
                styles.statusBadge, 
                item.membership_status === 'Ativo' ? styles.statusActive : styles.statusInactive
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: item.membership_status === 'Ativo' ? theme.success : theme.error }
                ]} />
                <Text style={[
                  styles.statusText, 
                  item.membership_status === 'Ativo' ? styles.statusActiveText : styles.statusInactiveText
                ]}>
                  {item.membership_status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.iconColorLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.inputPlaceholder}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <FilterChip label="Todos" value="all" count={stats.total} />
        <FilterChip label="Ativos" value="active" count={stats.active} />
        <FilterChip label="Inativos" value="inactive" count={stats.inactive} />
      </View>

      {stats.newThisMonth > 0 && (
        <View style={styles.insightCard}>
          <Ionicons name="trending-up" size={20} color={theme.success} />
          <Text style={styles.insightText}>
            {stats.newThisMonth} {stats.newThisMonth === 1 ? 'novo membro' : 'novos membros'} este mês
          </Text>
        </View>
      )}
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
            <Text style={styles.headerTitle}>Membros</Text>
            <Text style={styles.headerSubtitle}>
              {stats.total} {stats.total === 1 ? 'membro registrado' : 'membros registrados'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setModalVisible(true)}
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
      
      <MemberFormModal 
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddNewMember}
        organizationId={organizationId}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando membros...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <MemberItem item={item} index={index} />}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={64} color={theme.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum membro cadastrado'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `Não encontramos membros para "${searchQuery}"`
                  : 'Comece adicionando o primeiro membro da sua organização'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={20} color={theme.textOnPrimary} />
                  <Text style={styles.emptyButtonText}>Adicionar Membro</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.primary]} 
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundCard,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
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
  filterChipBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.text,
  },
  filterChipBadgeTextActive: {
    color: theme.textOnPrimary,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.successLight,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: theme.success,
    fontWeight: '600',
  },
  listContentContainer: {
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
  memberItem: {
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
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: theme.textOnPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberMetaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusActive: {
    backgroundColor: theme.successLight,
  },
  statusInactive: {
    backgroundColor: theme.errorLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveText: {
    color: theme.success,
  },
  statusInactiveText: {
    color: theme.error,
  },
});

export default MembersScreen;