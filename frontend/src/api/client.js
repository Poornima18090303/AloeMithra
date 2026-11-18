import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const getLocale = (lang) => api.get(`/locales/${lang}`);
export const listLocales = () => api.get("/locales");

export const analyzeLeaf = (formData) =>
  api.post("/analyze", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const chatMessage = (message, lang = "en") => api.post("/chat", { message, lang });

export const transcribeAudio = (audioBlob, lang = "en") => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "speech.wav");
  formData.append("lang", lang);
  return api.post("/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const signIn = (username, password) =>
  api.post("/auth/signin", { username, password });
export const signUp = (username, password, language) =>
  api.post("/auth/signup", { username, password, language });
export const signOut = () => api.post("/auth/signout");
export const getMe = () => api.get("/auth/me");
export const updateUserLanguage = (language) => api.post("/user/language", { language });

export const getHistory = () => api.get("/history");
export const deleteRecord = (id) => api.delete(`/history/${id}`);
export const clearHistory = () => api.delete("/history");

export const getCondition = (slug) => api.get(`/knowledge/${slug}`);
export const listConditions = () => api.get("/knowledge");

export default api;

