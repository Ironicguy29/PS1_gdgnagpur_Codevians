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
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="identifier">{roleLabels[role] || "Identifier"}</Label>
                <Input
                    id="identifier"
                    placeholder={role === 'patient' ? "user@abha" : "admin@hospital.gov"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
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
                />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In"}
            </Button>

            <div className="mt-4 text-center text-sm">
                <span className="text-slate-500">Don't have an account? </span>
                <Link href={`/auth/${role}/register`} className="font-semibold text-blue-600 hover:underline">
                    Sign up
                </Link>
            </div>
        </form>
    );
}
