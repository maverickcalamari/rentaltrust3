import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth"; // ← your provider
import { Router } from "wouter";                  // you're using wouter's useLocation
// If you use a base path, do: <Router base="/your-base">

// (optional) shadcn toaster:
// import { Toaster } from "@/components/ui/toaster";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <App />
          {/* <Toaster /> */}
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
