const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_ORIGIN;

async function request(path, options = {}) {
  const token = localStorage.getItem("campusTradeToken");
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const payload = await response.json();
  if (!response.ok) {
    throw payload.error ?? new Error("Request failed");
  }
  return payload;
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const listSchools = () => request("/schools");
export const getCurrentUser = () => request("/auth/me");
export const loginUser = (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const registerUser = (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
export const sendVerificationCode = (payload) => request("/verification/send-code", { method: "POST", body: JSON.stringify(payload) });
export const confirmVerificationCode = (payload) => request("/verification/confirm-code", { method: "POST", body: JSON.stringify(payload) });
export const listProducts = (params) => request(`/products${toQuery(params)}`);
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) });
export const updateProduct = (id, payload) => request(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: "DELETE" });
export const setProductStatus = (id, status) => request(`/products/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const listFavorites = () => request("/favorites");
export const addFavorite = (productId) => request(`/favorites/${productId}`, { method: "POST" });
export const removeFavorite = (productId) => request(`/favorites/${productId}`, { method: "DELETE" });
export const listCourses = (params) => request(`/courses${toQuery(params)}`);
export const listCourseProducts = (courseCode, params) => request(`/courses/${encodeURIComponent(courseCode)}/products${toQuery(params)}`);
export const listConversations = () => request("/conversations");
export const getConversation = (id) => request(`/conversations/${id}`);
export const startConversation = (productId) => request("/conversations", { method: "POST", body: JSON.stringify({ productId }) });
export const listMessages = (conversationId) => request(`/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, payload) => request(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify(payload) });
export const markConversationRead = (conversationId, payload = {}) => request(`/conversations/${conversationId}/read`, { method: "PATCH", body: JSON.stringify(payload) });
export const getUserProfile = (userId) => request(`/users/${userId}/profile`);
export const listUserProducts = (userId, params) => request(`/users/${userId}/products${toQuery(params)}`);
export const createReport = (payload) => request("/reports", { method: "POST", body: JSON.stringify(payload) });
export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return request("/uploads", { method: "POST", body: formData });
};

export function resolveAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  return `${API_ORIGIN}${url}`;
}
