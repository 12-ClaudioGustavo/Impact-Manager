import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const MemberFormModal = ({ isVisible, onClose, onSave, organizationId, memberToEdit }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form states
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [memberGender, setMemberGender] = useState("");
  const [memberAddress, setMemberAddress] = useState("");
  const [memberType, setMemberType] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [emergencyContact, setEmergencyContact] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null); // Can be a local URI or a remote URL
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setIsEditMode(true);
      setMemberName(memberToEdit.full_name || "");
      setMemberEmail(memberToEdit.email || "");
      setMemberNumber(memberToEdit.phone || "");
      setMemberGender(memberToEdit.gender || "");
      setMemberAddress(memberToEdit.address || "");
      setMemberType(memberToEdit.membership_type || "");
      setMemberStatus(memberToEdit.membership_status || "");
      setEmergencyContact(memberToEdit.emergency_contact || "");
      setNote(memberToEdit.notes || "");
      setPhoto(memberToEdit.photo_url || null);
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [memberToEdit, isVisible]);
  
  const resetForm = () => {
    setMemberName("");
    setMemberEmail("");
    setMemberNumber("");
    setMemberGender("");
    setMemberAddress("");
    setMemberType("");
    setMemberStatus("");
    setEmergencyContact("");
    setNote("");
    setPhoto(null);
    setStep(1);
    setIsEditMode(false);
  };
  
  const handleClose = () => {
      resetForm();
      onClose();
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!organizationId) {
      Alert.alert("Erro", "ID da organização não encontrado.");
      return;
    }
    
    setIsSaving(true);
    
    try {
        let photoUrl = photo;

        if (photo && photo.startsWith('file://')) {
            if(isEditMode && memberToEdit?.photo_url) {
                const oldFileName = memberToEdit.photo_url.split('/').pop();
                await supabase.storage.from('member-photos').remove([oldFileName]);
            }
            
            const response = await fetch(photo);
            const blob = await response.blob();
            const fileExt = photo.split('.').pop();
            const fileName = `${Date.now()}_${memberName.replace(/\s+/g, '_')}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('member-photos')
              .upload(fileName, blob, { contentType: `image/${fileExt}` });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(uploadData.path);
            photoUrl = urlData.publicUrl;
        }

        const memberData = {
            organization_id: organizationId,
            full_name: memberName,
            email: memberEmail,
            phone: memberNumber,
            gender: memberGender,
            address: memberAddress,
            membership_type: memberType,
            membership_status: memberStatus,
            emergency_contact: emergencyContact,
            notes: note,
            photo_url: photoUrl,
        };

        await onSave(memberData, memberToEdit?.id);
        
        handleClose();

    } catch (error) {
        console.error("Erro ao salvar membro:", error);
        Alert.alert("Erro", "Houve um erro ao salvar o membro.");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.iconColorLight} />
            </TouchableOpacity>

            <Text style={styles.title}>
              {isEditMode ? 'Editar Membro' : 'Novo Membro'} - (Passo {step}/3)
            </Text>

            {step === 1 && (
              <>
                <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor={theme.inputPlaceholder} value={memberName} onChangeText={setMemberName} />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.inputPlaceholder} value={memberEmail} onChangeText={setMemberEmail} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Telefone" placeholderTextColor={theme.inputPlaceholder} value={memberNumber} onChangeText={setMemberNumber} keyboardType="phone-pad" />
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={memberGender} onValueChange={setMemberGender} style={styles.picker} itemStyle={{color: theme.text}}>
                    <Picker.Item label="Selecione o gênero" value="" color={theme.textSecondary}/>
                    <Picker.Item label="Masculino" value="Masculino" color={theme.text}/>
                    <Picker.Item label="Feminino" value="Feminino" color={theme.text}/>
                    <Picker.Item label="Outro" value="Outro" color={theme.text}/>
                  </Picker>
                </View>
                <TouchableOpacity style={styles.next} onPress={() => setStep(2)}>
                  <Text style={styles.btnText}>Próximo</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <TextInput style={styles.input} placeholder="Endereço" placeholderTextColor={theme.inputPlaceholder} value={memberAddress} onChangeText={setMemberAddress} />
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={memberType} onValueChange={setMemberType} style={styles.picker} itemStyle={{color: theme.text}}>
                    <Picker.Item label="Selecione o tipo de membro" value="" color={theme.textSecondary}/>
                    <Picker.Item label="Secretário" value="Secretário" color={theme.text}/>
                    <Picker.Item label="Tesoureiro" value="Tesoureiro" color={theme.text}/>
                    <Picker.Item label="Coordenador" value="Coordenador" color={theme.text}/>
                    <Picker.Item label="Presidente" value="Presidente" color={theme.text}/>
                    <Picker.Item label="Vice-Presidente" value="Vice-Presidente" color={theme.text}/>
                    <Picker.Item label="Membro" value="Membro" color={theme.text}/>
                  </Picker>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={memberStatus} onValueChange={setMemberStatus} style={styles.picker} itemStyle={{color: theme.text}}>
                    <Picker.Item label="Selecione o status" value="" color={theme.textSecondary} />
                    <Picker.Item label="Ativo" value="Ativo" color={theme.text}/>
                    <Picker.Item label="Inativo" value="Inativo" color={theme.text}/>
                    <Picker.Item label="Suspenso" value="Suspenso" color={theme.text}/>
                  </Picker>
                </View>
                <TextInput style={styles.input} placeholder="Contato de Emergência" placeholderTextColor={theme.inputPlaceholder} value={emergencyContact} onChangeText={setEmergencyContact} />
                <TextInput style={styles.input} placeholder="Observações" placeholderTextColor={theme.inputPlaceholder} value={note} onChangeText={setNote} />
                <View style={styles.row}>
                  <TouchableOpacity style={styles.back} onPress={() => setStep(1)}>
                    <Text style={styles.btnText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.next} onPress={() => setStep(3)}>
                    <Text style={styles.btnText}>Próximo</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <TouchableOpacity onPress={pickImage} style={styles.photoPicker}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color={theme.iconColorLight} />
                      <Text style={{color: theme.textSecondary}}>Adicionar Foto</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.row}>
                  <TouchableOpacity style={styles.back} onPress={() => setStep(2)}>
                    <Text style={styles.btnText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.save} onPress={handleSave} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>Salvar</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
  )
};

const getStyles = (theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: theme.backgroundCard,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: theme.text,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        color: theme.text,
    },
    pickerContainer: {
        backgroundColor: theme.inputBackground,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        justifyContent: 'center',
    },
    picker: {
        color: theme.text,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
        gap: 10,
    },
    next: {
        backgroundColor: theme.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
    },
    back: {
        backgroundColor: theme.textSecondary,
        padding: 14,
        borderRadius: 8,
        flex: 1,
        alignItems: "center",
    },
    save: {
        backgroundColor: theme.success,
        padding: 14,
        borderRadius: 8,
        flex: 1,
        alignItems: "center",
    },
    photoPicker: {
        alignItems: 'center',
        marginBottom: 20,
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.inputBackground,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.inputBorder,
    },
    btnText: {
        color: theme.textOnPrimary,
        fontWeight: "bold",
        fontSize: 16,
    },
    closeBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: theme.borderLight,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default MemberFormModal;
