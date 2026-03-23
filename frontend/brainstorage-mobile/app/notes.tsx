import { useCallback, useEffect, useRef, useState } from "react";
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

export default function NotesScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<any> | null>(null);
  const { userId, email = "" } = useLocalSearchParams<{ userId?: string; email?: string }>();
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      const res = await API.get("/api/notes", {
        params: { userId: Number(userId) },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setNotes(filterItemsByUser(items, userId));
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to load notes."));
    }
  }, [userId]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTags("");
    setNoteDate("");
    setEditingId(null);
  };

  const saveNote = async () => {
    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      await API.post("/api/notes", {
        ...(editingId ? { id: editingId } : {}),
        title,
        content,
        tags,
        date: noteDate,
        user: { id: Number(userId) },
      });
      resetForm();
      setMessage(editingId ? "Note updated successfully." : "Note added successfully.");
      await fetchNotes();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to save note."));
    }
  };

  const editNote = (note: any) => {
    setEditingId(note?.id ?? null);
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setTags(note?.tags ?? "");
    setNoteDate(note?.date ?? note?.createdAt ?? "");
    setMessage(`Editing note #${note?.id ?? ""}`.trim());
  };

  const deleteNote = async (id: number) => {
    try {
      await API.delete(`/api/notes/${id}`);
      if (editingId === id) {
        resetForm();
      }
      setMessage("Note deleted successfully.");
      await fetchNotes();
    } catch (error: any) {
      setMessage(String(error?.response?.data || error?.message || "Failed to delete note."));
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={notes}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        ListHeaderComponent={
          <View style={styles.headerPanel}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>N</Text>
            </View>
            <Text style={styles.title}>Notes</Text>
            <Text style={styles.subtitle}>Create and view notes from your backend.</Text>
            <Text style={styles.hint}>
              {editingId ? `Editing note #${editingId}` : "Use Add to create a note."}
            </Text>
            <TextInput placeholder="Title" placeholderTextColor="#6b7280" style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Content" placeholderTextColor="#6b7280" style={styles.input} value={content} onChangeText={setContent} />
            <TextInput placeholder="Tags" placeholderTextColor="#6b7280" style={styles.input} value={tags} onChangeText={setTags} />
            <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#6b7280" style={styles.input} value={noteDate} onChangeText={setNoteDate} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <View style={styles.actionsRow}>
              <Pressable style={styles.button} onPress={saveNote}>
                <Text style={styles.buttonText}>{editingId ? "Update Note" : "Add Note"}</Text>
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
            <Text style={styles.sectionTitle}>Saved Notes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item?.title || "Untitled note"}</Text>
            <Text style={styles.cardBody}>{item?.content || "No content"}</Text>
            {item?.tags ? <Text style={styles.cardMeta}>Tags: {item.tags}</Text> : null}
            {item?.date || item?.createdAt ? <Text style={styles.cardMeta}>Date: {item?.date || item?.createdAt}</Text> : null}
            <View style={styles.cardActions}>
              <Pressable style={styles.cardButton} onPress={() => editNote(item)}>
                <Text style={styles.cardButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.cardDeleteButton} onPress={() => deleteNote(item.id)}>
                <Text style={styles.cardDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
        ref={listRef}
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          resetForm();
          setMessage("Ready to add a new note.");
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
