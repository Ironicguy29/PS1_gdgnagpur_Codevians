import Link from 'next/link';

interface LogoProps {
    href?: string;
    size?: 'sm' | 'md' | 'lg';
    showBeta?: boolean;
    /** 'auto' = adapts to dark/light mode | 'light' = force white (for dark backgrounds) */
    variant?: 'auto' | 'light';
    className?: string;
}

const sizeMap = {
    sm: { text: 'text-[16px]', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { text: 'text-[20px]', badge: 'text-[11px] px-2 py-0.5' },
    lg: { text: 'text-[28px]', badge: 'text-[11px] px-2 py-0.5' },
};

export function Logo({ href = '/', size = 'md', showBeta = true, variant = 'auto', className = '' }: LogoProps) {
    const { text, badge } = sizeMap[size];

    const mitraColor = variant === 'light'
        ? 'text-white'
        : 'text-slate-900 dark:text-white';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Link
                href={href}
                className={`${text} font-semibold tracking-tight hover:opacity-90 transition-opacity`}
            >
                <span className="text-teal-500">Arogya</span>
                <span className={mitraColor}>Mitra</span>
            </Link>
            {showBeta && (
                <span className={`${badge} font-bold tracking-[0.08em] uppercase text-teal-400 bg-teal-500/10 rounded border border-teal-500/30`}>
                    BETA
                </span>
            )}
        </div>
    );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
