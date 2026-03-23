import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../screens/LoginScreen";
import Register from "../screens/RegisterScreen";
import Dashboard from "../screens/DashboardScreen";
import Notes from "../screens/NotesScreen";
import Links from "../screens/LinksScreen";
import Expenses from "../screens/ExpenseScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Links" component={Links} />
        <Stack.Screen name="Expenses" component={Expenses} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
