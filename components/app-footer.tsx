import { CurrentYear } from "./current-year";

export function AppFooter() {
    const APP_NAME = "Benchmark";

    return (
        <footer className="mt-auto w-full bg-slate-700 px-6 py-6 text-white">
            <div className="mx-auto max-w-7xl space-y-5">

                {/* Row 1: Logo and Copyright */}
                <div className="flex items-center justify-center gap-3 pt-2">
                    {/* Logo */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-xl font-extrabold text-slate-900">
                        {APP_NAME.charAt(0)}
                    </div>

                    {/* Trademark and Copyright */}
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white">
                            {APP_NAME}
                        </p>

                        <p className="text-sm text-slate-300">
                            © <CurrentYear /> {APP_NAME}. All rights reserved.
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Designed for better site management.
                        </p>
                    </div>
                </div>

                {/* Row 2: Developer Details */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-500/50 pt-4 text-sm text-slate-300">
                    <span className="font-medium text-amber-300">
                        Handcrafted By:
                    </span>

                    <p>
                        Phone:{" "}
                        <a
                            href="tel:+254796515302"
                            className="transition-colors hover:text-amber-400"
                        >
                            +254 796515302
                        </a>
                    </p>

                    <p>
                        Email:{" "}
                        <a
                            href="mailto:abdallahshee664@gmail.com"
                            className="transition-colors hover:text-amber-400"
                        >
                            abdallahshee664@gmail.com
                        </a>
                    </p>
                </div>

            </div>
        </footer>
    );
}