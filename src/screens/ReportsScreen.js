import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const ReportCard = ({ title, value, icon, color }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundCard }]}>
      <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
      <Text style={[styles.cardValue, { color: color || theme.text }]}>{value}</Text>
    </View>
  );
};

const ReportsScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDonations: 0,
    upcomingEvents: 0,
  });
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilizador não encontrado');

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (!profile || !profile.organization_id) throw new Error('Organização não encontrada');
        
        const orgId = profile.organization_id;

        const [membersRes, donationsRes, eventsRes, recentMembersRes] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('donations').select('amount').eq('organization_id', orgId),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gt('start_date', new Date().toISOString()),
          supabase.from('members').select('full_name, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5)
        ]);

        const totalDonations = donationsRes.data?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
        
        setStats({
          totalMembers: membersRes.count || 0,
          totalDonations: totalDonations,
          upcomingEvents: eventsRes.count || 0,
        });

        setRecentMembers(recentMembersRes.data || []);

      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados para os relatórios.');
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);
  
  const formatCurrency = (value) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <Text style={[styles.header, { color: theme.text }]}>Relatórios</Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>RESUMO GERAL</Text>
          <View style={styles.summaryGrid}>
            <ReportCard title="Total de Membros" value={stats.totalMembers} color={theme.primary} />
            <ReportCard title="Eventos Futuros" value={stats.upcomingEvents} color={theme.warning} />
          </View>
          <ReportCard title="Total Arrecadado" value={formatCurrency(stats.totalDonations)} color={theme.success} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ÚLTIMOS MEMBROS REGISTRADOS</Text>
          <View style={[styles.listContainer, { backgroundColor: theme.backgroundCard }]}>
            {recentMembers.length > 0 ? recentMembers.map(member => (
              <View key={member.created_at} style={[styles.listItem, { borderBottomColor: theme.border }]}>
                <Text style={{ color: theme.text }}>{member.full_name}</Text>
                <Text style={{ color: theme.textSecondary }}>{new Date(member.created_at).toLocaleDateString()}</Text>
              </View>
            )) : <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nenhum membro recente.</Text>}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  card: { borderRadius: 12, padding: 16, marginBottom: 10, flexBasis: '48%' },
  cardTitle: { fontSize: 14, marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  listContainer: { borderRadius: 12, padding: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  emptyText: { padding: 12, fontStyle: 'italic' }
});

export default ReportsScreen;
