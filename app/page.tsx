import { Paper, Text, Title } from "@mantine/core";
import { Suspense, type ReactNode } from "react";

import { LoginForm } from "./login/login-form";
import { AppFooter } from "@/components/app-footer";

// Change this to your product's name.
const APP_NAME = "Benchmark";

const FEATURES = [
  {
    title: "Daily site reports",
    text: "Foremen record machinery, workers and materials every day, straight from the site.",
  },
  {
    title: "One clear picture",
    text: "See which sites have reported today and open any report in full.",
  },
  {
    title: "The right people on every site",
    text: "Assign a foreman and a secretary to each site, and keep every record accountable.",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-lg font-extrabold text-slate-900">
        {APP_NAME.charAt(0)}
      </div>
      <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  );
}

function Feature({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 text-sm font-bold tabular-nums text-amber-400">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{children}</p>
      </div>
    </li>
  );
}

// Decorative skyline with a tower crane. Hidden from screen readers.
// function SkylineArt() {
//   return (
//     <svg
//       aria-hidden="true"
//       viewBox="0 0 520 320"
//       className="pointer-events-none absolute bottom-0 right-0 w-[560px] max-w-full"
//     >
//       <g fill="#1e293b">
//         <rect x="20" y="200" width="70" height="120" />
//         <rect x="100" y="150" width="60" height="170" />
//         <rect x="170" y="220" width="50" height="100" />
//         <rect x="350" y="180" width="80" height="140" />
//         <rect x="440" y="230" width="60" height="90" />
//       </g>
//       <g stroke="#fbbf24" fill="none" strokeLinecap="round" opacity="0.55">
//         <rect x="255" y="40" width="10" height="280" strokeWidth="3" />
//         <line x1="120" y1="48" x2="470" y2="48" strokeWidth="6" />
//         <polyline points="120,48 260,12 470,48" strokeWidth="2" />
//         <rect x="120" y="48" width="30" height="22" strokeWidth="3" />
//         <rect x="266" y="52" width="22" height="16" strokeWidth="3" />
//         <line x1="400" y1="48" x2="400" y2="140" strokeWidth="2" />
//         <circle cx="400" cy="146" r="5" strokeWidth="2" />
//         <rect x="380" y="152" width="40" height="24" strokeWidth="2" />
//       </g>
//     </svg>
//   );
// }

// Construction engineer illustration. Hidden from screen readers.
function EngineerArt() {
  return (
    <img
      src="/images/engineer-on-site.png"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0 w-full max-w-[760px] scale-x-[-1] object-contain object-bottom opacity-75"
    />
  );
}

export default function Home() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel: always dark, so it looks the same in light and dark mode. */}
      <section
        className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-14"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)" }}
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
        {/* <SkylineArt /> */}
        <EngineerArt />

        <div className="relative z-10">
          <BrandMark />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Sites Management
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Every site. Every day. One clear picture.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Oversee your ongoing sites without leaving the office. Foremen and secretaries report
            from the field, and you see it as soon as you open the site.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map((f, i) => (
              <Feature key={f.title} index={i + 1} title={f.title}>
                {f.text}
              </Feature>
            ))}
          </ul>
        </div>

        {/* Spacer so the artwork has room below the text on short screens. */}
        <div className="relative z-10 h-24" />
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandMark />
            <p className="mt-2 text-sm text-amber-500">Sites Management</p>
          </div>

          <Title order={2}>Welcome back</Title>
          <Text c="dimmed" mt={4} mb="lg">
            Sign in to your account to continue.
          </Text>

          <Paper withBorder shadow="md" radius="md" p="xl">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </Paper>
        </div>
      </section>
          <div className="col-span-full">
        <AppFooter />
      </div>
    </main>
  );
}