import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import AdBanner from '../components/AdBanner';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [orgName, setOrgName] = useState('Minha Organização');
  const [greeting, setGreeting] = useState('Olá');
  const [stats, setStats] = useState({
    members: 0,
    donations: 0,
    events: 0,
    upcomingEvents: 0
  });
  const [activities, setActivities] = useState([]);
  const [quickInsights, setQuickInsights] = useState({
    thisMonth: 0,
    lastMonth: 0,
    percentageChange: 0
  });

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Bom dia');
      else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');

      if (session.user.user_metadata?.full_name) {
         setUserName(session.user.user_metadata.full_name.split(' ')[0]);
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError) {
        console.log('Note: Could not fetch public user profile');
      } else if (userData) {
        if (userData.full_name) setUserName(userData.full_name.split(' ')[0]);
        
        const orgId = userData.organization_id;
        if (orgId) {
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
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [membersCount, donationsSum, eventsCount, upcomingEventsCount, donationsThisMonth, donationsLastMonth] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('donations').select('amount').eq('organization_id', orgId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gte('start_date', now.toISOString()),
        supabase.from('donations').select('amount').eq('organization_id', orgId).gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('donations').select('amount').eq('organization_id', orgId).gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString())
      ]);

      const totalDonations = donationsSum.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const thisMonthTotal = donationsThisMonth.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const lastMonthTotal = donationsLastMonth.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      
      const percentageChange = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : thisMonthTotal > 0 ? 100 : 0;

      setStats({
        members: membersCount.count || 0,
        donations: totalDonations,
        events: eventsCount.count || 0,
        upcomingEvents: upcomingEventsCount.count || 0
      });

      setQuickInsights({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        percentageChange: percentageChange
      });

      const [recentMembers, recentDonations, recentEvents] = await Promise.all([
        supabase.from('members').select('full_name, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3),
        supabase.from('donations').select('donor_name, amount, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3),
        supabase.from('events').select('title, start_date, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3)
      ]);

      const newActivities = [
        ...(recentMembers.data || []).map(m => ({
          type: 'member',
          title: 'Novo membro',
          description: m.full_name,
          date: new Date(m.created_at),
          icon: 'person-add',
          color: theme.primary
        })),
        ...(recentDonations.data || []).map(d => ({
          type: 'donation',
          title: 'Doação recebida',
          description: `${d.donor_name} • ${formatCurrency(Number(d.amount))}`,
          date: new Date(d.created_at),
          icon: 'cash',
          color: theme.success
        })),
        ...(recentEvents.data || []).map(e => ({
          type: 'event',
          title: 'Novo evento',
          description: e.title,
          date: new Date(e.created_at),
          icon: 'calendar',
          color: theme.warning
        }))
      ]
      .sort((a, b) => b.date - a.date)
      .slice(0, 6);

      setActivities(newActivities);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      notation: value > 10000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h atrás`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-AO');
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  const StatCard = ({ icon, value, label, trend, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? theme.success + '20' : theme.error + '20' }]}>
            <Ionicons 
              name={trend >= 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend >= 0 ? theme.success : theme.error} 
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? theme.success : theme.error }]}>
              {Math.abs(trend).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const QuickActionCard = ({ icon, title, color, onPress, badge }) => (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
        {badge > 0 && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
  
  const ActivityItem = ({ icon, title, description, time, iconColor }) => (
    <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
      <View style={[styles.activityIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDescription} numberOfLines={1}>{description}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]} 
          />
        }
      >
        {/* Header */}
        <LinearGradient 
          colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]} 
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/icon-removebg-preview.png')} 
                style={styles.logo} 
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
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.textOnPrimary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Insight Card */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up" size={20} color={theme.textOnPrimary} />
              <Text style={styles.insightTitle}>Doações este mês</Text>
            </View>
            <Text style={styles.insightValue}>{formatCurrency(quickInsights.thisMonth)}</Text>
            <View style={styles.insightFooter}>
              <Text style={styles.insightCompare}>
                vs. {formatCurrency(quickInsights.lastMonth)} mês passado
              </Text>
              {quickInsights.percentageChange !== 0 && (
                <View style={[styles.insightBadge, { 
                  backgroundColor: quickInsights.percentageChange >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)' 
                }]}>
                  <Ionicons 
                    name={quickInsights.percentageChange >= 0 ? 'arrow-up' : 'arrow-down'} 
                    size={12} 
                    color={quickInsights.percentageChange >= 0 ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[styles.insightBadgeText, { 
                    color: quickInsights.percentageChange >= 0 ? '#4CAF50' : '#F44336' 
                  }]}>
                    {Math.abs(quickInsights.percentageChange).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            icon="people" 
            value={stats.members} 
            label="Membros" 
            color={theme.primary}
          />
          <StatCard 
            icon="heart" 
            value={formatCurrency(stats.donations)} 
            label="Total Arrecadado" 
            color={theme.success}
            trend={quickInsights.percentageChange}
          />
          <StatCard 
            icon="calendar" 
            value={stats.events} 
            label="Eventos" 
            color={theme.warning}
          />
          <StatCard 
            icon="calendar-outline" 
            value={stats.upcomingEvents} 
            label="Próximos Eventos" 
            color={theme.info}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.seeAllText}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsContainer}>
            <QuickActionCard 
              icon="person-add" 
              title="Novo Membro" 
              color={theme.primary} 
              onPress={() => navigation.navigate('Members', { screen: 'MembersList', params: { action: 'add' } })} 
            />
            <QuickActionCard 
              icon="cash" 
              title="Registrar Doação" 
              color={theme.success} 
              onPress={() => navigation.navigate('Donations', { screen: 'AddDonation' })} 
            />
            <QuickActionCard 
              icon="calendar-sharp" 
              title="Criar Evento" 
              color={theme.warning} 
              badge={stats.upcomingEvents}
              onPress={() => navigation.navigate('Events', { screen: 'EventsList', params: { action: 'add' } })} 
            />
            <QuickActionCard 
              icon="stats-chart" 
              title="Relatórios" 
              color={theme.info} 
              onPress={() => Alert.alert("Em Breve", "A secção de relatórios está em desenvolvimento.")} 
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando atividades...</Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="documents-outline" size={48} color={theme.textLight} />
              <Text style={styles.emptyStateTitle}>Nenhuma atividade recente</Text>
              <Text style={styles.emptyStateText}>
                Comece adicionando membros, registrando doações ou criando eventos
              </Text>
            </View>
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

        <AdBanner />
        <View style={{ height: 20 }} />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  headerTitle: {
    color: theme.textOnPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 20,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.error,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    color: theme.textOnPrimary,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  insightValue: {
    color: theme.textOnPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightCompare: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionTitle: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  activityItem: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  activityDescription: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    color: theme.textLight,
    fontSize: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DashboardScreen;