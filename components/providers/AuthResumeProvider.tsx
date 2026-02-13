"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { useResumeStore } from "@/hooks/useResumeStore";
import { normalizeResume } from "@/lib/resume";
import { firebaseEnabled, getFirebaseAuth, getFirestoreDb, googleProvider } from "@/lib/firebase";
import { ResumeData, TemplateVariant } from "@/lib/types";
import { BillingInterval, Currency } from "@/lib/pricing";

interface AuthResumeContextValue {
  user: User | null;
  authReady: boolean;
  storageEnabled: boolean;
  plan: "free" | "pro";
  isPro: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  upgradeToPro: (currency: Currency, interval: BillingInterval, couponCode?: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthResumeContext = createContext<AuthResumeContextValue | null>(null);

const TEMPLATE_VARIANTS = new Set<TemplateVariant>([
  "aurora",
  "noir",
  "serif",
  "grid",
  "capsule",
  "linear",
  "focus",
  "metro",
  "elevate",
  "minimal",
  "legacy",
]);

const isTemplateVariant = (value: unknown): value is TemplateVariant =>
  typeof value === "string" && TEMPLATE_VARIANTS.has(value as TemplateVariant);

export function AuthResumeProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const storageEnabled = firebaseEnabled();
  const auth = useMemo(() => getFirebaseAuth(), [storageEnabled]);
  const db = useMemo(() => getFirestoreDb(), [storageEnabled]);

  const isHydratingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setResume = useResumeStore((state) => state.setResume);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const setJobDescription = useResumeStore((state) => state.setJobDescription);

  const refreshSubscription = useCallback(async () => {
    const currentUser = getFirebaseAuth()?.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/billing/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.plan === "pro" || data.plan === "free") {
      setPlan(data.plan);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("resumio_plan", data.plan);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPlan = window.localStorage.getItem("resumio_plan");
    if (savedPlan === "pro" || savedPlan === "free") {
      setPlan(savedPlan);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser || !db) return;

      try {
        isHydratingRef.current = true;
        const ref = doc(db, "users", nextUser.uid, "resumes", "default");
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) return;

        const data = snapshot.data();
        if (data.resume) {
          setResume(normalizeResume(data.resume as ResumeData));
        }
        if (isTemplateVariant(data.template)) {
          setTemplate(data.template);
        }
        if (typeof data.jobDescription === "string") {
          setJobDescription(data.jobDescription);
        }
        if (data.subscriptionPlan === "pro" || data.subscriptionPlan === "free") {
          setPlan(data.subscriptionPlan);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("resumio_plan", data.subscriptionPlan);
          }
        }
        if (data.updatedAt?.toDate) {
          setLastSavedAt(data.updatedAt.toDate().toISOString());
          setSaveStatus("saved");
        }
        await refreshSubscription();
      } catch (error) {
        console.error("Failed loading cloud resume:", error);
      } finally {
        isHydratingRef.current = false;
      }
    });

    return unsubscribe;
  }, [auth, db, refreshSubscription, setJobDescription, setResume, setTemplate]);

  useEffect(() => {
    if (!db || !user) return;

    const unsubscribe = useResumeStore.subscribe((state, prevState) => {
      if (isHydratingRef.current) return;

      const didChange =
        state.resume !== prevState.resume ||
        state.template !== prevState.template ||
        state.jobDescription !== prevState.jobDescription;

      if (!didChange) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const payload = {
        resume: state.resume,
        template: state.template,
        jobDescription: state.jobDescription,
        subscriptionPlan: plan,
        updatedAt: serverTimestamp(),
      };

      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(() => {
        const ref = doc(db, "users", user.uid, "resumes", "default");
        void setDoc(ref, payload, { merge: true })
          .then(() => {
            const now = new Date().toISOString();
            setLastSavedAt(now);
            setSaveStatus("saved");
          })
          .catch((error) => {
            console.error("Failed saving cloud resume:", error);
            setSaveStatus("error");
          });
      }, 800);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [db, user, plan]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  const upgradeToPro = async (currency: Currency, interval: BillingInterval, couponCode?: string) => {
    const currentUser = getFirebaseAuth()?.currentUser;
    if (!currentUser) {
      throw new Error("Please sign in first.");
    }
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/billing/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currency, interval, couponCode }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) {
      throw new Error(result.error || "Unable to start checkout");
    }
    window.location.assign(result.url);
  };

  const openBillingPortal = async () => {
    const currentUser = getFirebaseAuth()?.currentUser;
    if (!currentUser) {
      throw new Error("Please sign in first.");
    }
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/billing/create-portal-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) {
      throw new Error(result.error || "Unable to open billing portal");
    }
    window.location.assign(result.url);
  };

  const value: AuthResumeContextValue = {
    user,
    authReady,
    storageEnabled,
    plan,
    isPro: plan === "pro",
    saveStatus,
    lastSavedAt,
    signInWithGoogle,
    signOutUser,
    upgradeToPro,
    openBillingPortal,
    refreshSubscription,
  };

  return <AuthResumeContext.Provider value={value}>{children}</AuthResumeContext.Provider>;
}

export function useAuthResume() {
  const context = useContext(AuthResumeContext);
  if (!context) {
    throw new Error("useAuthResume must be used inside AuthResumeProvider");
  }
  return context;
}
