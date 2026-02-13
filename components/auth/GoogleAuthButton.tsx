"use client";

import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuthResume } from "@/components/providers/AuthResumeProvider";

export function GoogleAuthButton() {
  const { user, authReady, storageEnabled, signInWithGoogle, signOutUser } = useAuthResume();

  if (!storageEnabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        Cloud sync disabled
      </Button>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
    } catch (error) {
      console.error(error);
      toast.error("Google sign-in failed");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success("Signed out");
    } catch (error) {
      console.error(error);
      toast.error("Sign out failed");
    }
  };

  if (!authReady) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading auth
      </Button>
    );
  }

  if (user) {
    return (
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        {user.displayName?.split(" ")[0] || "Account"}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
