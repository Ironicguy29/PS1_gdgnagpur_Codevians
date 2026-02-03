"use client";
import AuthShell from "@/components/ui/AuthShell";
import { useParams, usePathname } from "next/navigation";

export default function RoleLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const role = (params.role as "patient" | "doctor" | "admin") || "patient";
    const isLogin = pathname?.includes('login');

    const titles = {
        patient: { login: "Welcome Back", register: "New Patient Registration" },
        doctor: { login: "Doctor Login", register: "Staff Application" },
        admin: { login: "Admin Access", register: "Authority Registration" }
    };

    // Safe fallback if params aren't ready
    if (!params.role) return <>{children}</>;

    return (
        <AuthShell
            role={role}
            heading={isLogin ? titles[role].login : titles[role].register}
            subheading={isLogin ? "Enter your credentials to access your dashboard" : "Join the ArogyaMitra network today"}
        >
            {children}
        </AuthShell>
    );
}
