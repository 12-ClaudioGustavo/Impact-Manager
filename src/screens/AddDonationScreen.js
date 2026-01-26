import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import Input from '../components/common/Input';

const AddDonationScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    donorName: '',
    donorContact: '',
    isAnonymous: false,
    donationType: 'Dinheiro',
    amount: '',
    description: '',
    deliveryMethod: 'Entrega',
    notes: '',
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (formData.donationType === 'Dinheiro') {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.amount = 'Valor deve ser maior que zero';
        }
      } else {
        if (!formData.description.trim()) {
          newErrors.description = 'Descrição é obrigatória';
        }
      }
    }

    if (step === 2 && !formData.isAnonymous) {
      if (!formData.donorName.trim()) {
        newErrors.donorName = 'Nome é obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setCurrentStep(2);
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

      if (userError || !userData)
        throw new Error('Não foi possível encontrar a organização do usuário.');

      const submissionData = {
        organization_id: userData.organization_id,
        donation_date: new Date().toISOString(),
        donor_name: formData.isAnonymous ? 'Anónimo' : formData.donorName,
        donor_contact: formData.isAnonymous ? null : formData.donorContact,
        is_anonymous: formData.isAnonymous,
        donation_type: formData.donationType,
        amount:
          formData.donationType === 'Dinheiro' ? parseFloat(formData.amount) : null,
        description:
          formData.donationType !== 'Dinheiro'
            ? formData.description
            : `Doação monetária de ${formData.amount} KZ`,
        delivery_method: formData.deliveryMethod,
        notes: formData.notes,
      };

      const { error } = await supabase.from('donations').insert([submissionData]);
      if (error) throw error;

      Alert.alert('Sucesso', 'Doação registada com sucesso!');

      // Notificar admins
      try {
        await supabase.functions.invoke('notify-new-donation', {
          body: {
            organization_id: submissionData.organization_id,
            donor_name: submissionData.donor_name,
            amount: submissionData.amount,
            donation_type: submissionData.donation_type,
          },
        });
      } catch (notifyError) {
        console.log('Notification error (non-critical):', notifyError);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error submitting donation:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao submeter a doação.');
    } finally {
      setLoading(false);
    }
  };

  const DonationTypeButton = ({ type, icon, label }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        formData.donationType === type && styles.typeButtonActive,
      ]}
      onPress={() => handleInputChange('donationType', type)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.typeIconContainer,
          {
            backgroundColor:
              formData.donationType === type
                ? theme.textOnPrimary + '20'
                : theme.primary + '20',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={formData.donationType === type ? theme.textOnPrimary : theme.primary}
        />
      </View>
      <Text
        style={[
          styles.typeLabel,
          formData.donationType === type && styles.typeLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const DeliveryMethodButton = ({ method, label, description }) => (
    <TouchableOpacity
      style={[
        styles.deliveryButton,
        formData.deliveryMethod === method && styles.deliveryButtonActive,
      ]}
      onPress={() => handleInputChange('deliveryMethod', method)}
      activeOpacity={0.7}
    >
      <View style={styles.deliveryButtonContent}>
        <View style={styles.radioOuter}>
          {formData.deliveryMethod === method && (
            <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
          )}
        </View>
        <View style={styles.deliveryText}>
          <Text
            style={[
              styles.deliveryLabel,
              formData.deliveryMethod === method && styles.deliveryLabelActive,
            ]}
          >
            {label}
          </Text>
          <Text style={styles.deliveryDescription}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const SummaryRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Ionicons name={icon} size={18} color={theme.primary} />
          <Text style={styles.summaryLabel}>{label}</Text>
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="gift" size={40} color={theme.primary} />
        <Text style={styles.stepTitle}>Detalhes da Doação</Text>
        <Text style={styles.stepSubtitle}>Selecione o tipo e valor da doação</Text>
      </View>

      <Text style={styles.sectionLabel}>Tipo de Doação</Text>
      <View style={styles.typeButtonsContainer}>
        <DonationTypeButton type="Dinheiro" icon="cash" label="Dinheiro" />
        <DonationTypeButton type="Comida" icon="fast-food" label="Comida" />
        <DonationTypeButton type="Bens" icon="cube" label="Bens" />
      </View>

      {formData.donationType === 'Dinheiro' ? (
        <Input
          label="Valor (Kz) *"
          value={formData.amount}
          onChangeText={(text) => handleInputChange('amount', text)}
          placeholder="0.00"
          keyboardType="numeric"
          icon="cash-outline"
          error={errors.amount}
        />
      ) : (
        <Input
          label="Descrição dos Itens *"
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          placeholder="Ex: 5kg de arroz, 2 cobertores..."
          multiline
          numberOfLines={4}
          icon="list-outline"
          error={errors.description}
        />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="person" size={40} color={theme.primary} />
        <Text style={styles.stepTitle}>Informações do Doador</Text>
        <Text style={styles.stepSubtitle}>Identifique quem está doando</Text>
      </View>

      <TouchableOpacity
        style={styles.anonymousToggle}
        onPress={() => handleInputChange('isAnonymous', !formData.isAnonymous)}
        activeOpacity={0.8}
      >
        <View style={styles.anonymousLeft}>
          <Ionicons name="eye-off" size={24} color={theme.primary} />
          <View>
            <Text style={styles.anonymousLabel}>Doação Anónima</Text>
            <Text style={styles.anonymousSubtext}>
              Manter identidade do doador privada
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.toggle,
            formData.isAnonymous && styles.toggleActive,
          ]}
        >
          <View
            style={[
              styles.toggleCircle,
              formData.isAnonymous && styles.toggleCircleActive,
            ]}
          />
        </View>
      </TouchableOpacity>

      <Input
        label="Nome Completo"
        value={formData.donorName}
        onChangeText={(text) => handleInputChange('donorName', text)}
        placeholder={
          formData.isAnonymous
            ? 'Não aplicável para doação anónima'
            : 'Nome do doador'
        }
        icon="person-outline"
        editable={!formData.isAnonymous}
        error={errors.donorName}
      />

      <Input
        label="Contacto (Email ou Telefone)"
        value={formData.donorContact}
        onChangeText={(text) => handleInputChange('donorContact', text)}
        placeholder="Opcional"
        icon="call-outline"
        editable={!formData.isAnonymous}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="checkmark-circle" size={40} color={theme.primary} />
        <Text style={styles.stepTitle}>Confirmação</Text>
        <Text style={styles.stepSubtitle}>Revise e confirme os dados</Text>
      </View>

      <Text style={styles.sectionLabel}>Método de Entrega</Text>
      <View style={styles.deliveryContainer}>
        <DeliveryMethodButton
          method="Entrega"
          label="Entregar na Instituição"
          description="O doador levará os itens"
        />
        <DeliveryMethodButton
          method="Recolha"
          label="Solicitar Recolha"
          description="A organização irá buscar"
        />
      </View>

      <Input
        label="Notas Adicionais"
        value={formData.notes}
        onChangeText={(text) => handleInputChange('notes', text)}
        placeholder="Instruções especiais, horários, etc."
        multiline
        numberOfLines={3}
        icon="document-text-outline"
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="receipt" size={24} color={theme.primary} />
          <Text style={styles.summaryTitle}>Resumo da Doação</Text>
        </View>

        <SummaryRow
          icon="person-outline"
          label="Doador"
          value={formData.isAnonymous ? 'Anónimo' : formData.donorName}
        />
        <SummaryRow
          icon="gift-outline"
          label="Tipo"
          value={formData.donationType}
        />
        {formData.donationType === 'Dinheiro' ? (
          <SummaryRow
            icon="cash-outline"
            label="Valor"
            value={`${formData.amount} Kz`}
          />
        ) : (
          <SummaryRow
            icon="list-outline"
            label="Itens"
            value={formData.description}
          />
        )}
        <SummaryRow
          icon="car-outline"
          label="Entrega"
          value={
            formData.deliveryMethod === 'Entrega'
              ? 'A entregar na instituição'
              : 'Recolha solicitada'
          }
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient
        colors={isDarkMode ? [theme.gradientStart, theme.gradientEnd] : [theme.primary, theme.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (currentStep === 1 ? navigation.goBack() : handleBack())}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Doação</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>Passo {currentStep} de 3</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {currentStep < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, currentStep === 1 && { flex: 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.textOnPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Text style={styles.submitButtonText}>A Submeter...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.textOnPrimary}
                  />
                  <Text style={styles.submitButtonText}>Confirmar Doação</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.textOnPrimary,
    },
    progressContainer: {
      gap: 8,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.textOnPrimary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    stepContainer: {
      gap: 20,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 8,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.text,
      marginTop: 12,
    },
    stepSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    typeButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    typeLabelActive: {
      color: theme.textOnPrimary,
    },
    anonymousToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.backgroundCard,
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    anonymousLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    anonymousLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    anonymousSubtext: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    toggle: {
      width: 52,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: theme.primary,
    },
    toggleCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'white',
    },
    toggleCircleActive: {
      alignSelf: 'flex-end',
    },
    deliveryContainer: {
      gap: 12,
      marginBottom: 20,
    },
    deliveryButton: {
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    deliveryButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    deliveryButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    deliveryText: {
      flex: 1,
    },
    deliveryLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    deliveryLabelActive: {
      color: theme.primary,
    },
    deliveryDescription: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    summaryCard: {
      backgroundColor: theme.backgroundCard,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border + '50',
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'right',
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.backgroundCard,
      gap: 12,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor: theme.backgroundCard,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor: theme.success,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textOnPrimary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });

export default AddDonationScreen;