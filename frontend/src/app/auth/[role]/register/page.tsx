"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import api, { setAuthToken } from "@/lib/api";

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const role = params.role as "patient" | "doctor" | "admin";

    const [formData, setFormData] = useState({ name: '', phone: '', identifier: '', password: '', secret_code: '' });
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                role,
                name: formData.name,
                phone: formData.phone,
                [role === 'patient' ? 'abha_id' : 'email']: formData.identifier,
                password: formData.password,
                secret_code: role !== 'patient' ? formData.secret_code : undefined
            };

            const { data } = await api.post('/auth/register', payload);

            if (data.token) {
                setAuthToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push(`/dashboard/${role}`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        placeholder="John Doe"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        placeholder="+91..."
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="identifier">{role === 'patient' ? "ABHA ID" : "Email"}</Label>
                <Input
                    id="identifier"
                    placeholder={role === 'patient' ? "user@abha" : "staff@hospital.gov"}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
            </div>

            {role !== 'patient' && (
                <div className="space-y-2">
                    <Label htmlFor="secret_code" className="text-red-500 font-semibold">Hospital Secret Code</Label>
                    <Input
                        id="secret_code"
                        type="password"
                        placeholder="Required for Staff Access"
                        onChange={(e) => setFormData({ ...formData, secret_code: e.target.value })}
                        required
                        className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900 focus:ring-red-500"
                    />
                </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
            </Button>

            <div className="mt-4 text-center text-sm">
                <span className="text-slate-500">Already a member? </span>
                <Link href={`/auth/${role}/login`} className="font-semibold text-blue-600 hover:underline">
                    Login
                </Link>
            </div>
        </form>
    );
}
