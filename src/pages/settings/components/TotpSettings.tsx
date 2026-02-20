import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  getTotpStatus,
  setupTotp,
  enableTotp,
  disableTotp,
  type TotpSetupResponse,
} from "@/api/authApi";

export function TotpSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await getTotpStatus();
      setIsEnabled(status);
    } catch (err) {
      console.error("Failed to load TOTP status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupClick = async () => {
    try {
      setIsLoading(true);
      const data = await setupTotp();
      setSetupData(data);
      setShowSetupDialog(true);
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Setup Failed",
        text: err instanceof Error ? err.message : "Failed to initialize TOTP setup",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableSubmit = async () => {
    if (!setupData || verifyCode.length !== 6) return;

    setIsSubmitting(true);
    try {
      await enableTotp(setupData.secret, verifyCode);
      setIsEnabled(true);
      setShowSetupDialog(false);
      setSetupData(null);
      setVerifyCode("");
      await Swal.fire({
        icon: "success",
        title: "TOTP Enabled",
        text: "Two-factor authentication has been enabled for your account.",
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err instanceof Error ? err.message : "Invalid verification code",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableSubmit = async () => {
    if (disableCode.length !== 6) return;

    setIsSubmitting(true);
    try {
      await disableTotp(disableCode);
      setIsEnabled(false);
      setShowDisableDialog(false);
      setDisableCode("");
      await Swal.fire({
        icon: "success",
        title: "TOTP Disabled",
        text: "Two-factor authentication has been disabled.",
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err instanceof Error ? err.message : "Invalid verification code",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                )}
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account using an authenticator app.
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication. You will need to enter a
                code from your authenticator app when signing in with your password.
              </p>
              <Button variant="destructive" onClick={() => setShowDisableDialog(true)}>
                Disable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an additional layer of security to your account by
                requiring a code from your authenticator app in addition to your password.
              </p>
              <Button onClick={handleSetupClick}>
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <img
                  src={setupData.qrCodeDataUri}
                  alt="TOTP QR Code"
                  className="w-48 h-48 border rounded-lg"
                />
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Or enter this code manually:
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={setupData.secret}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="verifyCode">Enter verification code</Label>
                <Input
                  id="verifyCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnableSubmit}
              disabled={isSubmitting || verifyCode.length !== 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter a code from your authenticator app to confirm disabling 2FA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification code</Label>
              <Input
                id="disableCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                value={disableCode}
                onChange={(e) =>
                  setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableSubmit}
              disabled={isSubmitting || disableCode.length !== 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Disable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
