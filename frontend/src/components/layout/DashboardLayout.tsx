"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
    LayoutDashboard, Calendar, Users, Settings, LogOut,
    Menu, X, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "patient" | "doctor" | "admin";
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const menuItems = {
        patient: [
            { name: "Overview", icon: LayoutDashboard, href: "/dashboard/patient" },
            { name: "My Appointments", icon: Calendar, href: "/dashboard/patient/appointments" },
            { name: "Family Records", icon: Users, href: "/dashboard/patient/family" },
        ],
        doctor: [
            { name: "OPD Controls", icon: LayoutDashboard, href: "/dashboard/doctor" },
            { name: "Patient History", icon: Users, href: "/dashboard/doctor/history" },
            { name: "Schedule", icon: Calendar, href: "/dashboard/doctor/schedule" },
        ],
        admin: [
            { name: "Hospital Stats", icon: LayoutDashboard, href: "/dashboard/admin" },
            { name: "Staff Mgmt", icon: Users, href: "/dashboard/admin/staff" },
            { name: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                        ArogyaMitra
                    </h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems[role].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium dark:text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{role}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4 ml-auto">
                        <ThemeToggle />
                        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                            <Bell className="w-5 h-5 text-slate-500" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
