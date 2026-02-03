'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api, { setAuthToken } from "@/lib/api";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ abha_id: '', password: '', name: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, formData);

      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user?.role === 'admin') router.push('/dashboard/admin');
        else if (data.user?.role === 'doctor') router.push('/dashboard/doctor');
        else router.push('/dashboard/patient');
      } else if (!isLogin) {
        alert("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-800">ArogyaMitra</h1>
        <p className="text-slate-600">AI-Powered Government Hospital Scheduler</p>
      </div>

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isLogin ? 'Login to Portal' : 'Register New Patient'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="9876543210" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="abha">ABHA ID / Mobile</Label>
              <Input id="abha" placeholder="user@abha" onChange={(e) => setFormData({ ...formData, abha_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">{isLogin ? 'Login' : 'Register'}</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
              {isLogin ? "New user? Register here" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
