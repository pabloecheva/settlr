'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmail, signUpWithEmail, logOut } from '@/app/utils/firebase-auth';
import { toast } from 'sonner';

export function AuthTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const user = await loginWithEmail(email, password);
      toast.success(`Logged in as ${user.email}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const user = await signUpWithEmail(email, password);
      toast.success(`Account created for ${user.email}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-4 p-4 bg-card rounded-lg shadow-lg">
      <h3 className="font-semibold">Auth Test</h3>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={handleLogin} variant="default">
          Login
        </Button>
        <Button onClick={handleSignup} variant="outline">
          Sign Up
        </Button>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </div>
    </div>
  );
} 