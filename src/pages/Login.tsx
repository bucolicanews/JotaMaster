import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  // Gerencia qual tela do Auth está aparecendo
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');

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
          <h1 className="text-2xl font-bold text-foreground">
            {view === 'sign_in' ? 'Acesso ao Sistema' : view === 'sign_up' ? 'Criar Conta' : 'Recuperar Senha'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {view === 'sign_in' 
              ? 'Identifique-se para acessar os módulos exclusivos JOTA.' 
              : view === 'sign_up' 
              ? 'Preencha os dados abaixo para se cadastrar no sistema.' 
              : 'Informe seu e-mail para receber as instruções de recuperação.'}
          </p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          view={view}
          showLinks={false} // Desativa os links em texto padrão do Supabase
          providers={[]} // Desativado OAuth providers temporariamente
          appearance={{
            theme: ThemeSupa,
            className: {
              container: 'w-full',
              label: 'text-foreground font-medium mb-1',
              // Botão principal de Entrar/Cadastrar do Supabase
              button: 'bg-primary text-primary-foreground hover:bg-primary/90 font-bold w-full rounded-md px-4 py-2 mt-2',
              input: 'bg-background text-foreground border-border focus:ring-primary',
              message: 'text-destructive text-sm font-medium mt-2 text-center',
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
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Seu e-mail',
                password_input_placeholder: 'Crie uma senha forte',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
              },
              forgot_password: {
                email_label: 'E-mail',
                email_input_placeholder: 'Seu e-mail cadastrado',
                button_label: 'Enviar instruções',
                loading_button_label: 'Enviando...',
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

        {/* NOSSOS BOTÕES CUSTOMIZADOS ABAIXO DO FORMULÁRIO */}
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          {view === 'sign_in' ? (
            <>
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-primary/30 text-foreground hover:bg-primary/10 font-bold" 
                onClick={() => setView('sign_up')}
              >
                Cadastrar
              </Button>
              <Button 
                className="w-full bg-primary/70 hover:bg-primary/60 text-primary-foreground font-bold" 
                onClick={() => setView('forgotten_password')}
              >
                Recuperar senha
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              className="w-full bg-transparent border-primary/30 text-foreground hover:bg-primary/10 font-bold" 
              onClick={() => setView('sign_in')}
            >
              Voltar para o Login
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}