import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const Input = ({ label, value, onChangeText, placeholder, keyboardType, multiline, editable = true, style, ...props }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          !editable && styles.inputDisabled,
          multiline && styles.multiline,
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textLight}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        {...props}
      />
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: theme.text,
  },
  inputDisabled: {
    backgroundColor: theme.border,
  },
  multiline: {
      height: 100,
      textAlignVertical: 'top',
      paddingTop: 16,
  }
});

export default Input;
