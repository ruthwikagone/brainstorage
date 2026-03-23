import { View, Text, FlatList, Linking } from "react-native";
import { useState, useEffect } from "react";
import API from "../Api/api";
import InputField from "../components/InputField";
import Button from "../components/CustomButton";
import Card from "../components/Card";

export default function Links({ route }) {
  const { userId } = route.params;

  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ title: "", url: "", description: "" });

  const fetchLinks = async () => {
    const res = await API.get("/api/links");
    setLinks(res.data);
  };

  const addLink = async () => {
    await API.post("/api/links", {
      ...form,
      user: { id: userId }, // ⭐ IMPORTANT
    });
    fetchLinks();
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Links</Text>

      <InputField placeholder="Title" onChange={(v) => setForm({ ...form, title: v })} />
      <InputField placeholder="URL" onChange={(v) => setForm({ ...form, url: v })} />
      <InputField placeholder="Description" onChange={(v) => setForm({ ...form, description: v })} />

      <Button title="Add Link" onPress={addLink} />

      <FlatList
        data={links}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card
            title={item.title}
            subtitle={item.url}
            onPress={() => Linking.openURL(item.url)}
          />
        )}
      />
    </View>
  );
}
