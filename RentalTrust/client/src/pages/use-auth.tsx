
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  };

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, redirect_uri }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password, redirect_uri }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      setUser(data.user);
      window.location.href = data.redirectUri || "/";
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (registerData) => {
      const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(registerData),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    },
  });

  useEffect(() => {
    fetchUser().then(setUser).catch(() => {});
  }, []);

  return { user, loginMutation, registerMutation };
}
