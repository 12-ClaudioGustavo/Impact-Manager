import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MembersScreen from '../screens/MembersScreen';
import MemberDetailsScreen from '../screens/MemberDetailsScreen';

const Stack = createNativeStackNavigator();

const MembersNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MembersList" component={MembersScreen} />
      <Stack.Screen name="MemberDetails" component={MemberDetailsScreen} />
    </Stack.Navigator>
  );
};

export default MembersNavigator;
