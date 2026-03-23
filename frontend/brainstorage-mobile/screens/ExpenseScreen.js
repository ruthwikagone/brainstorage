import { View, Text, FlatList } from "react-native";
import { useState, useEffect } from "react";
import API from "../Api/api";
import InputField from "../components/InputField";
import Button from "../components/CustomButton";
import Card from "../components/Card";

export default function Expenses({ route }) {
  const { userId } = route.params;

  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ amount: "", category: "", date: "" });

  const fetchExpenses = async () => {
    const res = await API.get("/api/expenses");
    setExpenses(res.data);
  };

  const addExpense = async () => {
    await API.post("/api/expenses", {
      ...form,
      user: { id: userId }, // ⭐ IMPORTANT
    });
    fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Expenses</Text>

      <InputField placeholder="Amount" onChange={(v) => setForm({ ...form, amount: v })} />
      <InputField placeholder="Category" onChange={(v) => setForm({ ...form, category: v })} />
      <InputField placeholder="Date (YYYY-MM-DD)" onChange={(v) => setForm({ ...form, date: v })} />

      <Button title="Add Expense" onPress={addExpense} />

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card
            title={`₹${item.amount}`}
            subtitle={`${item.category} - ${item.date}`}
          />
        )}
      />
    </View>
  );
}
