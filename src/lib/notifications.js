import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }
  
  try {
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: 'seu-project-id-aqui', // IMPORTANTE: Isto precisa de ser configurado
    });
    token = expoPushToken.data;
    console.log("Expo Push Token:", token);
  } catch (e) {
      console.error("Couldn't get Expo Push Token:", e);
      return null;
  }

  return token;
}

export async function savePushToken(token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('auth_id', user.id);

    if (error) {
        console.error('Error saving push token:', error);
    } else {
        console.log('Push token saved successfully.');
    }
}
