'use client';

import dynamic from 'next/dynamic';
import { AmbulanceMapProps } from './AmbulanceMapClient';

const AmbulanceMapClient = dynamic(() => import('./AmbulanceMapClient'), {
    ssr: false,
    loading: () => (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-[400px] items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <svg
                        className="h-5 w-5 animate-spin text-red-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                    Loading Live Tracking Map...
                </div>
            </div>
        </div>
    ),
});

export default function AmbulanceMap(props: AmbulanceMapProps) {
    return <AmbulanceMapClient {...props} />;
}
