import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building, KeyRound, Save, Loader2, ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  const { session, profile: authProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash');
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(localStorage.getItem('jota-gemini-search') === 'true');
  
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
      
      localStorage.setItem('jota-gemini-key', formData.api_key);
      localStorage.setItem('jota-razaoSocial', formData.company_name);
      localStorage.setItem('jota-gemini-model', geminiModel);
      localStorage.setItem('jota-gemini-search', enableGoogleSearch.toString());

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

        <Card className="shadow-elegant border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="border-b border-indigo-500/10">
            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-indigo-600" /> Provedor de IA: Google Gemini</CardTitle>
            <CardDescription>Configure suas credenciais pessoais (BYOK) e preferências de processamento.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="api_key" className="font-bold text-indigo-700">Sua API Key do Gemini</Label>
                <Input 
                  id="api_key" 
                  name="api_key" 
                  type="password" 
                  value={formData.api_key} 
                  onChange={handleChange} 
                  placeholder="AIzaSy..." 
                  className="font-mono text-sm bg-background border-indigo-500/30 focus-visible:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Sua chave é salva em nosso banco de dados criptografado para alimentar os motores autônomos.</p>
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Modelo Padrão</Label>
                <Select value={geminiModel} onValueChange={setGeminiModel}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro</SelectItem>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold text-blue-700"><Search className="h-4 w-4" /> Grounding (Pesquisa Web)</Label>
                <div className="flex items-center justify-between p-2 border border-blue-500/30 rounded bg-blue-500/10 h-10">
                  <span className="text-xs text-blue-800">Pesquisa na internet</span>
                  <Switch checked={enableGoogleSearch} onCheckedChange={setEnableGoogleSearch} />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-700 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>Privacidade e Segurança:</strong> Sua chave é utilizada exclusivamente para processar as suas requisições no chat e alimentar os motores autônomos dos seus agentes em background.
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