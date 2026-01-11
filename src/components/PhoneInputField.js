import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import * as Location from 'expo-location';

const PhoneInputField = forwardRef(({
  value,
  onChangeFormattedText,
  onChangeText,
  label = "Telefone",
  placeholder = "Digite seu telefone",
  containerStyle,
  error,
  disabled = false
}, ref) => {
  const [countryCode, setCountryCode] = useState('BR');
  const phoneInputRef = useRef(null);

  useEffect(() => {
    detectCountry();
  }, []);

  const detectCountry = async () => {
    try {
      // Tentar detectar país por localização
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});

        // Usar API do BigDataCloud para reverse geocoding (grátis, sem API key)
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&localityLanguage=pt`
        );

        const data = await response.json();

        if (data.countryCode) {
          setCountryCode(data.countryCode);
          console.log('🌍 País detectado:', data.countryCode, '-', data.countryName);
        }
      } else {
        // Fallback: detectar por timezone
        detectByTimezone();
      }
    } catch (error) {
      console.log('⚠️ Erro ao detectar país, usando padrão BR');
      detectByTimezone();
    }
  };

  const detectByTimezone = () => {
    // Mapear timezone para país (aproximado)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneToCountry = {
      'America/Sao_Paulo': 'BR',
      'America/Fortaleza': 'BR',
      'America/Recife': 'BR',
      'America/Manaus': 'BR',
      'America/Campo_Grande': 'BR',
      'America/Cuiaba': 'BR',
      'America/Porto_Velho': 'BR',
      'America/Boa_Vista': 'BR',
      'America/Rio_Branco': 'BR',
      'America/Noronha': 'BR',
      'America/Belem': 'BR',
      'America/Maceio': 'BR',
      'America/Bahia': 'BR',
      'America/Santarem': 'BR',
      'America/Araguaina': 'BR',
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Los_Angeles': 'US',
      'America/Denver': 'US',
      'Europe/Lisbon': 'PT',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Africa/Luanda': 'AO',
      'Africa/Maputo': 'MZ',
      'America/Buenos_Aires': 'AR',
      'America/Santiago': 'CL',
      'America/Lima': 'PE',
      'America/Bogota': 'CO',
      'America/Caracas': 'VE',
      'America/Mexico_City': 'MX',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Dubai': 'AE',
    };

    const detectedCountry = timezoneToCountry[timezone] || 'BR';
    setCountryCode(detectedCountry);
    console.log('🕐 País detectado por timezone:', detectedCountry);
  };

  const handleChangeText = (text) => {
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleChangeFormattedText = (text) => {
    if (onChangeFormattedText) {
      onChangeFormattedText(text);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <PhoneInput
        ref={ref || phoneInputRef}
        defaultValue={value}
        defaultCode={countryCode}
        layout="first"
        onChangeText={handleChangeText}
        onChangeFormattedText={handleChangeFormattedText}
        withDarkTheme={false}
        withShadow={false}
        autoFocus={false}
        disabled={disabled}
        containerStyle={[
          styles.phoneContainer,
          error && styles.phoneContainerError,
          disabled && styles.phoneContainerDisabled
        ]}
        textContainerStyle={styles.phoneTextContainer}
        textInputStyle={styles.phoneInput}
        codeTextStyle={styles.phoneCodeText}
        flagButtonStyle={styles.phoneFlagButton}
        countryPickerButtonStyle={styles.phoneCountryPicker}
        placeholder={placeholder}
        textInputProps={{
          placeholderTextColor: '#9CA3AF',
          editable: !disabled
        }}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.helperText}>
        O código do país é detectado automaticamente pela sua localização
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  phoneContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    width: '100%',
    height: 56,
  },
  phoneContainerError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  phoneContainerDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 0,
  },
  phoneInput: {
    fontSize: 16,
    color: '#1F2937',
    height: 54,
  },
  phoneCodeText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  phoneFlagButton: {
    width: 60,
  },
  phoneCountryPicker: {
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    paddingRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default PhoneInputField;
