
import { CurrentYear } from "./current-year";

export function AppFooter() {
    const APP_NAME = "Benchmark";

    return (
        <footer className="w-full shrink-0 bg-slate-700 px-6 py-6 text-white">
            <div className="mx-auto max-w-7xl space-y-5">
                {/* Row 1: Copyright */}
                <div className="flex items-center justify-center gap-3">
                    <div className="text-left">
                        <p className="text-sm text-slate-300">
                            © <CurrentYear /> {APP_NAME}. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Row 2: Developer Details */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-300">
                    <p>
                        Handcrafted By:
                        <a
                            href="tel:+254796515302"
                            className="ml-1 transition-colors hover:text-amber-400"
                        >
                            +254 796515302
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
