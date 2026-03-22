import React, { useEffect, useState } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Blocks, Calculator, ShieldCheck, MessageSquare, Users, LineChart, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MODULES_CATALOG = [
  {
    id: 'pricing',
    name: 'Precificação e Viabilidade',
    description: 'Análise tributária completa, simulador de cenários e comparativo de regimes (EC 132).',
    icon: Calculator,
    defaultStatus: 'installed',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'audit',
    name: 'Auditoria Fiscal',
    description: 'Cruzamento de XMLs de entrada e saída para identificar bitributação e passivos.',
    icon: ShieldCheck,
    defaultStatus: 'installed',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    id: 'chat',
    name: 'Chat Consultivo IA',
    description: 'Assistente inteligente integrado às suas skills e base de conhecimento.',
    icon: MessageSquare,
    defaultStatus: 'installed',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'crm',
    name: 'Gestão de Clientes (CRM)',
    description: 'Controle de locatários, contratos e histórico de atendimentos automatizados.',
    icon: Users,
    defaultStatus: 'coming_soon',
    color: 'text-muted-foreground',
    bg: 'bg-muted'
  },
  {
    id: 'finance',
    name: 'BPO Financeiro',
    description: 'Gestão de fluxo de caixa, DRE gerencial e conciliação bancária inteligente.',
    icon: LineChart,
    defaultStatus: 'coming_soon',
    color: 'text-muted-foreground',
    bg: 'bg-muted'
  }
];

export default function Modules() {
  const [installedModuleIds, setInstalledModuleIds] = useState<string[]>(['pricing', 'audit', 'chat']); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModulesFromDatabase = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // Fail Safe: Se não houver usuário autenticado no Supabase (usando Auth local), mantém o mock.
        if (authError || !user) {
          console.info("[AppSec] Sessão Supabase não identificada. Renderizando módulos locais autorizados.");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('installed_modules')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error("[Database] Erro ao buscar módulos:", error.message);
          throw error;
        }
        
        if (data && data.length > 0) {
          setInstalledModuleIds(data.map(d => d.module_id));
        }
      } catch (err: any) {
        toast.error("Erro ao sincronizar módulos com o servidor.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchModulesFromDatabase();
  }, []);

  const handleToggleModule = (modId: string, isInstalled: boolean) => {
    if (!isInstalled) {
      toast.info('Módulo bloqueado. Estará disponível em breve!');
      return;
    }
    toast.success('Módulo ativo. Em breve permitirá acesso às configurações específicas.');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Blocks className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Central de Módulos (Master)</h1>
          <p className="text-sm text-muted-foreground">Gerencie os aplicativos, permissões e ferramentas do seu ecossistema SaaS.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <p>Sincronizando módulos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES_CATALOG.map((mod) => {
            const Icon = mod.icon;
            // Se for coming_soon por padrão, nunca está instalado. Se for instalado, verifica a lista do BD.
            const isInstalled = mod.defaultStatus === 'coming_soon' ? false : installedModuleIds.includes(mod.id);

            return (
              <Card key={mod.id} className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${!isInstalled ? 'opacity-75 grayscale-[0.3] bg-muted/10' : 'border-primary/20 shadow-elegant'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg border border-white/10 ${mod.bg}`}>
                      <Icon className={`h-6 w-6 ${mod.color}`} />
                    </div>
                    {isInstalled ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground shadow-sm border-muted-foreground/20">
                        <Lock className="h-3 w-3 mr-1" /> Em Breve / Bloqueado
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4">{mod.name}</CardTitle>
                  <CardDescription className="text-xs mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
                    {mod.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4 border-t border-border/50 bg-card">
                  <Button 
                    variant={isInstalled ? "default" : "secondary"} 
                    className={`w-full ${isInstalled ? 'bg-primary text-primary-foreground hover:opacity-90' : ''}`}
                    onClick={() => handleToggleModule(mod.id, isInstalled)}
                    disabled={!isInstalled}
                  >
                    {isInstalled ? 'Acessar / Configurar' : 'Indisponível'}
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