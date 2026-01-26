import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import MemberFormModal from '../components/MemberFormModal';

const MemberDetailsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();
  const { memberId } = route.params;

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);

  const fetchMemberDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('auth_id', session.user.id)
          .single();
        
        if (userData) {
          setOrganizationId(userData.organization_id);
        }
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      console.error('Error fetching member details:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do membro.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      fetchMemberDetails();
    }, [fetchMemberDetails])
  );

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir "${member.full_name}"? Esta ação não pode ser revertida.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Deletar foto do storage se existir
              if (member.photo_url) {
                const fileName = member.photo_url.split('/').pop();
                await supabase.storage.from('member-photos').remove([fileName]);
              }

              const { error } = await supabase.from('members').delete().eq('id', memberId);
              if (error) throw error;

              Alert.alert('Sucesso', 'Membro excluído com sucesso.');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir:', error);
              Alert.alert('Erro', 'Não foi possível excluir o membro.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateMember = async (memberData) => {
    try {
      const { error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', memberId);

      if (error) throw error;

      Alert.alert('Sucesso', 'Membro atualizado com sucesso!');
      setEditModalVisible(false);
      fetchMemberDetails();
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o membro.');
    }
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('Aviso', 'Número de telefone não disponível.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('Aviso', 'Email não disponível.');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativo':
        return theme.success;
      case 'Inativo':
        return theme.error;
      case 'Suspenso':
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  const InfoCard = ({ icon, label, value, onPress, actionIcon }) => (
    <TouchableOpacity
      style={styles.infoCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoCardLeft}>
        <View style={[styles.infoIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {value || 'Não informado'}
          </Text>
        </View>
      </View>
      {actionIcon && onPress && (
        <Ionicons name={actionIcon} size={20} color={theme.textLight} />
      )}
    </TouchableOpacity>
  );

  const ActionButton = ({ icon, label, onPress, color, variant = 'primary' }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === 'outline' && styles.actionButtonOutline,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionButtonIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.textLight} />
          <Text style={styles.errorTitle}>Membro não encontrado</Text>
          <Text style={styles.errorText}>
            Não foi possível localizar este membro.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient
        colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil do Membro</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {member.photo_url ? (
            <Image source={{ uri: member.photo_url }} style={styles.profilePhoto} />
          ) : (
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileAvatarText}>
                {member.full_name?.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <Text style={styles.profileName}>{member.full_name}</Text>
          {member.membership_type && (
            <View style={styles.profileBadge}>
              <Ionicons name="ribbon" size={14} color={theme.textOnPrimary} />
              <Text style={styles.profileBadgeText}>{member.membership_type}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(member.membership_status) + '30' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(member.membership_status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(member.membership_status) },
              ]}
            >
              {member.membership_status}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="call"
              label="Ligar"
              color={theme.success}
              onPress={() => handleCall(member.phone)}
            />
            <ActionButton
              icon="mail"
              label="Email"
              color={theme.info}
              onPress={() => handleEmail(member.email)}
            />
            <ActionButton
              icon="create"
              label="Editar"
              color={theme.warning}
              onPress={() => setEditModalVisible(true)}
            />
          </View>
        </View>

        {/* Informações de Contato */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Informações de Contato</Text>
          </View>
          <InfoCard
            icon="mail-outline"
            label="Email"
            value={member.email}
            onPress={member.email ? () => handleEmail(member.email) : null}
            actionIcon={member.email ? 'open-outline' : null}
          />
          <InfoCard
            icon="call-outline"
            label="Telefone"
            value={member.phone}
            onPress={member.phone ? () => handleCall(member.phone) : null}
            actionIcon={member.phone ? 'call-outline' : null}
          />
          <InfoCard
            icon="location-outline"
            label="Endereço"
            value={member.address}
          />
        </View>

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          </View>
          <InfoCard icon="male-female-outline" label="Gênero" value={member.gender} />
          <InfoCard
            icon="calendar-outline"
            label="Data de Nascimento"
            value={member.birth_date ? formatDate(member.birth_date) : 'Não informado'}
          />
          <InfoCard
            icon="alert-circle-outline"
            label="Contato de Emergência"
            value={member.emergency_contact}
            onPress={
              member.emergency_contact
                ? () => handleCall(member.emergency_contact)
                : null
            }
            actionIcon={member.emergency_contact ? 'call-outline' : null}
          />
        </View>

        {/* Informações de Membro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Informações de Membro</Text>
          </View>
          <InfoCard
            icon="ribbon-outline"
            label="Tipo de Membro"
            value={member.membership_type}
          />
          <InfoCard
            icon="calendar-outline"
            label="Data de Ingresso"
            value={formatDate(member.created_at)}
          />
          <InfoCard
            icon="time-outline"
            label="Última Atualização"
            value={formatDate(member.updated_at)}
          />
        </View>

        {/* Observações */}
        {member.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Observações</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{member.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <MemberFormModal
        isVisible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleUpdateMember}
        organizationId={organizationId}
        memberToEdit={member}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    errorButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    errorButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
    profileSection: {
      alignItems: 'center',
    },
    profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileAvatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
      marginTop: 16,
    },
    profileBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginTop: 8,
      gap: 6,
    },
    profileBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      marginTop: 12,
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    actionsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: theme.backgroundCard,
      padding: 16,
      borderRadius: 16,
      gap: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      elevation: 2,
    },
    actionButtonOutline: {
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundCard,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 2,
      elevation: 2,
    },
    infoCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    notesCard: {
      backgroundColor: theme.backgroundCard,
      padding: 16,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 2,
      elevation: 2,
    },
    notesText: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
    },
  });

export default MemberDetailsScreen;