import { Suspense } from "react";
import { LoginForm } from "./login/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center  p-6 dark:bg-black">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}