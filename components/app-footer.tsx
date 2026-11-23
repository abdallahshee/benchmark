import { CurrentYear } from "./current-year";

export function AppFooter() {
    const APP_NAME = "Benchmark";
    return (
        <footer className="mt-auto  bg-slate-700 px-6 py-8 text-white">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">

                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400 text-xl font-extrabold text-slate-900">
                        {APP_NAME.charAt(0)}
                    </div>

                    <div>
                        <p className="text-lg font-bold tracking-tight">
                            {APP_NAME}
                        </p>
                        <p className="text-sm text-slate-400">
                            Construction Site Management
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center">
                    <p className="text-sm text-slate-300">
                        © <CurrentYear /> {APP_NAME}. All rights reserved.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        Designed for better site management.
                    </p>
                </div>

                {/* Developer details */}

{/* Developer details */}
<div className="text-center md:text-right">
    <p className="text-sm text-white">
        Abdallah Shee
    </p>
    <p className="text-xs text-amber-300">
        Software Developer
    </p>

    <div className="mt-2 space-y-1 text-xs text-slate-300">
        <p>
            Phone: <a href="tel:+254796515302" className="hover:text-amber-400">
                +254 796515302
            </a>
        </p>
        <p>
            Email: <a href="mailto:abdallahshee664@gmail.com" className="hover:text-amber-400">
                abdallahshee664@gmail.com
            </a>
        </p>
    </div>
</div>


            </div>
        </footer>
    );
}