import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'vendedor' | 'empresa';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  role: UserRole;
  vendedor_id: string | null;
}

interface AuthContextType {
  autenticado: boolean;
  session: Session | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType>({
  autenticado: false,
  session: null,
  profile: null,
  logout: async () => {},
  isLoading: true,
  isAdmin: false,
  isVendedor: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar os dados extras do usuário (Role, Nome, etc)
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (data && !error) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    }
  };

  useEffect(() => {
    // Busca a sessão inicial ao carregar o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Escuta mudanças de estado na autenticação (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setIsLoading(true);
        fetchProfile(session.user.id).then(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      autenticado: !!session, 
      session, 
      profile, 
      logout, 
      isLoading,
      isAdmin: profile?.role === 'admin',
      isVendedor: profile?.role === 'vendedor'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);