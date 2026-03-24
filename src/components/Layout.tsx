import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Upload, BarChart3, Settings, Tags, TrendingUp, ShieldCheck, 
  Sparkles, Lock, LogOut, Home, MessageSquare, Blocks, 
  ShieldAlert, Menu, UserCircle, LayoutGrid, ExternalLink,
  Wrench, MessageSquareQuote, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

// Itens que agora exigem login e serão módulos futuramente
const legacyModuleItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/precificacao', label: 'Precificação', icon: Upload },
  { to: '/products', label: 'Lista de Produtos', icon: Tags },
  { to: '/audit', label: 'Auditoria Fiscal', icon: ShieldCheck },
  { to: '/new-business', label: 'Análise de Viabilidade', icon: Sparkles },
];

// Itens de Inteligência (Core)
const intelligenceNavItems = [
  { to: '/chat', label: 'Chat Inteligente', icon: MessageSquare },
  { to: '/skills', label: 'Minhas Skills', icon: Wrench },
  { to: '/prompts', label: 'Biblioteca Prompts', icon: MessageSquareQuote },
  { to: '/agents', label: 'Agentes Especialistas', icon: Zap },
];

const adminNavItems = [
  { to: '/admin', label: 'Painel Admin', icon: ShieldAlert },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { autenticado, logout, isAdmin, profile, session } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dynamicModules, setDynamicModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchInstalledModules = async () => {
      if (!autenticado || !session?.user) {
        setDynamicModules([]);
        return;
      }

      try {
        const { data: installedData, error: installedError } = await supabase
          .from('installed_modules')
          .select('module_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        if (installedError) throw installedError;
        if (!installedData || installedData.length === 0) {
          setDynamicModules([]);
          return;
        }

        const moduleIds = installedData.map(item => item.module_id);
        const { data: systemData, error: systemError } = await supabase
          .from('system_modules')
          .select('id, name, module_type')
          .in('id', moduleIds);

        if (systemError) throw systemError;

        const formatted = (systemData || []).map((mod: any) => ({
          to: mod.module_type === 'internal' ? `/${mod.id}` : `/app/${mod.id}`,
          label: mod.name,
          icon: mod.module_type === 'internal' ? LayoutGrid : ExternalLink,
          id: mod.id
        }));

        setDynamicModules(formatted);
      } catch (err) {
        console.error("[Layout] Erro ao carregar módulos dinâmicos:", err);
      }
    };

    fetchInstalledModules();
  }, [autenticado, session]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Sessão encerrada.');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao sair.');
    }
  };

  const NavButton = ({ item, isLocked = false, isDynamic = false }: { item: any, isLocked?: boolean, isDynamic?: boolean }) => {
    const isActive = location.pathname === item.to;
    return (
      <Link to={item.to} className="block w-full">
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

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card sticky top-0 h-screen">
        <div className="p-4 border-b border-border bg-gradient-primary flex items-center gap-3 shrink-0">
          <div className="rounded-lg bg-black/30 p-2 backdrop-blur shrink-0">
            <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-8 w-8" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-black truncate leading-tight">JOTA</h1>
            <p className="text-[10px] text-black/70 truncate leading-tight">Placa-mãe Inteligente</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          
          {autenticado ? (
            <>
              {/* SEÇÃO 1: INTELIGÊNCIA (CORE) */}
              <div className="space-y-1">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-primary tracking-wider flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Inteligência Core
                </div>
                {intelligenceNavItems.map(item => <NavButton key={item.to} item={item} />)}
              </div>

              {/* SEÇÃO 2: MÓDULOS INSTALADOS */}
              <div className="space-y-1 mt-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <Blocks className="h-3 w-3" /> Marketplace
                </div>
                <NavButton item={{ to: '/modules', label: 'Loja de Módulos', icon: Blocks }} />
                {dynamicModules.map(item => (
                  <NavButton key={item.id} item={item} isDynamic />
                ))}
              </div>

              {/* SEÇÃO 3: MÓDULOS LEGADOS (FUTUROS PLUGINS) */}
              <div className="space-y-1 mt-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Módulos Legados</div>
                {legacyModuleItems.map(item => <NavButton key={item.to} item={item} />)}
              </div>

              {isAdmin && (
                <div className="space-y-1 mt-6">
                  <div className="mb-2 px-3 text-[10px] font-bold uppercase text-destructive tracking-wider flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Administração
                  </div>
                  {adminNavItems.map(item => <NavButton key={item.to} item={item} />)}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-xs text-muted-foreground">Faça login para acessar as ferramentas de inteligência e módulos.</p>
            </div>
          )}

          <div className="space-y-1 mt-6">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sistema</div>
            <NavButton item={{ to: '/configuracao', label: 'Configurações', icon: Settings }} isLocked={!autenticado} />
          </div>
        </div>

        <div className="p-4 border-t border-border shrink-0 bg-muted/10">
          {autenticado ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2 bg-background p-2 rounded-lg border border-border/50">
                <UserCircle className="h-8 w-8 text-primary shrink-0" />
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold truncate">{profile?.company_name || profile?.first_name || 'Usuário'}</p>
                  <Badge variant={isAdmin ? "destructive" : "outline"} className={cn("text-[8px] uppercase mt-0.5", !isAdmin && "bg-muted")}>
                    {profile?.role || 'empresa'}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          ) : (
            <Link to="/login" className="w-full block">
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Lock className="h-4 w-4 mr-2" /> Acesso Completo
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 w-full">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-6 w-6" />
            <span className="font-bold text-sm">JOTA</span>
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border bg-gradient-primary">
                  <h1 className="text-lg font-bold text-black">JOTA</h1>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {autenticado ? (
                    <>
                      {intelligenceNavItems.map(item => <NavButton key={item.to} item={item} />)}
                      {dynamicModules.map(item => <NavButton key={item.id} item={item} isDynamic />)}
                      {legacyModuleItems.map(item => <NavButton key={item.to} item={item} />)}
                      {isAdmin && adminNavItems.map(item => <NavButton key={item.to} item={item} />)}
                    </>
                  ) : (
                    <NavButton item={{ to: '/login', label: 'Login', icon: Lock }} />
                  )}
                  <NavButton item={{ to: '/configuracao', label: 'Configurações', icon: Settings }} isLocked={!autenticado} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};