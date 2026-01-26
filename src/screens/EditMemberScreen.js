import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const EditMemberScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();
  const { member } = route.params;

  const [formData, setFormData] = useState({
    full_name: member.full_name,
    email: member.email || '',
    phone_number: member.phone_number || '',
    membership_status: member.membership_status,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ ...formData })
        .eq('id', member.id);
        
      if (error) throw error;
      
      Alert.alert("Sucesso", "Membro atualizado com sucesso!");
      navigation.goBack();

    } catch (error) {
        console.error("Error updating member:", error);
        Alert.alert("Erro", "Não foi possível atualizar o membro.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Membro</Text>
        <View style={{width: 24}} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Input
          label="Nome Completo"
          value={formData.full_name}
          onChangeText={(text) => handleInputChange('full_name', text)}
        />
        <Input
          label="Email"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          keyboardType="email-address"
        />
        <Input
          label="Telefone"
          value={formData.phone_number}
          onChangeText={(text) => handleInputChange('phone_number', text)}
          keyboardType="phone-pad"
        />
        {/* Adicionar um seletor para o status aqui seria o ideal, mas por enquanto usamos Input */}
        <Input
          label="Estado da Matrícula (Ex: Ativo, Inativo)"
          value={formData.membership_status}
          onChangeText={(text) => handleInputChange('membership_status', text)}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
            title={loading ? "A Atualizar..." : "Guardar Alterações"}
            onPress={handleUpdate}
            loading={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  form: { padding: 20 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: theme.border },
});

export default EditMemberScreen;
