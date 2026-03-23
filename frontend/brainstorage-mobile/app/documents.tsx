import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../Api/api";
import { filterItemsByUser } from "../utils/userScope";

const DOCUMENTS_PATH =
  process.env.EXPO_PUBLIC_DOCUMENTS_PATH || "/api/documents";
const UPLOAD_PATH =
  process.env.EXPO_PUBLIC_UPLOAD_PATH || "/api/upload";

type DocumentItem = {
  id?: number;
  user?: {
    id?: number | string | null;
  } | null;
  userId?: number | string | null;
  title?: string;
  name?: string;
  documentName?: string;
  fileName?: string;
  filename?: string;
  originalFileName?: string;
  url?: string;
  fileUrl?: string;
  file?: string;
  path?: string;
  type?: string;
  documentType?: string;
  category?: string;
  description?: string;
  notes?: string;
  tags?: string;
  date?: string;
  createdAt?: string;
};

const normalizeDocument = (item: DocumentItem): DocumentItem => ({
  ...item,
  title:
    item.title ||
    item.name ||
    item.documentName ||
    item.fileName ||
    item.filename ||
    item.originalFileName ||
    getTitleFromFileName(item.fileUrl || item.url || item.file || item.path) ||
    "",
  name:
    item.name ||
    item.title ||
    item.documentName ||
    item.fileName ||
    item.filename ||
    item.originalFileName ||
    getTitleFromFileName(item.fileUrl || item.url || item.file || item.path) ||
    "",
  fileUrl:
    item.fileUrl ||
    item.url ||
    item.file ||
    item.path ||
    "",
  url:
    item.url ||
    item.fileUrl ||
    item.file ||
    item.path ||
    "",
  type:
    item.type ||
    item.documentType ||
    item.category ||
    "",
  description:
    item.description ||
    item.notes ||
    "",
});

const getTitleFromFileName = (value?: string) => {
  if (!value) {
    return "";
  }

  const cleaned = value.split("?")[0].split("#")[0];
  const fileName = cleaned.split("/").pop() || cleaned;
  const withoutPrefix = fileName.replace(/^\d+_/, "");
  const withoutExtension = withoutPrefix.replace(/\.[^/.]+$/, "");

  try {
    return decodeURIComponent(withoutExtension).trim();
  } catch {
    return withoutExtension.trim();
  }
};

const getApiBaseUrl = () => {
  const baseUrl = API.defaults.baseURL;
  return typeof baseUrl === "string" ? baseUrl.replace(/\/$/, "") : "";
};

const resolveDocumentUrl = (value?: string) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/\\/g, "/");
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return normalizedPath;
  }

  const cleanBase = baseUrl.replace(/\/api\/?$/, "");

  if (normalizedPath.startsWith("/")) {
    return `${cleanBase}${normalizedPath}`;
  }

  return `${cleanBase}/${normalizedPath}`;
};

const extractUploadUrl = (payload: any): string => {
  const candidates = [
    payload?.url,
    payload?.fileUrl,
    payload?.path,
    payload?.file,
    payload?.location,
    payload?.downloadUrl,
    payload?.secure_url,
    payload?.data?.url,
    payload?.data?.fileUrl,
    payload?.data?.path,
    payload?.data?.file,
    payload?.data?.location,
    payload?.data?.downloadUrl,
    payload?.result?.url,
    payload?.result?.fileUrl,
    payload?.result?.path,
    payload?.result?.file,
  ];

  const match = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );

  return typeof match === "string" ? match : "";
};

export default function DocumentsScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<DocumentItem> | null>(null);
  const { userId, email = "" } = useLocalSearchParams<{
    userId?: string;
    email?: string;
  }>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastAddedDocument, setLastAddedDocument] = useState<DocumentItem | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      setBackendAvailable(true);
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      const res = await API.get(DOCUMENTS_PATH, {
        params: { userId: Number(userId) },
      });
      const items = Array.isArray(res.data)
        ? res.data.map((item) => normalizeDocument(item))
        : [];
      const hasOwnershipMetadata = items.some(
        (item) => item?.user?.id !== undefined && item?.user?.id !== null,
      ) || items.some((item: any) => item?.userId !== undefined && item?.userId !== null);
      setBackendAvailable(true);
      setDocuments(hasOwnershipMetadata ? filterItemsByUser(items as any, userId) : items);
      if (lastAddedDocument) {
        const matchedDocument = items.find((item) => {
          const normalizedItem = normalizeDocument(item);
          return (
            (normalizedItem.id && normalizedItem.id === lastAddedDocument.id) ||
            (!!normalizedItem.fileUrl &&
              normalizedItem.fileUrl === resolveDocumentUrl(lastAddedDocument.fileUrl || lastAddedDocument.url)) ||
            (!!normalizedItem.title && normalizedItem.title === lastAddedDocument.title)
          );
        });

        if (matchedDocument) {
          setLastAddedDocument(normalizeDocument(matchedDocument));
        }
      }
    } catch (error: any) {
      setBackendAvailable(false);
      setDocuments([]);
      setMessage(
        String(
          error?.response?.data ||
            error?.message ||
            "Documents backend route is not available yet.",
        ),
      );
    }
  }, [lastAddedDocument, userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return documents;
    }

    return documents.filter((item) => {
      const joined = [
        item.title,
        item.name,
        item.url,
        item.fileUrl,
        item.type,
        item.category,
        item.description,
        item.tags,
        item.date,
        item.createdAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return joined.includes(query);
    });
  }, [documents, search]);

  const resetForm = () => {
    setTitle("");
    setFileUrl("");
    setSelectedFileName("");
    setDocumentType("");
    setDescription("");
    setDocumentDate("");
    setEditingId(null);
  };

  const upsertDocument = useCallback((item: DocumentItem) => {
    const normalizedItem = normalizeDocument(item);

    setDocuments((currentDocuments) => {
      const existingIndex = currentDocuments.findIndex((currentItem) => {
        if (normalizedItem.id && currentItem.id) {
          return currentItem.id === normalizedItem.id;
        }

        const currentUrl = resolveDocumentUrl(
          currentItem.fileUrl || currentItem.url || currentItem.file || currentItem.path,
        );
        const nextUrl = resolveDocumentUrl(
          normalizedItem.fileUrl || normalizedItem.url || normalizedItem.file || normalizedItem.path,
        );

        return (
          (!!nextUrl && currentUrl === nextUrl) ||
          (!!normalizedItem.title && normalizedItem.title === currentItem.title)
        );
      });

      if (existingIndex === -1) {
        return [normalizedItem, ...currentDocuments];
      }

      const updatedDocuments = [...currentDocuments];
      updatedDocuments[existingIndex] = {
        ...updatedDocuments[existingIndex],
        ...normalizedItem,
      };

      return updatedDocuments;
    });
  }, []);

  const uploadPickedFile = async (file: {
    uri: string;
    name: string;
    mimeType?: string | null;
    rawFile?: File | null;
  }) => {
    try {
      setUploading(true);
      setMessage("Uploading file...");

      const formData = new FormData();
      if (file.rawFile) {
        formData.append("file", file.rawFile, file.name);
      } else {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        } as any);
      }

      const response = await API.post(UPLOAD_PATH, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = extractUploadUrl(response?.data);
      const resolvedUploadedUrl = resolveDocumentUrl(uploadedUrl);
      const fallbackFileUrl = resolveDocumentUrl(file.uri);
      const finalFileUrl = resolvedUploadedUrl || fallbackFileUrl;

      if (!finalFileUrl) {
        setMessage("Upload completed, but no usable file URL was returned.");
        return;
      }

      const lowerName = file.name.toLowerCase();
      let detectedType = "";

      if (lowerName.endsWith(".pdf")) {
        detectedType = "PDF";
      } else if (lowerName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        detectedType = "Image";
      } else if (lowerName.match(/\.(doc|docx)$/)) {
        detectedType = "Document";
      } else if (lowerName.match(/\.(xls|xlsx)$/)) {
        detectedType = "Spreadsheet";
      }

      setFileUrl(finalFileUrl);
      setSelectedFileName(file.name);
      if (!title.trim()) {
        setTitle(getTitleFromFileName(file.name));
      }
      if (!documentType && detectedType) {
        setDocumentType(detectedType);
      }
      setMessage(
        resolvedUploadedUrl
          ? "File uploaded successfully. Add a title, then save the document."
          : "Document selected successfully. The backend did not return a URL, so the picked file link is being used.",
      );
    } catch (error: any) {
      setMessage(
        String(
          error?.response?.data ||
            error?.message ||
            "Failed to upload file.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const pickDocumentFromDevice = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ["application/pdf", "image/*", "*/*"],
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    await uploadPickedFile({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType,
      rawFile: file.file ?? null,
    });
  };

  const pickImageFromDevice = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage("Media library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    await uploadPickedFile({
      uri: file.uri,
      name: file.fileName || "image.jpg",
      mimeType: file.mimeType || "image/jpeg",
      rawFile: file.file ?? null,
    });
  };

  const saveDocument = async () => {
    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    if (!backendAvailable) {
      setMessage("Documents cannot be saved because the backend endpoint was not found.");
      return;
    }

    try {
      const resolvedTitle =
        title.trim() ||
        getTitleFromFileName(selectedFileName) ||
        getTitleFromFileName(fileUrl.trim()) ||
        "Untitled document";
      const resolvedUrl = resolveDocumentUrl(fileUrl.trim());
      const resolvedType = documentType.trim();
      const resolvedDescription = description.trim();
      const resolvedDate = documentDate.trim();

      if (!resolvedUrl) {
        setMessage("Please pick or upload a document first so it can be opened after saving.");
        return;
      }

      const savedDraft = normalizeDocument({
        id: editingId ?? undefined,
        title: resolvedTitle,
        name: resolvedTitle,
        documentName: resolvedTitle,
        fileName: selectedFileName.trim() || resolvedTitle,
        originalFileName: selectedFileName.trim() || resolvedTitle,
        fileUrl: resolvedUrl,
        url: resolvedUrl,
        type: resolvedType,
        documentType: resolvedType,
        category: resolvedType,
        description: resolvedDescription,
        notes: resolvedDescription,
        date: resolvedDate,
      });

      await API.post(DOCUMENTS_PATH, {
        ...(editingId ? { id: editingId } : {}),
        title: resolvedTitle,
        name: resolvedTitle,
        documentName: resolvedTitle,
        fileName: selectedFileName.trim() || resolvedTitle,
        originalFileName: selectedFileName.trim() || resolvedTitle,
        fileUrl: resolvedUrl,
        url: resolvedUrl,
        file: resolvedUrl,
        path: resolvedUrl,
        type: resolvedType,
        documentType: resolvedType,
        category: resolvedType,
        description: resolvedDescription,
        notes: resolvedDescription,
        date: resolvedDate,
        user: { id: Number(userId) },
      });

      setLastAddedDocument(savedDraft);
      upsertDocument(savedDraft);
      resetForm();
      setSearch("");
      setMessage(editingId ? "Document updated successfully. Use Open below." : "Document added successfully. Use Open below.");
      await fetchDocuments();
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error: any) {
      setMessage(
        String(
          error?.response?.data ||
            error?.message ||
            "Failed to save document.",
        ),
      );
    }
  };

  const editDocument = (item: DocumentItem) => {
    const normalized = normalizeDocument(item);

    setEditingId(normalized.id ?? null);
    setTitle(normalized.title || normalized.name || "");
    setFileUrl(normalized.fileUrl || normalized.url || "");
    setSelectedFileName(
      normalized.fileName ||
        normalized.filename ||
        normalized.originalFileName ||
        normalized.documentName ||
        normalized.name ||
        "",
    );
    setDocumentType(normalized.type || normalized.category || "");
    setDescription(normalized.description || "");
    setDocumentDate(normalized.date || normalized.createdAt || "");
    setMessage(`Editing document #${normalized.id ?? ""}`.trim());
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openDocument = async (item: DocumentItem) => {
    const normalized = normalizeDocument(item);
    const targetUrl = resolveDocumentUrl(normalized.fileUrl || normalized.url);

    if (!targetUrl) {
      setMessage("This document does not have a file URL yet.");
      return;
    }

    try {
      if (/^https?:/i.test(targetUrl)) {
        await WebBrowser.openBrowserAsync(targetUrl);
        return;
      }

      const supported = await Linking.canOpenURL(targetUrl);

      if (!supported) {
        setMessage(`This document URL cannot be opened on this device: ${targetUrl}`);
        return;
      }

      await Linking.openURL(targetUrl);
    } catch (error: any) {
      setMessage(String(error?.message || "Failed to open document."));
    }
  };

  const deleteDocument = async (item: DocumentItem) => {
    if (item.id === undefined || item.id === null) {
      setMessage("Document id is missing.");
      return;
    }

    if (!userId) {
      setMessage("Missing user id. Please log in again.");
      return;
    }

    try {
      await API.delete(`${DOCUMENTS_PATH}/${item.id}`, {
        params: { userId: Number(userId) },
      });

      if (editingId === item.id) {
        resetForm();
      }

      setMessage("Document deleted successfully.");
      await fetchDocuments();
    } catch (error: any) {
      setMessage(
        String(
          error?.response?.data ||
            error?.message ||
            "Failed to delete document.",
        ),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={filteredDocuments}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        ListHeaderComponent={
          <View style={styles.headerPanel}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>D</Text>
            </View>
            <Text style={styles.eyebrow}>Documents</Text>
            <Text style={styles.title}>Keep file references in one place.</Text>
            <Text style={styles.subtitle}>
              Upload from device or browser, or paste a file URL manually.
            </Text>

            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Upload Ready</Text>
              <Text style={styles.heroBody}>
                Pick a PDF, image, or file from your device, then save it as a document record.
              </Text>
            </View>

            <TextInput
              placeholder="Search documents"
              placeholderTextColor="#7a7f87"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? `Edit document #${editingId}` : "Add document"}
              </Text>
              <TextInput
                placeholder="Document title"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                placeholder="File URL or uploaded file URL"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={fileUrl}
                onChangeText={setFileUrl}
              />
              <TextInput
                placeholder="Type (PDF, Image, Invoice...)"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={documentType}
                onChangeText={setDocumentType}
              />
              <TextInput
                placeholder="Description"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.textarea]}
                multiline
                value={description}
                onChangeText={setDescription}
              />
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#6b7280"
                style={styles.input}
                value={documentDate}
                onChangeText={setDocumentDate}
              />
              <Text style={styles.uploadHint}>
                Upload a file first, or paste a URL. Then click save to keep it in your document list.
              </Text>
              {fileUrl ? (
                <View style={styles.uploadedFileCard}>
                  {selectedFileName ? (
                    <Text style={styles.uploadedFileName}>{selectedFileName}</Text>
                  ) : null}
                  <Text style={styles.selectedFileBadge}>Selected document ready</Text>
                  <Text style={styles.uploadedFileLabel}>Uploaded file URL</Text>
                  <Text style={styles.uploadedFileUrl}>{fileUrl}</Text>
                  <View style={styles.uploadedActionsRow}>
                    <Pressable
                      style={styles.openPrimaryButton}
                      onPress={() =>
                        openDocument({
                          title,
                          name: title,
                          fileName: selectedFileName,
                          fileUrl,
                          url: fileUrl,
                        })
                      }
                    >
                      <Text style={styles.openPrimaryButtonText}>Open selected document</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <View style={styles.actionsRow}>
                <Pressable style={styles.primaryButton} onPress={saveDocument}>
                  <Text style={styles.primaryButtonText}>
                    {editingId ? "Update document" : "Add document"}
                  </Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={pickDocumentFromDevice}>
                  <Text style={styles.secondaryButtonText}>
                    {uploading ? "Uploading..." : "Pick PDF/File"}
                  </Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={pickImageFromDevice}>
                  <Text style={styles.secondaryButtonText}>
                    {uploading ? "Uploading..." : "Pick Image"}
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

            {lastAddedDocument?.fileUrl || lastAddedDocument?.url ? (
              <View style={styles.recentCard}>
                <Text style={styles.recentLabel}>
                  {editingId ? "Latest updated document" : "Latest added document"}
                </Text>
                <Text style={styles.recentTitle}>
                  {lastAddedDocument.title ||
                    lastAddedDocument.name ||
                    lastAddedDocument.fileName ||
                    "Saved document"}
                </Text>
                <Text style={styles.recentUrl}>
                  {resolveDocumentUrl(lastAddedDocument.fileUrl || lastAddedDocument.url)}
                </Text>
                <View style={styles.recentActions}>
                  <Pressable
                    style={styles.openPrimaryButton}
                    onPress={() => openDocument(lastAddedDocument)}
                  >
                    <Text style={styles.openPrimaryButtonText}>Open Added Document</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>
              Saved documents ({filteredDocuments.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const normalized = normalizeDocument(item);
          const targetUrl = resolveDocumentUrl(normalized.fileUrl || normalized.url);

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {normalized.title ||
                  normalized.name ||
                  normalized.documentName ||
                  normalized.fileName ||
                  normalized.filename ||
                  normalized.originalFileName ||
                  getTitleFromFileName(targetUrl) ||
                  `Untitled ${normalized.id ?? "document"}`}
              </Text>
              {normalized.type || normalized.category ? (
                <Text style={styles.cardType}>{normalized.type || normalized.category}</Text>
              ) : null}
              {targetUrl ? (
                <Pressable onPress={() => openDocument(normalized)}>
                  <Text style={styles.cardUrl}>{targetUrl}</Text>
                  <Text style={styles.cardOpenHint}>Tap the URL or press Open</Text>
                </Pressable>
              ) : (
                <View style={styles.missingFileCard}>
                  <Text style={styles.missingFileText}>
                    No document file is attached yet.
                  </Text>
                  <Text style={styles.missingFileSubtext}>
                    Tap Edit, choose the document, and save again to enable Open.
                  </Text>
                </View>
              )}
              {normalized.description ? <Text style={styles.cardBody}>{normalized.description}</Text> : null}
              {normalized.date || normalized.createdAt ? (
                <Text style={styles.cardBody}>Date: {normalized.date || normalized.createdAt}</Text>
              ) : null}
              <View style={styles.cardActions}>
                <Pressable style={styles.cardButton} onPress={() => editDocument(normalized)}>
                  <Text style={styles.cardButtonText}>Edit</Text>
                </Pressable>
                {targetUrl ? (
                  <Pressable style={styles.cardOpenButton} onPress={() => openDocument(normalized)}>
                    <Text style={styles.cardOpenButtonText}>Open Document</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.cardAttachButton} onPress={() => editDocument(normalized)}>
                    <Text style={styles.cardAttachButtonText}>Attach Document</Text>
                  </Pressable>
                )}
                <Pressable style={styles.cardDeleteButton} onPress={() => deleteDocument(normalized)}>
                  <Text style={styles.cardDeleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {backendAvailable ? "No documents saved yet." : "No documents to show yet."}
          </Text>
        }
        ref={listRef}
      />
      <Pressable
        style={styles.fab}
        onPress={() => {
          resetForm();
          setMessage("Ready to add a new document.");
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
    backgroundColor: "#f6f3ec",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#d8e2f1",
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f3ec",
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
    color: "#6b7280",
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
  heroCard: {
    backgroundColor: "#26334d",
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
    color: "#d8dfef",
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
    minHeight: 96,
    textAlignVertical: "top",
  },
  uploadHint: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  uploadedFileCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 12,
    marginBottom: 12,
  },
  uploadedFileLabel: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  uploadedFileName: {
    color: "#14532d",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  selectedFileBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  uploadedFileUrl: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 18,
  },
  uploadedActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  message: {
    color: "#92400e",
    fontSize: 14,
    marginBottom: 10,
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
  recentCard: {
    backgroundColor: "#ecfdf3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 16,
    marginBottom: 14,
  },
  recentLabel: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  recentTitle: {
    color: "#14532d",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  recentUrl: {
    color: "#166534",
    fontSize: 13,
    lineHeight: 18,
  },
  recentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
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
  cardType: {
    color: "#355070",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  cardUrl: {
    color: "#8b5e34",
    fontSize: 14,
    marginBottom: 4,
    textDecorationLine: "underline",
  },
  cardOpenHint: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 6,
  },
  missingFileCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fdba74",
    padding: 12,
    marginBottom: 6,
  },
  missingFileText: {
    color: "#9a3412",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  missingFileSubtext: {
    color: "#9a3412",
    fontSize: 12,
    lineHeight: 18,
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
  cardOpenButton: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  cardOpenButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  cardAttachButton: {
    backgroundColor: "#ffedd5",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  cardAttachButtonText: {
    color: "#9a3412",
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
  openPrimaryButton: {
    backgroundColor: "#166534",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  openPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
