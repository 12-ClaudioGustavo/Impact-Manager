import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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

const EventsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          .eq('organization_id', orgId);

        if (eventsError) {
          console.error("Error fetching events", eventsError);
          Alert.alert("Erro", "Não foi possível buscar os eventos.");
        } else {
          setEvents(eventsData || []);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEventScreen')}>
          <Ionicons name="add" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={events.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  addButton: {
    padding: 8,
  },
  loader: {
    marginTop: 20,
  },
  eventItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.backgroundCard,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  eventDate: {
    fontSize: 14,
    color: theme.textLight,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textLight,
  },
});
export default EventsScreen;
