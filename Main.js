import React, { useState } from 'react';
import { View, Text, TextInput, ImageBackground, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);

  const handleLogin = () => {
    Alert.alert('Login', `Email: ${email}\nSenha: ${senha}\nLembrar: ${lembrar}`);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      {/* Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f' }}
        style={styles.background}
        imageStyle={{ opacity: 0.5 }}
      >
        <View style={styles.overlay} />

        {/* Form container */}
        <View style={styles.formContainer}>
          {/* Header */}
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>

          {/* Form */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {/* Lembrar e esqueci senha */}
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setLembrar(!lembrar)} style={styles.checkboxContainer}>
              <View style={[styles.checkbox, lembrar && styles.checkboxChecked]} />
              <Text style={styles.checkboxLabel}>Lembrar-me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgot}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          {/* Botão */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Não tem conta?{' '}
            <Text style={styles.footerLink}>Criar agora</Text>
          </Text>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,18,18,0.7)',
  },
  formContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(28,28,28,0.85)',
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#ccc',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(38,38,38,0.9)',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#5f5fff',
    marginRight: 8,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#5f5fff',
  },
  checkboxLabel: {
    color: '#aaa',
  },
  forgot: {
    color: '#5f5fff',
  },
  button: {
    backgroundColor: '#5f5fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#888',
    marginTop: 18,
  },
  footerLink: {
    color: '#5f5fff',
    fontWeight: '600',
  },
});
