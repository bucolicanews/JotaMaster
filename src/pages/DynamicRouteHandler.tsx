import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicModuleLoader } from '@/components/DynamicModuleLoader';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function DynamicRouteHandler() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { session, isAdmin } = useAuth();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const loadAndValidateModule = async () => {
      if (!moduleId || !session?.user) return;
      
      try {
        // 1. Busca os metadados do módulo (onde ele vive, que tipo ele é)
        const { data: sysMod, error: sysErr } = await supabase
          .from('system_modules')
          .select('*')
          .eq('id', moduleId)
          .single();

        if (sysErr || !sysMod) throw new Error('Módulo não encontrado no Catálogo SaaS.');

        // 2. Valida o Controle de Acesso (RBAC/Posse)
        if (isAdmin) {
          setHasAccess(true); // Bypass para arquitetos
        } else {
          const { data: instMod, error: instErr } = await supabase
            .from('installed_modules')
            .select('is_active')
            .eq('user_id', session.user.id)
            .eq('module_id', moduleId)
            .single();

          if (instErr || !instMod || !instMod.is_active) {
            throw new Error('Acesso Negado: Módulo não adquirido, inativo ou assinatura suspensa.');
          }
          setHasAccess(true);
        }

        setModuleData(sysMod);
      } catch (err: any) {
        console.error('[AppSec - Guard] Erro no DynamicRouteHandler:', err);
        toast.error(err.message);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    loadAndValidateModule();
  }, [moduleId, session, isAdmin]);

  // Fallback 1: Autenticando/Processando
  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium tracking-wide">Validando isolamento e permissões do módulo...</p>
      </div>
    );
  }

  // Fallback 2: Acesso Negado
  if (!hasAccess) {
    return <Navigate to="/modules" replace />;
  }

  // Fallback 3: Módulo não é de injeção Iframe ou falta URL
  if (moduleData?.module_type !== 'iframe' || !moduleData?.bundle_url) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-destructive bg-destructive/5 rounded-xl border border-destructive/20 max-w-2xl mx-auto mt-12 p-8">
        <ShieldAlert className="h-16 w-16" />
        <h2 className="text-2xl font-bold">Erro de Arquitetura do Módulo</h2>
        <p className="text-sm text-center">
          O módulo <strong>{moduleData?.name}</strong> está configurado de forma inconsistente no banco de dados. 
          O tipo de renderização não é <code>iframe</code> ou a URL de origem da CDN (<code>bundle_url</code>) não foi preenchida pelo Administrador.
        </p>
      </div>
    );
  }

  // Caminho Feliz: Injeta a aplicação externa no Modo Imersivo (100vh)
  return (
    <div className="flex flex-col h-full w-full relative animate-in fade-in duration-500 bg-background overflow-hidden">
      <div className="flex-1 w-full h-full">
        <DynamicModuleLoader url={moduleData.bundle_url} title={moduleData.name} />
      </div>
    </div>
  );
}