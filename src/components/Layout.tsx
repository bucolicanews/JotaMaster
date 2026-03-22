import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Settings, Tags, TrendingUp, ShieldCheck, Sparkles, Lock, LogOut, Home, MessageSquare, Blocks, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  { to: '/modules', label: 'Central de Módulos', icon: Blocks },
  { to: '/chat', label: 'Chat Inteligente', icon: MessageSquare },
  { to: '/new-business', label: 'Análise de Viabilidade', icon: Sparkles },
  { to: '/comparison', label: 'Comparativo de Regimes', icon: BarChart3 },
  { to: '/impact', label: 'Análise de Impacto', icon: TrendingUp },
];

const adminNavItems = [
  { to: '/admin', label: 'Painel Admin', icon: ShieldAlert },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { autenticado, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Sessão encerrada com sucesso.');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao sair do sistema.');
    }
  };

  const navItems = autenticado 
    ? [...publicNavItems, ...privateNavItems, ...(isAdmin ? adminNavItems : [])] 
    : publicNavItems;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-gradient-primary">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center text-center sm:text-left gap-3">
              <div className="rounded-lg bg-black/30 p-2 backdrop-blur">
                <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">JOTA - Análise Tributária Lei 214/2025</h1>
                <p className="text-xs text-black/70">Sistema Inteligente de Análise Tributária</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autenticado ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/20 border-black/30 text-black hover:bg-black/30"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              ) : (
                <Link to="/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-black/20 border-black/30 text-black hover:bg-black/30"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Acesso Completo
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-wrap gap-2 py-2">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={cn(
                  "py-2 px-3 rounded-md transition-colors whitespace-nowrap text-sm",
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Link to="/configuracao">
            <Button
              variant="ghost"
              className={cn(
                "py-2 px-3 rounded-md transition-colors whitespace-nowrap text-sm",
                location.pathname === '/configuracao'
                  ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
              {!autenticado && <Lock className="h-3 w-3 ml-1 opacity-50" />}
            </Button>
          </Link>
        </div>
      </nav>
      <main className="flex-grow max-w-[1600px] mx-auto w-full">
        {children}
      </main>
      <footer className="border-t border-border bg-card py-4 text-center text-sm text-muted-foreground">
        <div className="max-w-[1600px] mx-auto px-4">Desenvolvido por Jota Empresas</div>
      </footer>
    </div>
  );
};