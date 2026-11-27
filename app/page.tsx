
import { Paper, Text, Title } from "@mantine/core";
import { Suspense, type ReactNode } from "react";

import { LoginForm } from "./login/login-form";
import { AppFooter } from "@/components/app-footer";
import { EngineerArt } from "@/components/engineer-art";
import { BrandMark } from "@/components/brand-logo";

// Change this to your product's name.
const APP_NAME = "Benchmark";


const FEATURES = [
    {
        title: "Daily site updates",
        text: "Your foremen can record the day's work, including workers, machinery and materials, right from the site.",
    },
    {
        title: "Know what's happening",
        text: "See which sites have submitted their daily reports and catch up on what's happening across your projects.",
    },
    {
        title: "Keep everyone organised",
        text: "Assign foremen and secretaries to each site so everyone knows their responsibilities.",
    },
    {
        title: "Keep track of resources",
        text: "See how workers, machinery and materials are being used across your sites, all in one place.",
    },
];

function Feature({
    index,
    title,
    children,
}: {
    index: number;
    title: string;
    children: ReactNode;
}) {
    return (
        <li className="flex gap-4">
            <span className="mt-0.5 text-sm font-bold tabular-nums text-amber-400">
                {String(index).padStart(2, "0")}
            </span>

            <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {children}
                </p>
            </div>
        </li>
    );
}

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col">
            {/* Main content */}
            <div className="grid flex-1 lg:grid-cols-2">
                {/* Brand panel */}
                <section
                    className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-14"
                    style={{
                        background:
                            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)",
                    }}
                >
                    {/* Blueprint grid */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />

                    {/* Engineer illustration */}
                    <EngineerArt />

                    <div className="relative z-10">
                        <BrandMark />
                    </div>

                    <div className="relative z-10 max-w-lg">
                    

                        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
                            Every site. Every day report
                        </h1>

                        <p className="mt-5 text-lg leading-relaxed text-slate-300">
                            Keep track of your sites right from the office. Your foremen and secretaries share updates
                            from the field, so you can see what's happening as soon as you open a site.
                        </p>

                        <ul className="mt-10 space-y-6">
                            {FEATURES.map((f, i) => (
                                <Feature
                                    key={f.title}
                                    index={i + 1}
                                    title={f.title}
                                >
                                    {f.text}
                                </Feature>
                            ))}
                        </ul>
                    </div>

                    {/* Spacer for artwork */}
                    <div className="relative z-10 h-24" />
                </section>

                {/* Sign-in panel */}
                <section className="flex items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-sm">
                        <div className="mb-8 lg:hidden">
                            <BrandMark />
                            <p className="mt-2 text-sm text-amber-500">
                                Sites Management
                            </p>
                        </div>

                        <Title order={2}>Welcome back</Title>

                        <Text c="dimmed" mt={4} mb="lg">
                            Sign in to your account to continue.
                        </Text>

                        <Paper
                            withBorder
                            shadow="md"
                            radius="md"
                            p="xl"
                        >
                            <Suspense fallback={null}>
                                <LoginForm />
                            </Suspense>
                        </Paper>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <AppFooter />
        </main>
    );
}
