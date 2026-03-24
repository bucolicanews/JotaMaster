import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Users, Activity, Search, Blocks, Edit, Save, X, Globe, Code, Coins, KeyRound, TrendingUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Estados para Economia de IA
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    vertex_api_key: '',
    price_per_1m_input_tokens: 1.25,
    price_per_1m_output_tokens: 2.50,
    profit_multiplier: 4.0,
    credit_conversion_rate: 10.0
  });

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    price: '',
    module_type: 'internal',
    bundle_url: ''
  });

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
      carregarSettings();
    }
  }, [isAdmin]);

  const carregarSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*').eq('id', 'global_config').single();
    if (data) setSettings(data);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        id: 'global_config',
        ...settings,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("Configurações de Economia salvas!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: modulesData } = await supabase.from('installed_modules').select('user_id, module_id, is_active');
      const clientesMapeados = (profilesData || []).map(profile => ({
        ...profile,
        installed_modules: (modulesData || []).filter(m => m.user_id === profile.id)
      }));
      setClientes(clientesMapeados);

      const { data: catalogData } = await supabase.from('system_modules').select('*').order('name', { ascending: true });
      setCatalogo(catalogData || []);

    } catch (error: any) {
      toast.error('Erro ao carregar painel: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin && !isLoading) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel de Controle Admin</h1>
          <p className="text-sm text-muted-foreground">Gestão master de locatários e economia do ecossistema</p>
        </div>
      </div>

      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="clientes"><Users className="h-4 w-4 mr-2" /> Locatários</TabsTrigger>
          <TabsTrigger value="catalogo"><Blocks className="h-4 w-4 mr-2" /> Catálogo SaaS</TabsTrigger>
          <TabsTrigger value="economia"><Coins className="h-4 w-4 mr-2" /> Economia de IA</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-4">
          {/* ... (Conteúdo de clientes mantido) */}
          <Card className="shadow-elegant border-primary/20">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Módulos Ativos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="font-bold">{cliente.company_name || 'Não informado'}</div>
                        <div className="text-xs text-muted-foreground">{cliente.first_name}</div>
                      </TableCell>
                      <TableCell><Badge className="uppercase text-[10px]">{cliente.plan}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {cliente.installed_modules.map((m: any) => (
                            <Badge key={m.module_id} variant="secondary" className="text-[9px]">{m.module_id}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={cliente.status === 'active' ? 'default' : 'destructive'}>{cliente.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economia" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA 1: CHAVES E SEGURANÇA */}
            <Card className="lg:col-span-2 shadow-elegant border-primary/20">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Infraestrutura Vertex AI</CardTitle>
                <CardDescription>Configure sua Master Key e endpoints de processamento.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Vertex AI Master Key (Google Cloud)</Label>
                  <Input 
                    type="password" 
                    placeholder="Cole sua chave AQ.Ab8..." 
                    value={settings.vertex_api_key}
                    onChange={(e) => setSettings({...settings, vertex_api_key: e.target.value})}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Esta chave é usada para todas as requisições do sistema. Nunca a compartilhe.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                  <div className="space-y-2">
                    <Label>Custo Base Input (1M Tokens)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-muted-foreground">USD</span>
                      <Input 
                        type="number" step="0.01" className="pl-12"
                        value={settings.price_per_1m_input_tokens}
                        onChange={(e) => setSettings({...settings, price_per_1m_input_tokens: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Base Output (1M Tokens)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-muted-foreground">USD</span>
                      <Input 
                        type="number" step="0.01" className="pl-12"
                        value={settings.price_per_1m_output_tokens}
                        onChange={(e) => setSettings({...settings, price_per_1m_output_tokens: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COLUNA 2: MARGEM E CONVERSÃO */}
            <Card className="shadow-elegant border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Regras de Negócio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Multiplicador de Lucro (Markup)</Label>
                  <Input 
                    type="number" step="0.1"
                    value={settings.profit_multiplier}
                    onChange={(e) => setSettings({...settings, profit_multiplier: parseFloat(e.target.value)})}
                  />
                  <p className="text-[10px] text-muted-foreground">Fator aplicado sobre o custo do Google para cobrar o cliente.</p>
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Conversão (R$ 1,00 = X Créditos)</Label>
                  <Input 
                    type="number"
                    value={settings.credit_conversion_rate}
                    onChange={(e) => setSettings({...settings, credit_conversion_rate: parseFloat(e.target.value)})}
                  />
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Economia
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}