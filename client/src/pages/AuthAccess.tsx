import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type LoginMethod = "phone" | "gmail";

export default function AuthAccess() {
  const [location, setLocation] = useLocation();
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const ssoUrlQuery = trpc.auth.getGoogleSsoUrl.useQuery();

  const requestCode = trpc.auth.requestVerificationCode.useMutation({
    onSuccess: (data) => {
      setLastCode(data.verificationCode);
      toast.success("Verification code generated");
    },
    onError: (error) => toast.error(error.message),
  });

  const verifyCode = trpc.auth.verifyCodeAndSignIn.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Signed in successfully");
      setLocation("/");
    },
    onError: (error) => toast.error(error.message),
  });

  const googleLoginUrl = ssoUrlQuery.data?.url || getLoginUrl();

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold text-foreground">Login / Register</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use phone + verification code, Gmail + verification code, or Google SSO.
        </p>

        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            size="sm"
            variant={method === "phone" ? "default" : "outline"}
            onClick={() => setMethod("phone")}
          >
            Phone
          </Button>
          <Button
            type="button"
            size="sm"
            variant={method === "gmail" ? "default" : "outline"}
            onClick={() => setMethod("gmail")}
          >
            Gmail
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Label>{method === "phone" ? "Phone number" : "Gmail"}</Label>
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={method === "phone" ? "+1 5551234567" : "you@gmail.com"}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => requestCode.mutate({ method, target, purpose: "login" })}
            disabled={requestCode.isPending || !target.trim()}
          >
            {requestCode.isPending ? "Sending..." : "Send verification code"}
          </Button>

          <div>
            <Label>Verification code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
          </div>
          <Button
            type="button"
            onClick={() => verifyCode.mutate({ method, target, code })}
            disabled={verifyCode.isPending || !target.trim() || !code.trim()}
            className="w-full"
          >
            {verifyCode.isPending ? "Verifying..." : "Login / Register"}
          </Button>
        </div>

        {lastCode && (
          <p className="text-xs text-muted-foreground mt-3">
            Dev code (for testing): <span className="font-mono text-foreground">{lastCode}</span>
          </p>
        )}

        <div className="my-4 h-px bg-border" />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            if (!googleLoginUrl) return;
            window.location.href = googleLoginUrl;
          }}
        >
          Continue with Google SSO
        </Button>

        {location !== "/" && (
          <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => setLocation("/")}>
            Back to preview
          </Button>
        )}
      </div>
    </div>
  );
}
