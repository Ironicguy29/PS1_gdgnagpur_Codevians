"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import api, { setAuthToken } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

export default function LoginPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const role = params.role as "patient" | "doctor" | "admin" | "lab" | "pharmacy" | "driver";
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
                toast('Login successful', 'success');
                router.push(`/dashboard/${role}`);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Login failed';
            toast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const roleLabels = {
        patient: "ABHA ID / Mobile",
        doctor: "Email / Staff ID",
        admin: "Admin Email",
        lab: "Lab Tech Email",
        pharmacy: "Pharmacist Email",
        driver: "Driver Email"
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-slate-700 dark:text-slate-300 font-semibold">{roleLabels[role] || "Identifier"}</Label>
                    <Input
                        id="identifier"
                        placeholder={role === 'patient' ? "user@abha or +919876543210" : role === 'driver' ? "driver@hospital.com" : role === 'lab' ? "lab@hospital.gov" : role === 'pharmacy' ? "pharmacy@hospital.gov" : "admin@hospital.gov"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
                        <Link href="#" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 bg-slate-50 border-slate-300 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 rounded-xl"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className={`w-full h-12 text-base font-semibold shadow-lg transition-all rounded-xl ${role === 'patient' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' :
                    role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none' :
                    role === 'lab' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none' :
                    role === 'pharmacy' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none' :
                    role === 'driver' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-none' :
                        'bg-slate-800 hover:bg-slate-900'
                    }`}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In to Account"}
            </Button>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">New to ArogyaMitra? </span>
                <Link
                    href={`/auth/${role}/register`}
                    className={`font-semibold hover:underline ${role === 'patient' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                >
                    Create an account
                </Link>
            </div>
        </form>
    );
}
