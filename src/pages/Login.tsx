import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function Login() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();

  // Redireciona o usuário para a home se ele já estiver logado
  useEffect(() => {
    if (autenticado) {
      navigate('/');
    }
  }, [autenticado, navigate]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-elegant border border-primary/20">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso ao Sistema</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Identifique-se para acessar os módulos exclusivos JOTA.
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          providers={[]} // Desativado OAuth providers temporariamente
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-glow))',
                },
              },
            },
          }}
          theme="light"
        />
      </div>
    </div>
  );
}