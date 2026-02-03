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
    role: "patient" | "doctor" | "admin" | "reception";
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
        ],
        reception: [
            { name: "Registration", icon: Users, href: "/dashboard/reception" },
            { name: "Create Token", icon: Calendar, href: "/dashboard/reception/token" },
            { name: "Schedules", icon: LayoutDashboard, href: "/dashboard/reception/schedules" },
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-xl lg:shadow-none`}
            >
                <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">✚</div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            ArogyaMitra
                        </h1>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 py-6 flex flex-col h-[calc(100vh-5rem)] justify-between">
                    <nav className="space-y-1">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                        {menuItems[role].map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}>
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                                        <span className="font-medium">{item.name}</span>
                                        {isActive && <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 p-4 rounded-2xl border border-blue-100 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-600">
                                    {user?.name?.[0] || 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-500 capitalize truncate">{role} Account</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-9 px-2" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" /> Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
                            <Menu className="w-6 h-6 text-slate-600" />
                        </button>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white hidden md:block">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
                        <button className="p-2.5 rounded-full hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all relative text-slate-500 hover:text-slate-700 dark:text-slate-400">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
