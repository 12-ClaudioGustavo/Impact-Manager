import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import MemberFormModal from '../components/MemberFormModal';
import { useTheme } from '../contexts/ThemeContext';

const MemberDetailsScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const { memberId } = route.params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const fetchMemberDetails = useCallback(async () => {
    if(!isEditModalVisible) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        throw error;
      }
      setMember(data);
    } catch (error) {
      console.error("Error fetching member details:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do membro.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [memberId, navigation, isEditModalVisible]);

  useFocusEffect(fetchMemberDetails);
  
  const handleDelete = async () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir ${member.full_name}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              if (member.photo_url) {
                const fileName = member.photo_url.split('/').pop();
                await supabase.storage.from('member-photos').remove([fileName]);
              }

              const { error: dbError } = await supabase.from('members').delete().eq('id', memberId);

              if (dbError) throw dbError;

              Alert.alert("Sucesso", "Membro excluído com sucesso.");
              navigation.goBack();

            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("Erro", "Não foi possível excluir o membro.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateMember = async (updatedData, id) => {
    const { error } = await supabase.from('members').update(updatedData).eq('id', id);
    if (error) throw error;
    
    Alert.alert("Sucesso", "Membro atualizado com sucesso!");
    fetchMemberDetails(); // Re-fetch data to show updated info
  };
  
  const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={24} color={theme.iconColor} style={styles.detailIcon} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Não informado'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalhes do Membro</Text>
            <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Erro</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.content}>
                <Text style={styles.text}>Membro não encontrado.</Text>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MemberFormModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateMember}
        memberToEdit={member}
        organizationId={member.organization_id}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isDeleting}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Membro</Text>
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setIsEditModalVisible(true)} disabled={isDeleting}>
              <Ionicons name="pencil" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleDelete} disabled={isDeleting}>
              {isDeleting ? <ActivityIndicator size="small" color={theme.error} /> : <Ionicons name="trash" size={22} color={theme.error} />}
            </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
            {member.photo_url ? (
                <Image source={{ uri: member.photo_url }} style={styles.profilePhoto} />
            ) : (
                <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>{member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
            )}
            <Text style={styles.profileName}>{member.full_name}</Text>
            <Text style={styles.profileRole}>{member.membership_type}</Text>
             <View style={[styles.statusBadge, member.membership_status === 'Ativo' ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, member.membership_status === 'Ativo' ? styles.statusActiveText : styles.statusInactiveText]}>{member.membership_status}</Text>
            </View>
        </View>

        <View style={styles.detailsSection}>
            <DetailItem icon="mail-outline" label="Email" value={member.email} />
            <DetailItem icon="call-outline" label="Telefone" value={member.phone} />
            <DetailItem icon="transgender-outline" label="Gênero" value={member.gender} />
            <DetailItem icon="home-outline" label="Endereço" value={member.address} />
            <DetailItem icon="shield-half-outline" label="Contato de Emergência" value={member.emergency_contact} />
            <DetailItem icon="document-text-outline" label="Observações" value={member.notes} />
        </View>
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  headerButton: {
      padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingBottom: 40,
  },
  text: {
    fontSize: 16,
    color: theme.text,
  },
  profileHeader: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: theme.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
  },
  profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
  },
  profileAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.infoLight,
      justifyContent: 'center',
      alignItems: 'center',
  },
  profileAvatarText: {
      color: theme.primary,
      fontSize: 40,
      fontWeight: 'bold',
  },
  profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 16,
  },
  profileRole: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 4,
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
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
  },
  detailsSection: {
      marginTop: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.backgroundCard,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailIcon: {
      marginRight: 20,
      marginTop: 3,
  },
  detailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
  },
  detailValue: {
      fontSize: 16,
      color: theme.text,
  }
});

export default MemberDetailsScreen;
