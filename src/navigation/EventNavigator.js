import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from "../screens/EventsScreen";
import AddEvent from "../screens/AddEventScreen";

const Stack = createNativeStackNavigator();

const EventNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="EventsList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="AddEvent" component={AddEvent} />
    </Stack.Navigator>
  );
};

export default EventNavigator;