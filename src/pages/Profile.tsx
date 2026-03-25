import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building, KeyRound, Save, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const { session, profile: authProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    api_key: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name, api_key')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            company_name: data.company_name || '',
            api_key: data.api_key || ''
          });
          
          // Sincroniza o cache local da chave para o Chat funcionar imediatamente
          if (data.api_key) {
            localStorage.setItem('jota-gemini-key', data.api_key);
          }
          if (data.company_name) {
            localStorage.setItem('jota-razaoSocial', data.company_name);
          }
        }
      } catch (err: any) {
        toast.error("Erro ao carregar perfil: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!session?.user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          company_name: formData.company_name,
          api_key: formData.api_key,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;
      
      // Sincroniza o localStorage vital para o Chat e módulos locais funcionarem
      localStorage.setItem('jota-gemini-key', formData.api_key);
      localStorage.setItem('jota-razaoSocial', formData.company_name);

      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error("Falha ao salvar o perfil: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e credenciais de API.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" /> Dados do Usuário e Empresa</CardTitle>
            <CardDescription>Informações utilizadas em relatórios e cabeçalhos do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Seu sobrenome" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_name">Nome da Empresa (Razão Social)</Label>
              <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Sua Empresa LTDA" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-primary/20 bg-primary/5">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Chave de Autenticação da IA</CardTitle>
            <CardDescription>Configure sua própria chave do Google Gemini (BYOK) para habilitar Agentes Autônomos e o Chat Inteligente.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key" className="font-bold text-primary">Google Gemini API Key</Label>
              <Input 
                id="api_key" 
                name="api_key" 
                type="password" 
                value={formData.api_key} 
                onChange={handleChange} 
                placeholder="AIzaSy..." 
                className="font-mono text-sm bg-background border-primary/30 focus-visible:ring-primary"
              />
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-700 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>Privacidade e Segurança:</strong> Sua chave é criptografada e armazenada de forma segura no banco de dados. 
                Ela é utilizada exclusivamente para processar as suas requisições e alimentar os motores autônomos dos seus agentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 px-8">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} 
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}