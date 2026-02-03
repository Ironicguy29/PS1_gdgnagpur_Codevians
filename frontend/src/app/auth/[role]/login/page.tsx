"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import api, { setAuthToken } from "@/lib/api";
import AuthLayout from "../../layout"; // Maps to /auth/layout.tsx via next.js logic? No, need to import manually or rely on nesting.
// NextJS app router nesting handles layout automatically. Using client component just for form.

export default function LoginPage() {
    const params = useParams();
    const router = useRouter();
    const role = params.role as "patient" | "doctor" | "admin";

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                [role === 'patient' ? 'abha_id' : 'email']: identifier,
                password
            };

            const { data } = await api.post('/auth/login', payload);

            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push(`/dashboard/${role}`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const roleLabels = {
        patient: "ABHA ID / Mobile",
        doctor: "Email / Staff ID",
        admin: "Admin Email"
    };

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-lg font-bold">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">✚</span>
                        </div>
                        ArogyaMitra
                    </div>
                </div>

                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-bold mb-4">Healthcare for Everyone, Everywhere.</h2>
                    <blockquote className="text-lg text-zinc-300">
                        "The best way to find yourself is to lose yourself in the service of others."
                    </blockquote>
                    <p className="mt-4 text-sm text-zinc-400">— Mahatma Gandhi</p>
                </div>

                <div className="relative z-10 text-xs text-zinc-500">
                    © 2024 ArogyaMitra Government Initiative
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Enter your credentials to access the
                            <span className="font-semibold text-blue-600 capitalize"> {role} Portal</span>.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">{roleLabels[role] || "Identifier"}</Label>
                            <Input
                                id="identifier"
                                placeholder={role === 'patient' ? "user@abha" : "admin@hospital.gov"}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In to Account"}
                        </Button>

                        <div className="mt-4 text-center text-sm">
                            <span className="text-slate-500">New to ArogyaMitra? </span>
                            <Link href={`/auth/${role}/register`} className="font-semibold text-blue-600 hover:underline">
                                Create an account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
