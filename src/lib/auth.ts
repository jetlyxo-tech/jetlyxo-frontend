import api from "./axios";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getUser = () => {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any) => {
  localStorage.setItem("user", JSON.stringify(user));

    if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authChanged"));
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authChanged"));
  }
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};



