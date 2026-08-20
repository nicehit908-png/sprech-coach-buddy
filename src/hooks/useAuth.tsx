import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  laedt: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, session: null, laedt: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setLaedt(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLaedt(false);
      });
    } catch (e) {
      console.error("[Auth] Verbindung nicht verfügbar", e);
      setSession(null);
      setLaedt(false);
    }
    return () => unsubscribe?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, laedt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}