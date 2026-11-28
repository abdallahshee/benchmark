import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "./auth-layout";
import { LoginForm } from "../login/login-form";



export const metadata: Metadata = {
  title: "Login",
};

export default function Home() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue."
    >
      <Suspense
        fallback={
          <p className="text-sm text-gray-500">
            Loading sign-in form...
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}