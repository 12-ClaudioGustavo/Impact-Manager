
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const AddEvent = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleAddEvent = async () => {
    if (!title || !date) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Erro', 'Sessão não encontrada.');
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user's organization", userError);
        Alert.alert('Erro', 'Não foi possível encontrar a organização do usuário.');
        setLoading(false);
        return;
      }

      const orgId = userData.organization_id;

      const { error: insertError } = await supabase
        .from('events')
        .insert([
          { title, date, description, organization_id: orgId },
        ]);

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Sucesso', 'Evento adicionado com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o evento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Título*</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Digite o título do evento"
      />
      <Text style={styles.label}>Data*</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="Digite a data do evento"
      />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Digite a descrição do evento"
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddEvent} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Adicionando...' : 'Adicionar Evento'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  label: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: theme.text,
    backgroundColor: theme.inputBackground,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddEvent;