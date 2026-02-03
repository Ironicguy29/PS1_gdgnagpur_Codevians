"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import api, { setAuthToken } from "@/lib/api";

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
        <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="identifier">{roleLabels[role] || "Identifier"}</Label>
                    <Input
                        id="identifier"
                        placeholder={role === 'patient' ? "user@abha" : "admin@hospital.gov"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl"
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
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className={`w-full h-12 text-base font-semibold shadow-lg transition-all rounded-xl ${role === 'patient' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' :
                        role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none' :
                            'bg-slate-800 hover:bg-slate-900'
                    }`}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In to Account"}
            </Button>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-500">New to ArogyaMitra? </span>
                <Link
                    href={`/auth/${role}/register`}
                    className={`font-semibold hover:underline ${role === 'patient' ? 'text-emerald-600' : 'text-blue-600'
                        }`}
                >
                    Create an account
                </Link>
            </div>
        </form>
    );
}
