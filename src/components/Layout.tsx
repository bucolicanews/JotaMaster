import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Upload, Settings, Tags, ShieldCheck, 
  Sparkles, Lock, LogOut, Home, MessageSquare, Blocks, 
  ShieldAlert, Menu, UserCircle, LayoutGrid, ExternalLink,
  Wrench, MessageSquareQuote, Zap, Wallet, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

const coreNavItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/chat', label: 'Chat Inteligente', icon: MessageSquare },
  { to: '/prompts', label: 'Biblioteca Prompts', icon: MessageSquareQuote },
];

const legacyModuleItems = [
  { to: '/precificacao', label: 'Precificação', icon: Upload },
  { to: '/products', label: 'Lista de Produtos', icon: Tags },
  { to: '/audit', label: 'Auditoria Fiscal', icon: ShieldCheck },
  { to: '/new-business', label: 'Análise de Viabilidade', icon: Sparkles },
];

const adminNavItems = [
  { to: '/admin', label: 'Painel Admin', icon: ShieldAlert },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { autenticado, logout, isAdmin, profile, session } = useAuth();
  const [dynamicModules, setDynamicModules] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isFullscreenModule = location.pathname.startsWith('/app/');

  useEffect(() => {
    const fetchInstalledModules = async () => {
      if (!autenticado || !session?.user) {
        setDynamicModules([]);
        return;
      }

      try {
        const { data: installedData } = await supabase
          .from('installed_modules')
          .select('module_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        if (!installedData || installedData.length === 0) {
          setDynamicModules([]);
          return;
        }

        const moduleIds = installedData.map(item => item.module_id);
        const { data: systemData } = await supabase
          .from('system_modules')
          .select('id, name, module_type')
          .in('id', moduleIds);

        const formatted = (systemData || []).map((mod: any) => ({
          to: mod.module_type === 'internal' ? `/${mod.id}` : `/app/${mod.id}`,
          label: mod.name,
          icon: mod.id === 'skills' ? Wrench : mod.id === 'agents' ? Zap : LayoutGrid,
          id: mod.id
        }));

        setDynamicModules(formatted);
      } catch (err) {
        console.error("[Layout] Erro ao carregar módulos:", err);
      }
    };

    const fetchBalance = async () => {
      if (!autenticado || !session?.user || isAdmin) return;
      const { data } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();
      if (data) setBalance(data.balance);
    };

    fetchInstalledModules();
    fetchBalance();

    if (autenticado && session?.user && !isAdmin) {
      const channel = supabase
        .channel('wallet_changes')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'wallets',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          setBalance(payload.new.balance);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [autenticado, session, isAdmin]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavButton = ({ item, isLocked = false, isDynamic = false }: { item: any, isLocked?: boolean, isDynamic?: boolean }) => {
    const isActive = location.pathname === item.to;
    return (
      <Link to={item.to} className="block w-full" onClick={() => setIsMobileOpen(false)}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start py-2 px-3 h-10 transition-colors text-sm font-medium",
            isActive
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : isDynamic 
                ? "text-foreground hover:bg-primary/10 hover:text-primary border-l-2 border-transparent hover:border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <item.icon className={cn("h-4 w-4 mr-3 shrink-0", isActive ? "" : isDynamic ? "text-primary" : "")} />
          <span className="truncate">{item.label}</span>
          {isLocked && <Lock className="h-3 w-3 ml-auto opacity-50 shrink-0" />}
        </Button>
      </Link>
    );
  };

  const NavigationContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {autenticado ? (
          <>
            <div className="space-y-1">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase text-primary tracking-wider">Inteligência Core</div>
              {coreNavItems.map(item => <NavButton key={item.to} item={item} />)}
            </div>

            <div className="space-y-1 mt-6">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Financeiro</div>
              {isAdmin ? (
                <Link to="/admin/finance" className="block w-full" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start py-2 px-3 h-12 transition-all border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
                      location.pathname === '/admin/finance' && "bg-blue-500/20 border-blue-500/40"
                    )}
                  >
                    <BarChart3 className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Gestão</span>
                      <span className="text-sm font-black text-blue-600 leading-none">Dashboard Master</span>
                    </div>
                  </Button>
                </Link>
              ) : (
                <Link to="/credits" className="block w-full" onClick={() => setIsMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start py-2 px-3 h-12 transition-all border border-primary/20 bg-primary/5 hover:bg-primary/10",
                      location.pathname === '/credits' && "bg-primary/20 border-primary/40"
                    )}
                  >
                    <Wallet className="h-5 w-5 mr-3 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Saldo</span>
                      <span className="text-sm font-black text-primary leading-none">
                        {balance !== null ? `${balance} Créditos` : '...'}
                      </span>
                    </div>
                  </Button>
                </Link>
              )}
            </div>

            <div className="space-y-1 mt-6">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Marketplace</div>
              <NavButton item={{ to: '/modules', label: 'Loja de Módulos', icon: Blocks }} />
              {dynamicModules.map(item => <NavButton key={item.id} item={item} isDynamic />)}
            </div>

            {isAdmin && (
              <div className="space-y-1 mt-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Módulos Legados</div>
                {legacyModuleItems.map(item => <NavButton key={item.to} item={item} />)}
              </div>
            )}

            {isAdmin && (
              <div className="space-y-1 mt-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-destructive tracking-wider">Administração</div>
                {adminNavItems.map(item => <NavButton key={item.to} item={item} />)}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <p className="text-xs text-muted-foreground">Faça login para acessar.</p>
          </div>
        )}

        <div className="space-y-1 mt-6">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sistema</div>
          <NavButton item={{ to: '/configuracao', label: 'Configurações', icon: Settings }} isLocked={!autenticado} />
        </div>
      </div>

      <div className="p-4 border-t border-border shrink-0 bg-muted/10">
        {autenticado && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2 bg-background p-2 rounded-lg border border-border/50">
              <UserCircle className="h-8 w-8 text-primary shrink-0" />
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate">{profile?.company_name || profile?.first_name || 'Usuário'}</p>
                <Badge variant={isAdmin ? "destructive" : "outline"} className="text-[8px] uppercase mt-0.5">{profile?.role || 'empresa'}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-destructive border-destructive/20" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* SIDEBAR DESKTOP - Oculta no modo imersivo */}
      {!isFullscreenModule && (
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen shrink-0">
          <div className="p-4 border-b border-border bg-gradient-primary flex items-center gap-3 shrink-0">
            <div className="rounded-lg bg-black/30 p-2 backdrop-blur shrink-0">
              <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-8 w-8" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-black truncate leading-tight">JOTA</h1>
              <p className="text-[10px] text-black/70 truncate leading-tight">Placa-mãe Inteligente</p>
            </div>
          </div>
          <NavigationContent />
        </aside>
      )}

      <div className="flex flex-col flex-1 w-full h-full relative overflow-hidden">
        
        {/* HEADER MOBILE - Oculto no modo imersivo */}
        {!isFullscreenModule && (
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50 shrink-0">
            <div className="flex items-center gap-2">
              <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-6 w-6" />
              <span className="font-bold text-sm">JOTA</span>
            </div>
            
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r border-border flex flex-col h-full">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <div className="p-4 border-b border-border bg-gradient-primary flex items-center gap-3 shrink-0">
                  <div className="rounded-lg bg-black/30 p-2 backdrop-blur shrink-0">
                    <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-6 w-6" />
                  </div>
                  <h1 className="text-lg font-bold text-black">JOTA</h1>
                </div>
                <NavigationContent />
              </SheetContent>
            </Sheet>
          </header>
        )}

        {/* BOTÃO FLUTUANTE DISCRETO (Modo Imersivo) */}
        {isFullscreenModule && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-background/80 backdrop-blur-md border-primary/20 hover:bg-primary/10 h-10 w-10 transition-transform hover:scale-105">
                  <Menu className="h-5 w-5 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r border-border flex flex-col h-full">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <div className="p-4 border-b border-border bg-gradient-primary flex items-center gap-3 shrink-0">
                  <div className="rounded-lg bg-black/30 p-2 backdrop-blur shrink-0">
                    <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-6 w-6" />
                  </div>
                  <h1 className="text-lg font-bold text-black">JOTA</h1>
                </div>
                <NavigationContent />
              </SheetContent>
            </Sheet>
            
            {/* Etiqueta ancorada ao botão */}
            <div className="pointer-events-none flex items-center gap-1.5 text-[10px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/30 px-3 py-1.5 rounded-full uppercase font-bold tracking-wider shadow-sm backdrop-blur-md">
              <Lock className="h-3 w-3" /> Sandbox
            </div>
          </div>
        )}

        <main className={cn("flex-1 overflow-y-auto overflow-x-hidden h-full", isFullscreenModule ? "p-0" : "")}>
          {children}
        </main>
      </div>
    </div>
  );
};