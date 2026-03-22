import React, { useEffect, useState } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Blocks, CheckCircle2, Lock, ShoppingCart, Loader2, ExternalLink, BrainCircuit, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { syncModuleManifest } from '@/lib/aiEcosystem'; // Importação do motor de inteligência

export default function Modules() {
  const { session, autenticado } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [installedIds, setInstalledIds] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null); // Controle de UI para o Sync de IA

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
      if (mod.module_type === 'internal') {
        navigate(`/${mod.id}`);
      } else {
        navigate(`/app/${mod.id}`);
      }
      return;
    }

    // Fluxo de Aquisição (Simulado por enquanto)
    setIsProcessing(mod.id);
    try {
      if (Number(mod.price) === 0) {
        const { error } = await supabase.from('installed_modules').insert({
          user_id: session?.user.id,
          module_id: mod.id,
          is_active: true
        });
        if (error) throw error;
        setInstalledIds(prev => [...prev, mod.id]);
        toast.success(`Módulo ${mod.name} ativado com sucesso!`);
        
        // Dispara a sincronização de IA automaticamente ao instalar, se for módulo externo
        if (mod.module_type === 'iframe' && mod.bundle_url) {
          handleSyncAI(mod);
        }

      } else {
        toast.info(`Solicitação de aquisição para ${mod.name} (R$ ${mod.price}) enviada ao comercial.`);
      }
    } catch (err: any) {
      toast.error('Falha na transação.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Função para absorver a Inteligência do Módulo (AI Manifest)
  const handleSyncAI = async (mod: any) => {
    if (!session?.user) return;
    
    setSyncingId(mod.id);
    try {
      const itemsAbsorbed = await syncModuleManifest(mod.id, mod.bundle_url, session.user.id);
      if (itemsAbsorbed > 0) {
        toast.success(`Inteligência absorvida!`, {
          description: `${itemsAbsorbed} habilidades/agentes foram ensinados ao Master.`
        });
      } else {
        toast.info("O módulo não possui novas habilidades para ensinar (ai-manifest.json vazio).");
      }
    } catch (error: any) {
      if (error.message.includes('Não possui um ai-manifest.json')) {
        toast.info("Módulo tradicional (Sem IA vinculada).", { description: "Nenhum arquivo ai-manifest.json encontrado."});
      } else {
        toast.error("Erro na Sincronização IA", { description: error.message });
      }
    } finally {
      setSyncingId(null);
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
          <p className="text-sm text-muted-foreground">Adicione novas inteligências e blocos de terceiros ao seu ecossistema JOTA.</p>
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
            const isExternal = mod.module_type === 'iframe';

            return (
              <Card key={mod.id} className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${!isInstalled ? 'border-border shadow-sm' : 'border-primary/50 shadow-elegant bg-primary/5'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg border bg-background">
                      {isExternal ? <ExternalLink className={`h-6 w-6 ${isInstalled ? 'text-amber-500' : 'text-muted-foreground'}`} /> : <Blocks className={`h-6 w-6 ${isInstalled ? 'text-primary' : 'text-muted-foreground'}`} />}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {isInstalled ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Instalado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground shadow-sm">
                          <Lock className="h-3 w-3 mr-1" /> Loja
                        </Badge>
                      )}
                      {isExternal && (
                        <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          App Externo (CDN)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-4 flex justify-between items-center">
                    {mod.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
                    {mod.description}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="mt-auto pt-4 border-t border-border/50 bg-card flex flex-col gap-3">
                  <div className="flex items-center justify-between w-full">
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
                  </div>
                  
                  {/* Botão Extra de Sincronizar IA para Módulos Externos Instalados */}
                  {isInstalled && isExternal && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs bg-indigo-500/5 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10"
                      onClick={() => handleSyncAI(mod)}
                      disabled={syncingId === mod.id}
                    >
                      {syncingId === mod.id ? (
                        <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Absorvendo Inteligência...</>
                      ) : (
                        <><BrainCircuit className="h-3 w-3 mr-2" /> Sincronizar Cérebro IA</>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}