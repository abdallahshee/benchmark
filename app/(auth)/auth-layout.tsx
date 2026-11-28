import type { ReactNode } from "react";

import { AppFooter } from "@/components/app-footer";
import { EngineerArt } from "@/components/engineer-art";
import { BrandMark } from "@/components/brand-logo";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Branding panel */}
        <section
          className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <EngineerArt />

          <div className="relative z-10">
            <BrandMark />
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              Every site. Every day report.
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-300 xl:text-lg">
              Keep track of your sites right from the office. Your foremen
              and secretaries share updates from the field, so you can see
              what's happening as soon as you open a site.
            </p>
          </div>

          <div className="relative z-10 h-12" />
        </section>

        {/* Form panel */}
        <section className="flex min-w-0 items-center justify-center bg-gray-50 px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <BrandMark />
          
            </div>

      

<div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
  <div className="mb-6 text-center">

    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
      {title}
    </h2>

    <p className="mt-2 text-sm leading-relaxed text-gray-600">
      {description}
    </p>
  </div>

  <div className="mb-6 border-t border-gray-200" />

  <div className="space-y-5 [&_label]:!text-gray-800 [&_label]:!font-medium">
    {children}
  </div>
</div>
          </div>
        </section>
      </div>

      {/* <AppFooter /> */}
    </main>
  );
}