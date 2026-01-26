import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MembersScreen from '../screens/MembersScreen';
import MemberDetailsScreen from '../screens/MemberDetailsScreen';
import EditMemberScreen from '../screens/EditMemberScreen';

const Stack = createStackNavigator();

const MembersNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MembersList" component={MembersScreen} />
      <Stack.Screen name="MemberDetails" component={MemberDetailsScreen} />
      <Stack.Screen name="EditMember" component={EditMemberScreen} />
    </Stack.Navigator>
  );
};

export default MembersNavigator;
