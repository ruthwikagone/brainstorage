import { View, Text, FlatList } from "react-native";
import { useState, useEffect } from "react";
import API from "../Api/api";
import InputField from "../components/InputField";
import Button from "../components/CustomButton";

export default function Notes({ route }) {
  const { userId } = route.params;

  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });

  const fetchNotes = async () => {
    const res = await API.get("/api/notes");
    setNotes(res.data);
  };

  const addNote = async () => {
    await API.post("/api/notes", {
      ...form,
      user: { id: userId }, // ⭐ IMPORTANT MATCH BACKEND
    });

    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Notes</Text>

      <InputField placeholder="Title" onChange={(v) => setForm({ ...form, title: v })} />
      <InputField placeholder="Content" onChange={(v) => setForm({ ...form, content: v })} />
      <InputField placeholder="Tags" onChange={(v) => setForm({ ...form, tags: v })} />

      <Button title="Add Note" onPress={addNote} />

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.title} - {item.content}</Text>
        )}
      />
    </View>
  );
}
