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
            // Força a injeção das classes do Tailwind nos elementos internos do Auth UI
            className: {
              container: 'w-full',
              label: 'text-foreground font-medium mb-1',
              button: 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold',
              input: 'bg-background text-foreground border-border focus:ring-primary',
              anchor: 'text-primary hover:text-primary-glow font-medium',
              message: 'text-destructive',
              divider: 'bg-border',
            },
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-glow))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                  inputBorder: 'hsl(var(--border))',
                  inputBackground: 'transparent',
                  messageText: 'hsl(var(--destructive))',
                  anchorTextColor: 'hsl(var(--primary))',
                  anchorTextHoverColor: 'hsl(var(--primary-glow))',
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Crie uma senha',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
              forgot_password: {
                email_label: 'E-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Seu e-mail',
                button_label: 'Enviar instruções de recuperação',
                loading_button_label: 'Enviando...',
                link_text: 'Esqueceu a senha?',
                confirmation_text: 'Verifique seu e-mail para o link de redefinição de senha',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar senha',
                loading_button_label: 'Atualizando...',
              },
            },
          }}
        />
      </div>
    </div>
  );
}