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
import MemberFormModal from '../components/MemberFormModal';
import { useTheme } from '../contexts/ThemeContext';

const MembersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [modalVisible, setModalVisible] = useState(false);
  const [members, setMembers] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          .order('full_name', { ascending: true });

        if (membersError) {
          console.error("Erro ao carregar membros:", membersError);
          Alert.alert("Erro", "Não foi possível carregar os membros.");
        } else {
          setMembers(membersData);
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
    if (!searchQuery) {
      return members;
    }
    return members.filter(member =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [members, searchQuery]);
  
  const handleAddNewMember = async (memberData) => {
      const { error } = await supabase.from('members').insert([memberData]);
      if (error) throw error;
      
      Alert.alert("Sucesso", "Membro adicionado com sucesso!");
      onRefresh();
  };

  const MemberItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MemberDetails', { memberId: item.id })}>
      <View style={styles.memberItem}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.memberPhoto} />
        ) : (
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>{item.full_name ? item.full_name.charAt(0).toUpperCase() : '?'}</Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.full_name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, item.membership_status === 'Ativo' ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, item.membership_status === 'Ativo' ? styles.statusActiveText : styles.statusInactiveText]}>{item.membership_status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Membros</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <MemberFormModal 
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddNewMember}
        organizationId={organizationId}
      />

      {loading && !refreshing ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={MemberItem}
          ListHeaderComponent={
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.iconColorLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={theme.border} />
              <Text style={styles.emptyTitle}>{searchQuery ? 'Nenhum resultado' : 'Nenhum Membro'}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? `Não encontramos resultados para "${searchQuery}"` : 'Comece adicionando membros à sua organização.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary}/>
          }
          contentContainerStyle={styles.listContentContainer}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.backgroundCard,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  listContentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: -80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundCard,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 2,
    elevation: 2,
  },
  memberPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  memberEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: theme.successLight,
  },
  statusInactive: {
    backgroundColor: theme.errorLight,
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
  }
});

export default MembersScreen;
