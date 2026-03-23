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

const CREDENTIALS_PATH =
  process.env.EXPO_PUBLIC_CREDENTIALS_PATH || "/api/credentials";

type CredentialItem = {
  id?: number;
  platform?: string;
  email?: string;
  accountId?: string;
  username?: string;
  password?: string;
  notes?: string;
  user?: { id?: number | string | null } | null;
};

export default function CredentialsScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<CredentialItem> | null>(null);
  const { userId, email = "" } = useLocalSearchParams<{ userId?: string; email?: string }>();
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [platform, setPlatform] = useState("");
  const [credentialEmail, setCredentialEmail] = useState("");
  const [accountId, setAccountId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);

  const fetchCredentials = useCallback(async () => {
    if (!userId) {
      setCredentials([]);
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      const res = await API.get(CREDENTIALS_PATH, {
        params: { userId: Number(userId) },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setCredentials(filterItemsByUser(items, userId));
      setMessage("");
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to load credentials."));
    }
  }, [userId]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const filteredCredentials = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return credentials;
    }

    return credentials.filter((item) =>
      [
        item.platform,
        item.email,
        item.accountId,
        item.username,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [credentials, search]);

  const resetForm = () => {
    setPlatform("");
    setCredentialEmail("");
    setAccountId("");
    setUsername("");
    setPassword("");
    setNotes("");
    setEditingId(null);
    setShowPasswordInput(false);
  };

  const saveCredential = async () => {
    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      await API.post(CREDENTIALS_PATH, {
        ...(editingId ? { id: editingId } : {}),
        platform,
        email: credentialEmail,
        accountId,
        username,
        password,
        notes,
        user: { id: Number(userId) },
      });
      resetForm();
      setMessage(editingId ? "Credential updated successfully." : "Credential saved successfully.");
      await fetchCredentials();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to save credential."));
    }
  };

  const editCredential = (item: CredentialItem) => {
    setEditingId(item.id ?? null);
    setPlatform(item.platform ?? "");
    setCredentialEmail(item.email ?? "");
    setAccountId(item.accountId ?? "");
    setUsername(item.username ?? "");
    setPassword(item.password ?? "");
    setNotes(item.notes ?? "");
    setShowPasswordInput(false);
    setMessage(`Editing credential #${item.id ?? ""}`.trim());
  };

  const deleteCredential = async (credentialId?: number) => {
    if (!credentialId) {
      setMessage("Credential id is missing.");
      return;
    }

    try {
      await API.delete(`${CREDENTIALS_PATH}/${credentialId}`);

      if (editingId === credentialId) {
        resetForm();
      }

      setMessage("Credential deleted successfully.");
      await fetchCredentials();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to delete credential."));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={filteredCredentials}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        ListHeaderComponent={
          <View style={styles.headerPanel}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>C</Text>
            </View>
            <Text style={styles.eyebrow}>Credentials</Text>
            <Text style={styles.title}>Keep account IDs, emails, and passwords in one place.</Text>
            <Text style={styles.subtitle}>
              Save account details per platform so each BrainStorage user sees only their own credential list.
            </Text>
            <View style={styles.accountBadge}>
              <Text style={styles.accountBadgeText}>{email ? `Owner: ${email}` : "Owner email unavailable"}</Text>
            </View>

            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Vault view</Text>
              <Text style={styles.heroBody}>
                Use this screen for saved credentials and account recovery notes. Search helps you find entries quickly.
              </Text>
            </View>

            <TextInput
              placeholder="Search credentials"
              placeholderTextColor="#7a7f87"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? `Edit credential #${editingId}` : "Add credential"}
              </Text>
              <TextInput
                placeholder="Platform / App name"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={platform}
                onChangeText={setPlatform}
              />
              <TextInput
                placeholder="Saved account email"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={credentialEmail}
                onChangeText={setCredentialEmail}
              />
              <TextInput
                placeholder="Account ID"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={accountId}
                onChangeText={setAccountId}
              />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPasswordInput}
              />
              <Pressable style={styles.inlineToggle} onPress={() => setShowPasswordInput((value) => !value)}>
                <Text style={styles.inlineToggleText}>{showPasswordInput ? "Hide password" : "Show password"}</Text>
              </Pressable>
              <TextInput
                placeholder="Notes"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.textarea]}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <View style={styles.actionsRow}>
                <Pressable style={styles.primaryButton} onPress={saveCredential}>
                  <Text style={styles.primaryButtonText}>
                    {editingId ? "Update credential" : "Add credential"}
                  </Text>
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
                      params: { userId, email },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Dashboard</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Saved credentials ({filteredCredentials.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.platform || "Untitled credential"}</Text>
            {item.email ? <Text style={styles.cardMeta}>Email: {item.email}</Text> : null}
            {item.accountId ? <Text style={styles.cardMeta}>Account ID: {item.accountId}</Text> : null}
            {item.username ? <Text style={styles.cardMeta}>Username: {item.username}</Text> : null}
            {item.password ? (
              <Text style={styles.cardPassword}>
                Password: {revealedId === item.id ? item.password : "********"}
              </Text>
            ) : null}
            {item.notes ? <Text style={styles.cardBody}>{item.notes}</Text> : null}
            <View style={styles.cardActions}>
              <Pressable style={styles.cardButton} onPress={() => editCredential(item)}>
                <Text style={styles.cardButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.cardButton}
                onPress={() => setRevealedId(revealedId === item.id ? null : item.id ?? null)}
              >
                <Text style={styles.cardButtonText}>{revealedId === item.id ? "Hide" : "Reveal"}</Text>
              </Pressable>
              <Pressable style={styles.cardDeleteButton} onPress={() => deleteCredential(item?.id)}>
                <Text style={styles.cardDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No credentials saved yet.</Text>}
        ref={listRef}
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          resetForm();
          setMessage("Ready to add a new credential.");
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe9",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -50,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#d7e5df",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4efe9",
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  content: {
    alignItems: "center",
    paddingBottom: 100,
  },
  headerPanel: {
    width: "100%",
    maxWidth: 760,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10231c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    color: "#f7f5ef",
    fontSize: 22,
    fontWeight: "800",
  },
  eyebrow: {
    marginBottom: 8,
    color: "#8b5e34",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#111827",
    fontSize: 31,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  accountBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ece7dc",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 16,
  },
  accountBadgeText: {
    color: "#7c4a21",
    fontSize: 13,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#213547",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroBody: {
    color: "#dae7ef",
    fontSize: 15,
    lineHeight: 22,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#d9dde3",
    marginBottom: 16,
    color: "#111827",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    width: "100%",
    maxWidth: 760,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  message: {
    color: "#92400e",
    fontSize: 14,
    marginBottom: 10,
  },
  inlineToggle: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  inlineToggleText: {
    color: "#355070",
    fontSize: 14,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ece7dc",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    color: "#7c4a21",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    width: "100%",
    maxWidth: 760,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardMeta: {
    color: "#4b5563",
    fontSize: 14,
    marginBottom: 4,
  },
  cardPassword: {
    color: "#8b5e34",
    fontSize: 14,
    marginBottom: 6,
  },
  cardBody: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  cardButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  cardButtonText: {
    color: "#111827",
    fontWeight: "700",
  },
  cardDeleteButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  cardDeleteButtonText: {
    color: "#991b1b",
    fontWeight: "700",
  },
  empty: {
    color: "#6b7280",
    fontSize: 15,
    marginBottom: 24,
  },
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
  fabText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
});
