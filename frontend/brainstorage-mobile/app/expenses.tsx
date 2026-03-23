import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../Api/api";
import { filterItemsByUser } from "../utils/userScope";

export default function ExpensesScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<any> | null>(null);
  const { userId, email = "" } = useLocalSearchParams<{ userId?: string; email?: string }>();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!userId) {
      setExpenses([]);
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      const res = await API.get("/api/expenses", {
        params: { userId: Number(userId) },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setExpenses(filterItemsByUser(items, userId));
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to load expenses."));
    }
  }, [userId]);

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDate("");
    setEditingId(null);
  };

  const saveExpense = async () => {
    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      const trimmedAmount = amount.trim();
      const trimmedCategory = category.trim();
      const trimmedDate = date.trim();

      if (!trimmedAmount) {
        setMessage("Amount is required.");
        return;
      }

      const parsedAmount = Number(trimmedAmount);

      if (Number.isNaN(parsedAmount)) {
        setMessage("Amount must be a valid number.");
        return;
      }

      const payload: Record<string, unknown> = {
        ...(editingId !== null ? { id: editingId } : {}),
        amount: parsedAmount,
        category: trimmedCategory,
        user: { id: Number(userId) },
      };

      if (trimmedDate) {
        payload.date = trimmedDate;
      }

      await API.post("/api/expenses", payload);
      resetForm();
      setMessage(editingId ? "Expense updated successfully." : "Expense added successfully.");
      await fetchExpenses();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to save expense."));
    }
  };

  const deleteExpense = async (expenseId?: number) => {
    if (expenseId === undefined || expenseId === null) {
      setMessage("Expense id is missing.");
      return;
    }

    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      await API.delete(`/api/expenses/${expenseId}`, {
        params: { userId: Number(userId) },
      });

      if (editingId === expenseId) {
        resetForm();
      }

      setMessage("Expense deleted successfully.");
      await fetchExpenses();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to delete expense."));
    }
  };

  const editExpense = (expense: any) => {
    setEditingId(expense?.id ?? null);
    setAmount(String(expense?.amount ?? ""));
    setCategory(expense?.category ?? "");
    setDate(expense?.date ?? "");
    setMessage(`Editing expense #${expense?.id ?? ""}`.trim());
  };

  const summary = useMemo(() => {
    const amounts = expenses
      .map((item) => Number(item?.amount))
      .filter((value) => !Number.isNaN(value));
    const total = amounts.reduce((sum, value) => sum + value, 0);
    const average = amounts.length ? total / amounts.length : 0;
    const categories = new Set(expenses.map((item) => item?.category).filter(Boolean)).size;

    return {
      total: total.toFixed(2),
      average: average.toFixed(2),
      count: String(expenses.length),
      categories: String(categories),
    };
  }, [expenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={expenses}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        ListHeaderComponent={
          <View style={styles.headerPanel}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>E</Text>
            </View>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.subtitle}>Track and add expenses from your backend.</Text>
            <Text style={styles.hint}>
              {editingId ? `Editing expense #${editingId}` : "Amount is saved as a number."}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>Rs. {summary.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.count}</Text>
                <Text style={styles.summaryLabel}>Entries</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>Rs. {summary.average}</Text>
                <Text style={styles.summaryLabel}>Average</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.categories}</Text>
                <Text style={styles.summaryLabel}>Categories</Text>
              </View>
            </View>
            <TextInput placeholder="Amount" placeholderTextColor="#6b7280" style={styles.input} value={amount} onChangeText={setAmount} />
            <TextInput placeholder="Category" placeholderTextColor="#6b7280" style={styles.input} value={category} onChangeText={setCategory} />
            <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#6b7280" style={styles.input} value={date} onChangeText={setDate} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.actionsRow}>
              <Pressable style={styles.button} onPress={saveExpense}>
                <Text style={styles.buttonText}>{editingId ? "Update Expense" : "Add Expense"}</Text>
              </Pressable>
              {editingId ? (
                <Pressable style={styles.secondaryButton} onPress={resetForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.replace({
                    pathname: "/dashboard",
                    params: {
                      userId,
                      email,
                    },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Dashboard</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>Saved Expenses</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rs. {item?.amount ?? "-"}</Text>
            <Text style={styles.cardBody}>{item?.category || "No category"}</Text>
            <Text style={styles.cardMeta}>{item?.date || "No date"}</Text>
            <View style={styles.cardActions}>
              <Pressable style={styles.cardButton} onPress={() => editExpense(item)}>
                <Text style={styles.cardButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.cardDeleteButton} onPress={() => deleteExpense(item?.id)}>
                <Text style={styles.cardDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No expenses yet.</Text>}
        ref={listRef}
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          resetForm();
          setMessage("Ready to add a new expense.");
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5efe6" },
  container: { flex: 1, backgroundColor: "#f5efe6", paddingHorizontal: 24, paddingTop: 24 },
  content: { alignItems: "center", paddingBottom: 100 },
  headerPanel: { width: "100%", maxWidth: 720 },
  logoBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#10231c", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoText: { color: "#f7f5ef", fontSize: 22, fontWeight: "800" },
  title: { fontSize: 30, fontWeight: "800", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#4b5563", marginBottom: 16 },
  hint: { fontSize: 14, color: "#8b5e34", marginBottom: 12 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  summaryCard: { backgroundColor: "#ffffff", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, minWidth: 120 },
  summaryValue: { color: "#111827", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  summaryLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: "#111827", marginBottom: 12, backgroundColor: "#ffffff",
  },
  message: { color: "#7c2d12", marginBottom: 10 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  button: { backgroundColor: "#111827", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", alignSelf: "flex-start" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { backgroundColor: "#efe4d3", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", alignSelf: "flex-start" },
  secondaryButtonText: { color: "#7c4a21", fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 12 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, width: "100%", maxWidth: 720 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  cardBody: { fontSize: 15, color: "#374151", marginBottom: 6 },
  cardMeta: { fontSize: 13, color: "#6b7280" },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  cardButton: { backgroundColor: "#e5e7eb", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" },
  cardButtonText: { color: "#111827", fontWeight: "700" },
  cardDeleteButton: { backgroundColor: "#fee2e2", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" },
  cardDeleteButtonText: { color: "#991b1b", fontWeight: "700" },
  empty: { color: "#6b7280", fontSize: 15, marginBottom: 24 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#ffffff", fontSize: 28, fontWeight: "700", lineHeight: 30 },
});
