"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isCheckingSession } = useAuthStore();

  useEffect(() => {
    if (!isCheckingSession) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isCheckingSession, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground font-sans">
      Memuat aplikasi...
    </div>
  );
}
