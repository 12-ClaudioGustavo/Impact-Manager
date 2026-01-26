import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const EventsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'past'
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    thisMonth: 0
  });

  useEffect(() => {
    if (route.params?.action === 'add') {
      navigation.navigate('AddEvent');
      navigation.setParams({ action: null });
    }
  }, [route.params?.action]);

  const fetchEventData = useCallback(async () => {
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
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', orgId)
          .order('date', { ascending: true });

        if (eventsError) {
          console.error("Error fetching events", eventsError);
          Alert.alert("Erro", "Não foi possível buscar os eventos.");
        } else {
          setEvents(eventsData || []);
          
          // Calcular estatísticas
          const now = new Date();
          const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          const upcomingCount = eventsData.filter(e => new Date(e.date) >= now).length;
          const pastCount = eventsData.filter(e => new Date(e.date) < now).length;
          const thisMonthCount = eventsData.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= firstDayThisMonth && eventDate <= lastDayThisMonth;
          }).length;
          
          setStats({
            total: eventsData.length,
            upcoming: upcomingCount,
            past: pastCount,
            thisMonth: thisMonthCount
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching events", error);
      Alert.alert("Erro", "Ocorreu um erro inesperado ao buscar os eventos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchEventData();
    }, [fetchEventData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEventData();
  }, [fetchEventData]);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    const now = new Date();
    
    // Filtrar por status
    if (filterStatus === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= now);
    } else if (filterStatus === 'past') {
      filtered = filtered.filter(e => new Date(e.date) < now);
    }
    
    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  }, [events, searchQuery, filterStatus]);

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

  const EventItem = ({ item, index }) => {
    const animatedValue = new Animated.Value(0);
    const eventDate = new Date(item.date);
    const now = new Date();
    const isUpcoming = eventDate >= now;
    const isPast = eventDate < now;
    const isToday = eventDate.toDateString() === now.toDateString();
    
    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const formatDate = (date) => {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('pt-BR', options);
    };

    const formatTime = (date) => {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <Animated.View style={{ opacity: animatedValue }}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.eventItem}>
            <View style={styles.eventLeft}>
              <LinearGradient
                colors={
                  isToday 
                    ? [theme.primary + '60', theme.primary] 
                    : isUpcoming 
                    ? [theme.success + '40', theme.success + '80']
                    : [theme.textLight + '40', theme.textLight + '60']
                }
                style={styles.eventDateBadge}
              >
                <Text style={styles.eventDateDay}>
                  {eventDate.getDate()}
                </Text>
                <Text style={styles.eventDateMonth}>
                  {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                </Text>
              </LinearGradient>
              
              <View style={styles.eventInfo}>
                <View style={styles.eventTitleRow}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>HOJE</Text>
                    </View>
                  )}
                </View>
                
                {item.location && (
                  <View style={styles.eventMeta}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.eventMetaText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                )}
                
                <View style={styles.eventMeta}>
                  <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                  <Text style={styles.eventMetaText}>
                    {formatTime(eventDate)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.eventRight}>
              <View style={[
                styles.statusBadge,
                isUpcoming ? styles.statusUpcoming : styles.statusPast
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isUpcoming ? theme.success : theme.textLight }
                ]} />
                <Text style={[
                  styles.statusText,
                  isUpcoming ? styles.statusUpcomingText : styles.statusPastText
                ]}>
                  {isUpcoming ? 'Próximo' : 'Passado'}
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
          placeholder="Buscar eventos..."
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
        <FilterChip label="Próximos" value="upcoming" count={stats.upcoming} />
        <FilterChip label="Passados" value="past" count={stats.past} />
      </View>

      {stats.thisMonth > 0 && (
        <View style={styles.insightCard}>
          <Ionicons name="calendar" size={20} color={theme.primary} />
          <Text style={styles.insightText}>
            {stats.thisMonth} {stats.thisMonth === 1 ? 'evento' : 'eventos'} este mês
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
            <Text style={styles.headerTitle}>Eventos</Text>
            <Text style={styles.headerSubtitle}>
              {stats.total} {stats.total === 1 ? 'evento registrado' : 'eventos registrados'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('AddEvent')}
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
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <EventItem item={item} index={index} />}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={64} color={theme.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum evento cadastrado'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? `Não encontramos eventos para "${searchQuery}"`
                  : 'Comece adicionando o primeiro evento da sua organização'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddEvent')}
                >
                  <Ionicons name="add-circle" size={20} color={theme.textOnPrimary} />
                  <Text style={styles.emptyButtonText}>Adicionar Evento</Text>
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
    backgroundColor: theme.primaryLight,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: theme.primary,
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
  eventItem: {
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
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventDateBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventDateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  todayBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textOnPrimary,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventMetaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  eventRight: {
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
  statusUpcoming: {
    backgroundColor: theme.successLight,
  },
  statusPast: {
    backgroundColor: theme.background,
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
  statusUpcomingText: {
    color: theme.success,
  },
  statusPastText: {
    color: theme.textLight,
  },
});

export default EventsScreen;