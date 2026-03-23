import { View, Text } from "react-native";
import Button from "../components/CustomButton";

export default function Dashboard({ navigation, route }) {
  const { userId } = route.params;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Dashboard</Text>

      <Button title="Notes" onPress={() => navigation.navigate("Notes", { userId })} />
      <Button title="Links" onPress={() => navigation.navigate("Links", { userId })} />
      <Button title="Expenses" onPress={() => navigation.navigate("Expenses", { userId })} />
    </View>
  );
}
