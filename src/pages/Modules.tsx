import React, { useEffect, useState } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Blocks, CheckCircle2, Lock, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Modules() {
  const { session, autenticado } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [installedIds, setInstalledIds] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!autenticado || !session?.user) return;

        // 1. Busca Vitrine (Módulos Ativos pelo Admin)
        const { data: sysData, error: sysError } = await supabase
          .from('system_modules')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });
        
        if (sysError) throw sysError;
        setCatalog(sysData || []);

        // 2. Busca o que o usuário tem instalado
        const { data: instData, error: instError } = await supabase
          .from('installed_modules')
          .select('module_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        if (instError) throw instError;
        setInstalledIds((instData || []).map(d => d.module_id));

      } catch (err: any) {
        toast.error("Erro ao sincronizar marketplace.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [autenticado, session]);

  const handleAction = async (mod: any, isInstalled: boolean) => {
    if (isInstalled) {
      // Redireciona para a rota com o mesmo nome do ID do módulo (ex: /crm, /pricing)
      navigate(`/${mod.id}`);
      return;
    }

    // Fluxo de Aquisição (Simulado por enquanto, em produção chamaria Stripe/Asaas)
    setIsProcessing(mod.id);
    try {
      if (Number(mod.price) === 0) {
        // Instalação automática se for gratuito
        const { error } = await supabase.from('installed_modules').insert({
          user_id: session?.user.id,
          module_id: mod.id,
          is_active: true
        });
        if (error) throw error;
        setInstalledIds(prev => [...prev, mod.id]);
        toast.success(`Módulo ${mod.name} ativado com sucesso!`);
      } else {
        toast.info(`Solicitação de aquisição para ${mod.name} (R$ ${mod.price}) enviada ao comercial.`);
      }
    } catch (err: any) {
      toast.error('Falha na transação.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Blocks className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Marketplace (App Store)</h1>
          <p className="text-sm text-muted-foreground">Adicione novas inteligências e blocos ao seu ecossistema JOTA.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando catálogo...</p>
        </div>
      ) : catalog.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
          <p className="text-muted-foreground">Nenhum módulo disponível no catálogo no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((mod) => {
            const isInstalled = installedIds.includes(mod.id);
            const isFree = Number(mod.price) === 0;

            return (
              <Card key={mod.id} className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${!isInstalled ? 'border-border shadow-sm' : 'border-primary/50 shadow-elegant bg-primary/5'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg border bg-background">
                      <Blocks className={`h-6 w-6 ${isInstalled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    {isInstalled ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Instalado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground shadow-sm">
                        <Lock className="h-3 w-3 mr-1" /> Loja
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4 flex justify-between items-center">
                    {mod.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
                    {mod.description}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="mt-auto pt-4 border-t border-border/50 bg-card flex items-center justify-between">
                  {!isInstalled && (
                    <span className="font-mono font-bold text-lg text-primary">
                      {isFree ? 'Grátis' : `R$ ${Number(mod.price).toFixed(2)}`}
                    </span>
                  )}
                  <Button 
                    variant={isInstalled ? "default" : "outline"} 
                    className={`ml-auto ${isInstalled ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border-primary/50 text-primary'}`}
                    onClick={() => handleAction(mod, isInstalled)}
                    disabled={isProcessing === mod.id}
                  >
                    {isProcessing === mod.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                     isInstalled ? 'Acessar Módulo' : 
                     isFree ? 'Instalar Agora' : <><ShoppingCart className="h-4 w-4 mr-2" /> Adquirir</>}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}