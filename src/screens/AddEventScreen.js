import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const AddEventScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (date) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o título do evento.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada.');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_id', session.user.id)
        .single();

      if (userError || !userData) throw new Error('Não foi possível encontrar a organização do usuário.');

      const { error } = await supabase
        .from('events')
        .insert([{ 
          title: title.trim(), 
          date: date.toISOString(), 
          description: description.trim() || null,
          location: location.trim() || null,
          organization_id: userData.organization_id 
        }]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Evento adicionado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o evento.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, multiline, icon, editable = true, onPress }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon && (
          <View style={styles.inputIconContainer}>
            <Ionicons name={icon} size={20} color={theme.iconColorLight} />
          </View>
        )}
        <TouchableOpacity 
          style={[styles.input, !editable && styles.inputTouchable]} 
          onPress={editable ? undefined : onPress}
          disabled={editable}
          activeOpacity={0.7}
        >
          {editable ? (
            <Text
              style={[
                styles.inputText,
                multiline && styles.inputTextMultiline,
                !value && styles.inputPlaceholder
              ]}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={theme.inputPlaceholder}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
            >
              {value || placeholder}
            </Text>
          ) : (
            <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
              {value || placeholder}
            </Text>
          )}
        </TouchableOpacity>
        {!editable && (
          <Ionicons name="chevron-forward" size={20} color={theme.iconColorLight} style={styles.inputChevron} />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient 
        colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Novo Evento</Text>
            <Text style={styles.headerSubtitle}>Preencha as informações abaixo</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Título */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Título do Evento <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="text-outline" size={20} color={theme.iconColorLight} />
              </View>
              <input
                style={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião de Planejamento"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
          </View>

          {/* Data */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Data <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity 
              style={styles.inputWrapper}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={theme.iconColorLight} />
              </View>
              <View style={styles.input}>
                <Text style={styles.inputText}>{formatDate(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.iconColorLight} style={styles.inputChevron} />
            </TouchableOpacity>
          </View>

          {/* Horário */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Horário</Text>
            <TouchableOpacity 
              style={styles.inputWrapper}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons name="time-outline" size={20} color={theme.iconColorLight} />
              </View>
              <View style={styles.input}>
                <Text style={styles.inputText}>{formatTime(date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.iconColorLight} style={styles.inputChevron} />
            </TouchableOpacity>
          </View>

          {/* Localização */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Localização</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="location-outline" size={20} color={theme.iconColorLight} />
              </View>
              <input
                style={styles.input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Sala de Conferências, Auditório..."
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
              <View style={[styles.inputIconContainer, styles.inputIconTop]}>
                <Ionicons name="document-text-outline" size={20} color={theme.iconColorLight} />
              </View>
              <textarea
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite uma descrição para o evento..."
                placeholderTextColor={theme.inputPlaceholder}
                rows={4}
              />
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              Os campos marcados com <Text style={styles.required}>*</Text> são obrigatórios
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleAddEvent}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [theme.inputDisabled, theme.inputDisabled] : [theme.primary, theme.primaryDark]}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={theme.textOnPrimary} />
                <Text style={styles.saveButtonText}>Salvar Evento</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
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
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textOnPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 4,
  },
  required: {
    color: theme.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    minHeight: 52,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.shadowOpacity,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputIconTop: {
    alignSelf: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputTouchable: {
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    color: theme.text,
  },
  inputTextMultiline: {
    minHeight: 100,
  },
  inputPlaceholder: {
    color: theme.inputPlaceholder,
  },
  inputChevron: {
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.primary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.backgroundCard,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textOnPrimary,
  },
});

export default AddEventScreen;