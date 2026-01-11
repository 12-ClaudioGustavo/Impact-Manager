import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState('Minha Organização');
  const [greeting, setGreeting] = useState('Olá');
  const [stats, setStats] = useState({
    members: 0,
    donations: 0,
    events: 0
  });
  const [activities, setActivities] = useState([]);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Set greeting
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Bom dia');
      else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');

      // 1. Get User Name from Session Metadata (Primary Source)
      if (session.user.user_metadata?.full_name) {
         setUserName(session.user.user_metadata.full_name.split(' ')[0]);
      }

      // 2. Try to fetch User & Org ID from DB (Secondary Source)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError) {
        console.log('Note: Could not fetch public user profile (likely RLS or not created yet). Using session data.');
        // Não redirecionamos mais aqui, pois temos os dados da sessão para mostrar a tela
      } else if (userData) {
        // Se tiver dados no banco, atualizamos/sobrescrevemos
        if (userData.full_name) setUserName(userData.full_name.split(' ')[0]);
        
        const orgId = userData.organization_id;
        if (orgId) {
           // Fetch Org Name separately
           const { data: orgData } = await supabase
             .from('organizations')
             .select('name')
             .eq('id', orgId)
             .single();
             
           if (orgData?.name) setOrgName(orgData.name);

           await fetchDashboardStats(orgId);
        }
      }
      
    } catch (error) {
      console.log('General error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDashboardStats = async (orgId) => {
    try {
      // Parallel requests for stats
      const [membersCount, donationsSum, eventsCount] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('donations').select('amount').eq('organization_id', orgId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
      ]);

      // Calculate total donations
      const totalDonations = donationsSum.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

      setStats({
        members: membersCount.count || 0,
        donations: totalDonations,
        events: eventsCount.count || 0
      });

      // Fetch recent activities (Members + Donations + Events)
      const [recentMembers, recentDonations, recentEvents] = await Promise.all([
        supabase.from('members').select('full_name, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3),
        supabase.from('donations').select('donor_name, amount, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3),
        supabase.from('events').select('title, start_date, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3)
      ]);

      // Normalize and combine activities
      const newActivities = [
        ...(recentMembers.data || []).map(m => ({
          type: 'member',
          title: 'Novo membro',
          description: m.full_name,
          date: new Date(m.created_at),
          icon: 'person-add',
          color: '#2563EB'
        })),
        ...(recentDonations.data || []).map(d => ({
          type: 'donation',
          title: 'Doação recebida',
          description: `R$ ${Number(d.amount).toFixed(2)}`,
          date: new Date(d.created_at),
          icon: 'cash',
          color: '#10B981'
        })),
        ...(recentEvents.data || []).map(e => ({
          type: 'event',
          title: 'Novo evento',
          description: e.title,
          date: new Date(e.created_at),
          icon: 'calendar',
          color: '#F59E0B'
        }))
      ]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5); // Take top 5

      setActivities(newActivities);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'AOA',
      notation: value > 10000 ? 'compact' : 'standard'
    }).format(value);
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h atrás`;
    return `${Math.floor(hours / 24)} dias atrás`;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#2563EB']} 
          />
        }
      >
        {/* Header */}
        <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/icon-removebg-preview.png')} 
                style={{ width: 50, height: 50, marginRight: 12 }} 
                resizeMode="contain"
              />
              <View>
                <Text style={styles.headerTitle}>
                  {loading ? '...' : `${greeting}, ${userName}!`}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {loading ? 'Carregando...' : orgName}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardFirst]}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.members}</Text>
              <Text style={styles.statLabel}>Membros</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMiddle]}>
              <Ionicons name="heart" size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>{formatCurrency(stats.donations)}</Text>
              <Text style={styles.statLabel}>Doações</Text>
            </View>
            <View style={[styles.statCard, styles.statCardLast]}>
              <Ionicons name="calendar" size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>{stats.events}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsContainer}>
            <QuickActionCard icon="person-add" title="Novo Membro" color="#2563EB" />
            <QuickActionCard icon="cash" title="Registrar Doação" color="#10B981" />
            <QuickActionCard icon="calendar-sharp" title="Criar Evento" color="#F59E0B" />
            <QuickActionCard icon="document-text" title="Relatórios" color="#8B5CF6" />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          {activities.length === 0 ? (
            <Text style={{ color: '#6B7280', fontStyle: 'italic' }}>Nenhuma atividade recente.</Text>
          ) : (
            activities.map((item, index) => (
              <ActivityItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                time={formatTimeAgo(item.date)}
                iconColor={item.color}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const QuickActionCard = ({ icon, title, color }) => (
  <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
    <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, title, description, time, iconColor }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIconContainer, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityDescription}>{description}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
  },
  statCardFirst: {
    marginRight: 8,
  },
  statCardMiddle: {
    marginHorizontal: 4,
  },
  statCardLast: {
    marginLeft: 8,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#DBEAFE',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 14,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
  activityDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  activityTime: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
});

export default DashboardScreen;