import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { supabase } from '../lib/supabase';

const ChangePasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Erro', 'A palavra-passe deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao Atualizar', error.message);
    } else {
      Alert.alert('Sucesso', 'A sua palavra-passe foi alterada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>Alterar Palavra-passe</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Introduza a sua nova palavra-passe abaixo.
        </Text>
        
        <Input
          label="Nova Palavra-passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Pelo menos 6 caracteres"
        />
        <Input
          label="Confirmar Nova Palavra-passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Repita a palavra-passe"
        />

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <Button title="Guardar Alterações" onPress={handleUpdatePassword} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 20,
  }
});

export default ChangePasswordScreen;
