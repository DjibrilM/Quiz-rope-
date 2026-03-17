import React, { createContext, useCallback, useContext, useState } from "react";
import { ToastContainer } from "../components/common/Toast";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export type ToastInput = Omit<ToastItem, "id">;

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showApiError: (error: unknown) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }];
      return next.slice(-3); // max 3 visible at once
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message: string, title = "Error") => {
      showToast({ type: "error", title, message });
    },
    [showToast],
  );

  const showSuccess = useCallback(
    (message: string, title = "Success") => {
      showToast({ type: "success", title, message });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, title = "Warning") => {
      showToast({ type: "warning", title, message });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, title = "Info") => {
      showToast({ type: "info", title, message });
    },
    [showToast],
  );

  const showApiError = useCallback(
    (error: unknown) => {
      const err = error as any;
      const rawMessage: string = err?.message ?? "Something went wrong";
      const code: string = err?.code ?? "";

      // Session expired (set by the API interceptor)
      if (rawMessage === "Session expired. Please log in again.") {
        showToast({
          type: "warning",
          title: "Session Expired",
          message: "Please sign in again.",
        });
        return;
      }

      // Firebase auth errors
      if (code.startsWith("auth/")) {
        const authTitles: Record<string, string> = {
          "auth/user-not-found": "Account Not Found",
          "auth/wrong-password": "Wrong Password",
          "auth/invalid-credential": "Invalid Credentials",
          "auth/invalid-email": "Invalid Email",
          "auth/too-many-requests": "Too Many Attempts",
          "auth/email-already-in-use": "Email Already Registered",
          "auth/weak-password": "Weak Password",
          "auth/network-request-failed": "No Connection",
        };
        const authMessages: Record<string, string> = {
          "auth/user-not-found": "No account found with this email.",
          "auth/wrong-password": "The password is incorrect.",
          "auth/invalid-credential": "Email or password is incorrect.",
          "auth/invalid-email": "Please enter a valid email address.",
          "auth/too-many-requests":
            "Account temporarily locked. Try again later.",
          "auth/email-already-in-use":
            "An account already exists with this email.",
          "auth/weak-password": "Password must be at least 6 characters.",
          "auth/network-request-failed": "Check your internet connection.",
        };
        showToast({
          type: "error",
          title: authTitles[code] ?? "Auth Error",
          message: authMessages[code] ?? rawMessage,
        });
        return;
      }

      // Network / connection errors
      if (
        rawMessage.toLowerCase().includes("network") ||
        rawMessage.toLowerCase().includes("connection") ||
        rawMessage.toLowerCase().includes("timeout")
      ) {
        showToast({
          type: "error",
          title: "No Connection",
          message: "Check your internet connection and try again.",
          duration: 5000,
        });
        return;
      }

      // Default: show raw message
      showToast({ type: "error", title: "Error", message: rawMessage });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        showApiError,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
