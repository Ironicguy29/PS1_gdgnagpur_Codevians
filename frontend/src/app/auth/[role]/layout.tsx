"use client";
import AuthShell from "@/components/ui/AuthShell";
import { useParams, usePathname } from "next/navigation";

export default function RoleLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const role = (params.role as string) || "patient";
    const isLogin = pathname?.includes('login');

    const titles: Record<string, { login: string; register: string }> = {
        patient: { login: "Welcome Back", register: "New Patient Registration" },
        doctor: { login: "Doctor Login", register: "Staff Application" },
        admin: { login: "Admin Access", register: "Authority Registration" },
        lab: { login: "Lab Station Login", register: "Lab Tech Registration" },
        driver: { login: "Driver Dispatch Login", register: "Driver Registration" },
        pharmacy: { login: "Pharmacy Portal Login", register: "Pharmacy Registration" },
        reception: { login: "Reception Portal Login", register: "Reception Registration" }
    };

    const activeTitle = titles[role] || { login: "ArogyaMitra Portal Login", register: "Join the ArogyaMitra Network" };

    // Safe fallback if params aren't ready
    if (!params.role) return <>{children}</>;

    return (
        <AuthShell
            role={role}
            heading={isLogin ? activeTitle.login : activeTitle.register}
            subheading={isLogin ? "Enter your credentials to access your dashboard" : "Join the ArogyaMitra network today"}
        >
            {children}
        </AuthShell>
    );
}
