export function storeSession(data) {
  localStorage.setItem("campusTradeToken", data.token);
  localStorage.setItem("campusTradeUser", JSON.stringify(data.user));
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("campusTradeUser") ?? "null");
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem("campusTradeToken");
}

export function hasSession() {
  return Boolean(getStoredToken() && getStoredUser());
}

export function clearSession() {
  localStorage.removeItem("campusTradeToken");
  localStorage.removeItem("campusTradeUser");
}

export function updateStoredUser(patch) {
  const user = getStoredUser();
  if (!user) return null;
  const updated = { ...user, ...patch };
  localStorage.setItem("campusTradeUser", JSON.stringify(updated));
  return updated;
}
