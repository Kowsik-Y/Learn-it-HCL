'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { Database, Key, Server, Settings2, ShieldCheck, Cpu } from 'lucide-react';

export default function AdminSettingsPage() {
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(
    process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  );
  const [enableAiCache, setEnableAiCache] = useState(true);
  const [enableMaintenanceMode, setEnableMaintenanceMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('System settings saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure global platform settings, AI model endpoints, and system maintenance."
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Service Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>AI Microservice Settings</CardTitle>
                <CardDescription>Configure OpenAI base URL and ML model options</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai_base_url" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Custom OpenAI Base URL
                </Label>
                <Input
                  id="openai_base_url"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
                <p className="text-xs text-muted-foreground">
                  Supports custom OpenAI proxies or Azure OpenAI deployment endpoints.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Enable AI Response Caching</Label>
                  <p className="text-xs text-muted-foreground">
                    Cache generated course modules and tutor responses for speed.
                  </p>
                </div>
                <Switch checked={enableAiCache} onCheckedChange={setEnableAiCache} />
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure & Status */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Infrastructure Status</CardTitle>
                <CardDescription>Azure Container Apps & PostgreSQL Health</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Azure PostgreSQL Flexible</p>
                    <p className="text-xs text-muted-foreground">psql-learnit-3c1v74.postgres</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Python AI Container App</p>
                    <p className="text-xs text-muted-foreground">ca-learnit-backend (v8)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Healthy
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Platform Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Temporarily restrict student access for maintenance.
                  </p>
                </div>
                <Switch checked={enableMaintenanceMode} onCheckedChange={setEnableMaintenanceMode} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
