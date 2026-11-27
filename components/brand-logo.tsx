import { APP_NAME } from "./nav-icon";

export function BrandMark() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-xl font-extrabold text-slate-900">
                {APP_NAME.charAt(0)}
            </div>

            <div className="flex min-w-0 flex-col justify-center gap-1">
                <span className="block whitespace-nowrap text-base font-bold leading-tight tracking-tight text-white">
                    {APP_NAME}
                </span>

                <span className="block whitespace-nowrap text-[10px] font-semibold uppercase leading-tight tracking-[0.16em] text-amber-400">
                    Sites Management
                </span>
            </div>
        </div>
    );
}

