"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Building, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { 
  InputGroup, 
  InputGroupAddon, 
  InputGroupInput, 
  InputGroupTextarea,
  InputGroupText
} from "@/components/ui/input-group";

export default function RequestAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit request");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-primary/20 shadow-xl bg-card/80 backdrop-blur text-center">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto bg-green-500/10 text-green-500 h-16 w-16 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Request Submitted!</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Thank you for applying. Our team will review your application and provision an account for you shortly.
              </p>
            </div>
            <Link href="/" className="inline-block mt-4">
              <Button variant="outline" className="font-bold">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-primary/20 shadow-xl bg-card/80 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-extrabold">Request Access</CardTitle>
          <CardDescription>Apply for an invitation to the platform</CardDescription>
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
                <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  Full Name
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <User />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  Email Address
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Mail />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@company.com"
                    required
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  Organization / Company (Optional)
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Building />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  How will you use the platform?
                </FieldLabel>
                <InputGroup className="items-start pt-2">
                  <InputGroupAddon>
                    <InputGroupText>
                      <FileText className="mt-0.5" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupTextarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Tell us a bit about your learning goals..."
                    className="min-h-25 pt-0 pb-2"
                    required
                  />
                </InputGroup>
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full font-bold mt-6" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
