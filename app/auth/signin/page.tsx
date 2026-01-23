"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole, roleNames } from "@/context/AuthContext";
import { Stethoscope, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const roles: UserRole[] = [
  "doctor",
  "nurse",
  "front_desk",
  "lab_technician",
  "pharmacist",
  "billing",
  "management",
  "admin",
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("doctor");

  const handleLogin = () => {
    login(selectedRole);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-neutral-50 grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT — Illustration / Visual */}
      <div className="hidden lg:flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white shadow-soft flex items-center justify-center mb-6">
            <Stethoscope className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-3xl font-semibold text-foreground mb-3">
            Welcome to Medflow
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            A unified hospital information system designed for doctors, nurses,
            and healthcare administrators.
          </p>
        </div>
      </div>

      {/* RIGHT — Login Card */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white border border-neutral-200 shadow-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Sign in to Medflow</h1>
                <p className="text-xs text-muted-foreground">
                  Access your hospital workspace
                </p>
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-3 mb-6">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition",
                    selectedRole === role
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-neutral-200 hover:bg-neutral-50",
                  )}
                >
                  <span className="text-sm font-medium">{roleNames[role]}</span>

                  {selectedRole === role && <Shield className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Login button */}
            <Button
              className="w-full rounded-xl py-5 text-base shadow-lift"
              onClick={handleLogin}
            >
              Login as {roleNames[selectedRole]}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
