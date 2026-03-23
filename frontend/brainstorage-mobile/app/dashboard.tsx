import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import API from "../Api/api";
import { filterItemsByUser } from "../utils/userScope";

const DOCUMENTS_PATH =
  process.env.EXPO_PUBLIC_DOCUMENTS_PATH || "/api/documents";
const CREDENTIALS_PATH =
  process.env.EXPO_PUBLIC_CREDENTIALS_PATH || "/api/credentials";

export default function DashboardScreen() {
  const router = useRouter();
  const { email, message, userId } = useLocalSearchParams<{
    email?: string;
    message?: string;
    userId?: string;
  }>();
  const [counts, setCounts] = useState({
    notes: "-",
    links: "-",
    expenses: "-",
    documents: "-",
    credentials: "-",
  });
  const hasUserId = Boolean(userId);

  const openModule = (pathname: "/notes" | "/links" | "/expenses" | "/documents" | "/credentials") => {
    if (!userId) {
      return;
    }

    router.push({
      pathname,
      params: {
        userId,
        email: email || "",
      },
    });
  };

  useEffect(() => {
    let mounted = true;

    const loadCounts = async () => {
      if (!userId) {
        setCounts({
          notes: "0",
          links: "0",
          expenses: "0",
          documents: "0",
          credentials: "0",
        });
        return;
      }

      const currentUserId = userId;
      const requests = [
        API.get("/api/notes", { params: { userId: Number(currentUserId) } }),
        API.get("/api/links", { params: { userId: Number(currentUserId) } }),
        API.get("/api/expenses", { params: { userId: Number(currentUserId) } }),
        API.get(DOCUMENTS_PATH, { params: { userId: Number(currentUserId) } }),
        API.get(CREDENTIALS_PATH, { params: { userId: Number(currentUserId) } }),
      ];

      const results = await Promise.allSettled(requests);

      if (!mounted) {
        return;
      }

      const getCount = (result: PromiseSettledResult<any>) => {
        if (result.status !== "fulfilled") {
          return "N/A";
        }

        const items = Array.isArray(result.value.data) ? result.value.data : [];
        return String(filterItemsByUser(items, currentUserId).length);
      };

      setCounts({
        notes: getCount(results[0]),
        links: getCount(results[1]),
        expenses: getCount(results[2]),
        documents: getCount(results[3]),
        credentials: getCount(results[4]),
      });
    };

    loadCounts();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBlock}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>BS</Text>
          </View>
          <Text style={styles.eyebrow}>Workspace</Text>
          <Text style={styles.title}>BrainStorage dashboard</Text>
          <Text style={styles.subtitle}>
            {email ? `Signed in as ${email}` : "Login completed successfully."}
          </Text>
          {message ? <Text style={styles.status}>{message}</Text> : null}
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Today’s snapshot</Text>
          <Text style={styles.heroBody}>
            Jump into any module, manage your saved data, and keep everything organized in one flow.
          </Text>
          <Text style={styles.helper}>{userId ? `Current user id: ${userId}` : "No user id found. Please log in again."}</Text>
        </View>
        {!hasUserId ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Login is incomplete because the backend did not return a user id. Fix `/auth/login`, then sign in again.
            </Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.notes}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.links}</Text>
            <Text style={styles.statLabel}>Links</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.expenses}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.documents}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{counts.credentials}</Text>
            <Text style={styles.statLabel}>Credentials</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.moduleGrid}>
          <Pressable style={[styles.moduleCard, !hasUserId && styles.moduleCardDisabled]} disabled={!hasUserId} onPress={() => openModule("/notes")}>
            <Text style={styles.moduleTitle}>Notes</Text>
            <Text style={styles.moduleDescription}>Capture ideas, tags, and updates.</Text>
          </Pressable>
          <Pressable style={[styles.moduleCard, !hasUserId && styles.moduleCardDisabled]} disabled={!hasUserId} onPress={() => openModule("/links")}>
            <Text style={styles.moduleTitle}>Links / URL</Text>
            <Text style={styles.moduleDescription}>Store useful resources and open them fast.</Text>
          </Pressable>
          <Pressable style={[styles.moduleCard, !hasUserId && styles.moduleCardDisabled]} disabled={!hasUserId} onPress={() => openModule("/expenses")}>
            <Text style={styles.moduleTitle}>Expenses</Text>
            <Text style={styles.moduleDescription}>Track spending with quick edits.</Text>
          </Pressable>
          <Pressable style={[styles.moduleCard, !hasUserId && styles.moduleCardDisabled]} disabled={!hasUserId} onPress={() => openModule("/documents")}>
            <Text style={styles.moduleTitle}>Documents</Text>
            <Text style={styles.moduleDescription}>Organize file links and document metadata.</Text>
          </Pressable>
          <Pressable style={[styles.moduleCard, !hasUserId && styles.moduleCardDisabled]} disabled={!hasUserId} onPress={() => openModule("/credentials")}>
            <Text style={styles.moduleTitle}>Credentials</Text>
            <Text style={styles.moduleDescription}>Save account IDs, emails, usernames, and passwords per platform.</Text>
          </Pressable>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={[styles.pillButton, !hasUserId && styles.disabledButton]} disabled={!hasUserId} onPress={() => openModule("/notes")}>
            <Text style={styles.pillButtonText}>Quick note</Text>
          </Pressable>
          <Pressable style={[styles.pillButton, !hasUserId && styles.disabledButton]} disabled={!hasUserId} onPress={() => openModule("/expenses")}>
            <Text style={styles.pillButtonText}>Add expense</Text>
          </Pressable>
          <Pressable style={[styles.pillButton, !hasUserId && styles.disabledButton]} disabled={!hasUserId} onPress={() => openModule("/credentials")}>
            <Text style={styles.pillButtonText}>Open vault</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={() => router.replace("/")}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f3ec",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  headerBlock: {
    width: "100%",
    maxWidth: 960,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#10231c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#f7f5ef",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#ead9bc",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#d7e5df",
  },
  eyebrow: {
    color: "#8b5e34",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
  },
  status: {
    color: "#166534",
    fontSize: 15,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: "#10231c",
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    width: "100%",
    maxWidth: 960,
  },
  heroTitle: {
    color: "#f7f5ef",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroBody: {
    color: "#d6dfdb",
    fontSize: 15,
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: "#fff4e5",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    width: "100%",
    maxWidth: 960,
  },
  warningText: {
    color: "#92400e",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
    width: "100%",
    maxWidth: 960,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    minWidth: 145,
    flexGrow: 1,
  },
  statValue: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    width: "100%",
    maxWidth: 960,
  },
  moduleGrid: {
    gap: 12,
    marginBottom: 18,
    width: "100%",
    maxWidth: 960,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  moduleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    width: "100%",
    maxWidth: 474,
    flexGrow: 1,
  },
  moduleCardDisabled: {
    opacity: 0.5,
  },
  moduleTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  moduleDescription: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: 960,
  },
  pillButton: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pillButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "#efe4d3",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  logoutButtonText: {
    color: "#7c4a21",
    fontSize: 15,
    fontWeight: "700",
  },
  helper: {
    marginTop: 10,
    color: "#bdc7c3",
    fontSize: 13,
  },
});
