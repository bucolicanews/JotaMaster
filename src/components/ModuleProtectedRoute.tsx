import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModuleProtectedRouteProps {
  moduleId: string;
  children: React.ReactNode;
}

export const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({ moduleId, children }) => {
  const { autenticado, isLoading: isAuthLoading, session, isAdmin } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkModuleAccess = async () => {
      if (!autenticado || !session?.user) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      // Admin tem passe livre (Bypass Autorizado por Arquitetura)
      if (isAdmin) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('installed_modules')
          .select('is_active')
          .eq('user_id', session.user.id)
          .eq('module_id', moduleId)
          .single();

        if (error || !data || !data.is_active) {
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      } catch (err) {
        console.error(`[AppSec] Erro na validação de acesso ao módulo ${moduleId}:`, err);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (!isAuthLoading) {
      checkModuleAccess();
    }
  }, [autenticado, isAuthLoading, session, moduleId, isAdmin]);

  if (isAuthLoading || isChecking) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Autenticando permissões do módulo...</p>
      </div>
    );
  }

  if (!hasAccess) {
    toast.error('Acesso Negado: Você não possui este módulo ativo no seu plano.');
    return <Navigate to="/modules" replace />;
  }

  return <>{children}</>;
};