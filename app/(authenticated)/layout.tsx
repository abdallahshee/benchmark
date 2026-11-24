import { ReactNode, Suspense } from "react";
import { requireUser } from "@/lib/auth";

export default function AuthenticatedLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <AuthGuard>{children}</AuthGuard>
        </Suspense>
    );
}

async function AuthGuard({ children }: { children: ReactNode }) {
    await requireUser("/");

    return <>{children}</>;
}