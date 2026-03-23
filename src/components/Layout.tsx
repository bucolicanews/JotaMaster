import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Upload, BarChart3, Settings, Tags, TrendingUp, ShieldCheck, 
  Sparkles, Lock, LogOut, Home, MessageSquare, Blocks, 
  ShieldAlert, Menu, UserCircle, LayoutGrid, ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

const publicNavItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/precificacao', label: 'Precificação', icon: Upload },
  { to: '/products', label: 'Lista de Produtos', icon: Tags },
  { to: '/audit', label: 'Auditoria Fiscal', icon: ShieldCheck },
];

const privateNavItems = [
  { to: '/modules', label: 'Marketplace', icon: Blocks },
  { to: '/chat', label: 'Chat Inteligente', icon: MessageSquare },
  { to: '/new-business', label: 'Análise de Viabilidade', icon: Sparkles },
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

  // Busca módulos instalados com lógica desacoplada (Resiliência a falta de FK)
  useEffect(() => {
    const fetchInstalledModules = async () => {
      if (!autenticado || !session?.user) {
        setDynamicModules([]);
        return;
      }

      try {
        // 1. Busca apenas os IDs dos módulos instalados e ativos para o usuário
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

        // 2. Busca os detalhes desses módulos no catálogo
        const { data: systemData, error: systemError } = await supabase
          .from('system_modules')
          .select('id, name, module_type')
          .in('id', moduleIds);

        if (systemError) throw systemError;

        // 3. Formata para o menu
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
      toast.info('Sessão encerrada com sucesso.');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao sair do sistema.');
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
            <p className="text-[10px] text-black/70 truncate leading-tight">Análise Tributária</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <div className="space-y-1">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Acesso Público</div>
            {publicNavItems.map(item => <NavButton key={item.to} item={item} />)}
          </div>

          {autenticado && (
            <>
              {dynamicModules.length > 0 && (
                <div className="space-y-1 mt-6">
                  <div className="mb-2 px-3 text-[10px] font-bold uppercase text-primary tracking-wider flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" /> Meus Módulos
                  </div>
                  {dynamicModules.map(item => (
                    <NavButton key={item.id} item={item} isDynamic />
                  ))}
                </div>
              )}

              <div className="space-y-1 mt-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">SaaS & Inteligência</div>
                {privateNavItems.map(item => <NavButton key={item.to} item={item} />)}
              </div>
            </>
          )}

          {autenticado && isAdmin && (
            <div className="space-y-1 mt-6">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase text-destructive tracking-wider flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Administração
              </div>
              {adminNavItems.map(item => <NavButton key={item.to} item={item} />)}
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
                <LogOut className="h-4 w-4 mr-2" /> Sair do Sistema
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
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              {/* Reutiliza o conteúdo da sidebar aqui se necessário, ou simplifica */}
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border bg-gradient-primary">
                  <h1 className="text-lg font-bold text-black">JOTA</h1>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {publicNavItems.map(item => <NavButton key={item.to} item={item} />)}
                    {autenticado && (
                      <>
                        {dynamicModules.map(item => <NavButton key={item.id} item={item} isDynamic />)}
                        {privateNavItems.map(item => <NavButton key={item.to} item={item} />)}
                      </>
                    )}
                    {autenticado && isAdmin && adminNavItems.map(item => <NavButton key={item.to} item={item} />)}
                    <NavButton item={{ to: '/configuracao', label: 'Configurações', icon: Settings }} isLocked={!autenticado} />
                  </div>
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