
import { Title } from "@mantine/core";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Title order={1}>Sign in</Title>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

