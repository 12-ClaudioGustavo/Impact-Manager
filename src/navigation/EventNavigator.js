import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EventsScreen from '../screens/EventsScreen';
import AddEventScreen from '../screens/AddEventScreen';

const Stack = createStackNavigator();

const EventNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
    </Stack.Navigator>
  );
};

export default EventNavigator;
