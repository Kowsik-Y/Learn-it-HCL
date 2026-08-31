'use client';

import { Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Card className="border-primary/20 shadow-xl bg-card/80 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
          <CardDescription>Sign in to your Learn-it account</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="email"
                >
                  Email Address
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Mail />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="password"
                >
                  Password
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Lock />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </InputGroup>
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full font-bold mt-6" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
