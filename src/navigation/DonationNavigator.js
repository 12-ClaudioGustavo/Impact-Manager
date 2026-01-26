import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DonationsScreen from '../screens/DonationsScreen';
import AddDonationScreen from '../screens/AddDonationScreen';

const Stack = createStackNavigator();

const DonationNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DonationsList" component={DonationsScreen} />
      <Stack.Screen name="AddDonation" component={AddDonationScreen} />
    </Stack.Navigator>
  );
};

export default DonationNavigator;
