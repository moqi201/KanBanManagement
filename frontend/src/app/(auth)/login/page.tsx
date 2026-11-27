"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth-schema";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginFormValues) => {
    const success = await login(values);
    if (success) {
      router.push("/dashboard");
    }
  };

  const handleQuickFill = (email: string) => {
    clearError();
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-palette-olive/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-palette-olive">
            Divisional Task System
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-palette-brown">
            Kanban Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk dengan akun divisi Anda untuk melanjutkan pekerjaan.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Masuk Akun</CardTitle>
            <CardDescription>
              Gunakan email divisi terdaftar dan kata sandi Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" required>
                  Email Divisi
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@kanban.com"
                    className="pl-9"
                    error={Boolean(errors.email)}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" required>
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="pl-9"
                    error={Boolean(errors.password)}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 font-heading uppercase tracking-wider"
              >
                {isLoading ? "Memproses Masuk..." : "Masuk ke Dashboard"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Quick-Fill Demo Section */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-heading uppercase tracking-wider font-semibold text-palette-brown">
                  Akun Demo Uji Coba:
                </span>
                <span className="text-[11px]">Pass: password123</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin.marketing@kanban.com")}
                  className="rounded-lg border border-palette-sage/30 bg-palette-sage/10 p-2 text-left transition hover:bg-palette-sage/20"
                >
                  <p className="font-semibold text-palette-brown">Admin Marketing</p>
                  <p className="text-[10px] text-muted-foreground">Sarah Jenkins</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("member.marketing@kanban.com")}
                  className="rounded-lg border border-border bg-card p-2 text-left transition hover:bg-palette-cream/50"
                >
                  <p className="font-semibold text-palette-brown">Member Marketing</p>
                  <p className="text-[10px] text-muted-foreground">Rian Pratama</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("admin.it@kanban.com")}
                  className="rounded-lg border border-palette-olive/30 bg-palette-olive/10 p-2 text-left transition hover:bg-palette-olive/20"
                >
                  <p className="font-semibold text-palette-olive">Admin IT</p>
                  <p className="text-[10px] text-muted-foreground">Alex Wibowo</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("member.it@kanban.com")}
                  className="rounded-lg border border-border bg-card p-2 text-left transition hover:bg-palette-cream/50"
                >
                  <p className="font-semibold text-palette-olive">Member IT</p>
                  <p className="text-[10px] text-muted-foreground">Dimas Setiawan</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & System Info Footnote */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-palette-olive" />
          <span>Sesi diamankan melalui HttpOnly Cookie</span>
        </div>
      </div>
    </div>
  );
}
