"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
