import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, Users, Activity, Search, Blocks, Edit, Save, X, 
  Globe, Code, Coins, KeyRound, TrendingUp, Loader2, Plus, 
  Trash2, Star, CreditCard, Percent, DollarSign, ExternalLink, LayoutGrid,
  ShieldCheck
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    vertex_api_key: '',
    price_per_1m_input_tokens: 1.25,
    price_per_1m_output_tokens: 2.50,
    profit_multiplier: 4.0,
    credit_conversion_rate: 10.0,
    pagbank_token_sandbox: '',
    pagbank_token_production: '',
    pagbank_env: 'sandbox',
    pagbank_pass_fees_to_customer: false,
    pagbank_pix_fee_fixed: 1.20,
    pagbank_pix_fee_percentage: 0.3,
    pagbank_card_fee_fixed: 1.20,
    pagbank_card_fee_percentage: 6.0
  });

  // Estados para Gestão de Módulos
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({
    id: '',
    name: '',
    description: '',
    icon: 'Blocks',
    price: 0,
    is_active: true,
    is_native: false,
    module_type: 'internal',
    bundle_url: ''
  });

  // Estados para Gestão de Pacotes
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    credits_amount: 0,
    price_brl: 0,
    is_popular: false
  });

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
      carregarSettings();
      carregarPacotes();
      carregarModulos();
    }
  }, [isAdmin]);

  const carregarModulos = async () => {
    const { data } = await supabase.from('system_modules').select('*').order('name', { ascending: true });
    setModules(data || []);
  };

  const carregarPacotes = async () => {
    const { data } = await supabase.from('credit_packages').select('*').order('credits_amount', { ascending: true });
    setPackages(data || []);
  };

  const carregarSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'global_config').single();
      if (data) {
        setSettings({
          ...settings,
          ...data,
          price_per_1m_input_tokens: Number(data.price_per_1m_input_tokens),
          price_per_1m_output_tokens: Number(data.price_per_1m_output_tokens),
          profit_multiplier: Number(data.profit_multiplier),
          credit_conversion_rate: Number(data.credit_conversion_rate),
          pagbank_pix_fee_fixed: Number(data.pagbank_pix_fee_fixed),
          pagbank_pix_fee_percentage: Number(data.pagbank_pix_fee_percentage),
          pagbank_card_fee_fixed: Number(data.pagbank_card_fee_fixed),
          pagbank_card_fee_percentage: Number(data.pagbank_card_fee_percentage)
        });
      }
    } catch (e) { console.warn("Configurações globais não localizadas."); }
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
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- LÓGICA DE MÓDULOS ---
  const handleSaveModule = async () => {
    if (!moduleForm.id || !moduleForm.name) return toast.error("ID e Nome são obrigatórios.");
    
    if (moduleForm.module_type === 'iframe' && !moduleForm.bundle_url) {
      return toast.error("Módulos do tipo Iframe exigem uma URL de origem.");
    }

    try {
      const { error } = await supabase.from('system_modules').upsert([moduleForm]);
      if (error) throw error;
      toast.success("Módulo salvo no catálogo!");
      setIsAddingModule(false);
      setEditingModuleId(null);
      setModuleForm({ id: '', name: '', description: '', icon: 'Blocks', price: 0, is_active: true, is_native: false, module_type: 'internal', bundle_url: '' });
      carregarModulos();
    } catch (e: any) { toast.error("Erro ao salvar módulo."); }
  };

  const handleEditModule = (mod: any) => {
    setModuleForm(mod);
    setEditingModuleId(mod.id);
    setIsAddingModule(true);
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Excluir este módulo do catálogo? Isso não removerá as instalações existentes, mas impedirá novas.")) return;
    try {
      const { error } = await supabase.from('system_modules').delete().eq('id', id);
      if (error) throw error;
      toast.success("Módulo removido do catálogo.");
      carregarModulos();
    } catch (e: any) { toast.error("Erro ao remover."); }
  };

  // --- LÓGICA DE PACOTES ---
  const handleAddPackage = async () => {
    if (!newPackage.name || newPackage.credits_amount <= 0 || newPackage.price_brl <= 0) {
      return toast.error("Preencha todos os campos do pacote.");
    }
    try {
      const { error } = await supabase.from('credit_packages').insert([newPackage]);
      if (error) throw error;
      toast.success("Pacote criado com sucesso!");
      setIsAddingPackage(false);
      setNewPackage({ name: '', credits_amount: 0, price_brl: 0, is_popular: false });
      carregarPacotes();
    } catch (e: any) { toast.error("Erro ao criar pacote."); }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Excluir este pacote permanentemente?")) return;
    try {
      const { error } = await supabase.from('credit_packages').delete().eq('id', id);
      if (error) throw error;
      toast.success("Pacote removido.");
      carregarPacotes();
    } catch (e: any) { toast.error("Erro ao remover."); }
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
    } catch (error: any) {
      console.error('Erro ao carregar painel:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin && !isLoading) return <Navigate to="/" replace />;

  const nativeModules = modules.filter(m => m.is_native);
  const marketplaceModules = modules.filter(m => !m.is_native);

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
        <TabsList className="grid w-full md:w-[800px] grid-cols-4 mb-6">
          <TabsTrigger value="clientes"><Users className="h-4 w-4 mr-2" /> Locatários</TabsTrigger>
          <TabsTrigger value="catalogo"><Blocks className="h-4 w-4 mr-2" /> Catálogo SaaS</TabsTrigger>
          <TabsTrigger value="pacotes"><Coins className="h-4 w-4 mr-2" /> Pacotes</TabsTrigger>
          <TabsTrigger value="economia"><TrendingUp className="h-4 w-4 mr-2" /> Economia IA</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-4">
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

        <TabsContent value="catalogo" className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2"><Blocks className="h-5 w-5 text-primary" /> Gestão do Catálogo de Módulos</h3>
            <Button onClick={() => { setIsAddingModule(!isAddingModule); setEditingModuleId(null); }} variant={isAddingModule ? "ghost" : "default"}>
              {isAddingModule ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAddingModule ? "Cancelar" : "Novo Módulo"}
            </Button>
          </div>

          {isAddingModule && (
            <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ID Único (Slug)</Label>
                    <Input placeholder="ex: crm-v2" value={moduleForm.id} onChange={e => setModuleForm({...moduleForm, id: e.target.value})} disabled={!!editingModuleId} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Módulo</Label>
                    <Input placeholder="Ex: Controle de Clientes" value={moduleForm.name} onChange={e => setModuleForm({...moduleForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço de Ativação (R$)</Label>
                    <Input type="number" value={moduleForm.price} onChange={e => setModuleForm({...moduleForm, price: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição Curta</Label>
                  <Textarea placeholder="O que este módulo faz?" value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-background">
                  <div className="space-y-2">
                    <Label>Tipo de Renderização</Label>
                    <Select value={moduleForm.module_type} onValueChange={v => setModuleForm({...moduleForm, module_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Interno (Nativo)</SelectItem>
                        <SelectItem value="iframe">Externo (Iframe/CDN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>URL do Artefato (Bundle/CDN)</Label>
                    <Input 
                      placeholder="https://cdn.meu-app.com" 
                      value={moduleForm.bundle_url} 
                      onChange={e => setModuleForm({...moduleForm, bundle_url: e.target.value})}
                      disabled={moduleForm.module_type === 'internal'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={moduleForm.is_active} onCheckedChange={v => setModuleForm({...moduleForm, is_active: v})} />
                    <Label>Ativo na Loja</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={moduleForm.is_native} onCheckedChange={v => setModuleForm({...moduleForm, is_native: v})} />
                    <Label>Módulo Nativo</Label>
                  </div>
                  <Button onClick={handleSaveModule} className="ml-auto bg-primary px-8">
                    {editingModuleId ? "Atualizar Módulo" : "Publicar no Marketplace"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: MÓDULOS NATIVOS */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> Módulos Nativos (Protegidos)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nativeModules.map((mod) => (
                <Card key={mod.id} className="border-success/20 bg-success/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-background rounded-md border border-success/20">
                        <LayoutGrid className="h-5 w-5 text-success" />
                      </div>
                      <Badge variant="default" className="bg-success text-success-foreground">NATIVO</Badge>
                    </div>
                    <CardTitle className="mt-2">{mod.name}</CardTitle>
                    <CardDescription className="text-[10px] font-mono uppercase">{mod.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">{mod.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-success/10">
                      <span className="font-bold text-success">Grátis</span>
                      <Button variant="ghost" size="icon" onClick={() => handleEditModule(mod)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* SEÇÃO: MARKETPLACE */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Blocks className="h-4 w-4 text-primary" /> Módulos do Marketplace
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceModules.map((mod) => (
                <Card key={mod.id} className={cn("relative border-2", mod.is_active ? "border-border" : "border-dashed opacity-60")}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-muted rounded-md">
                        {mod.module_type === 'iframe' ? <ExternalLink className="h-5 w-5 text-amber-500" /> : <LayoutGrid className="h-5 w-5 text-primary" />}
                      </div>
                      <Badge variant={mod.is_active ? "default" : "outline"}>{mod.is_active ? "Ativo" : "Inativo"}</Badge>
                    </div>
                    <CardTitle className="mt-2">{mod.name}</CardTitle>
                    <CardDescription className="text-[10px] font-mono uppercase">{mod.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">{mod.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-bold text-primary">{Number(mod.price) === 0 ? 'Grátis' : `R$ ${Number(mod.price).toFixed(2)}`}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditModule(mod)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ABA: PACOTES DE CRÉDITO */}
        <TabsContent value="pacotes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Gestão de Planos de Crédito</h3>
            <Button onClick={() => setIsAddingPackage(!isAddingPackage)} variant={isAddingPackage ? "ghost" : "default"}>
              {isAddingPackage ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAddingPackage ? "Cancelar" : "Novo Pacote"}
            </Button>
          </div>

          {isAddingPackage && (
            <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2">
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input placeholder="Ex: Starter" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Créditos</Label>
                  <Input type="number" value={newPackage.credits_amount} onChange={e => setNewPackage({...newPackage, credits_amount: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={newPackage.price_brl} onChange={e => setNewPackage({...newPackage, price_brl: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="flex items-center gap-4 h-10">
                  <div className="flex items-center gap-2">
                    <Switch checked={newPackage.is_popular} onCheckedChange={v => setNewPackage({...newPackage, is_popular: v})} />
                    <Label className="text-xs">Destaque</Label>
                  </div>
                  <Button onClick={handleAddPackage} className="flex-1 bg-primary">Criar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={cn("relative border-2", pkg.is_popular ? "border-primary shadow-md" : "border-border")}>
                {pkg.is_popular && <Badge className="absolute top-2 right-2 bg-primary"><Star className="h-3 w-3 mr-1 fill-current" /> Popular</Badge>}
                <CardHeader className="pb-2">
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.credits_amount} Créditos</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <span className="text-2xl font-black text-foreground">R$ {Number(pkg.price_brl).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeletePackage(pkg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ABA: ECONOMIA IA */}
        <TabsContent value="economia" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    placeholder="Cole sua chave Master..." 
                    value={settings.vertex_api_key}
                    onChange={(e) => setSettings({...settings, vertex_api_key: e.target.value})}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                  <div className="space-y-2">
                    <Label>Custo Base Input (1M Tokens)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-muted-foreground">USD</span>
                      <Input 
                        type="number" step="0.01" className="pl-12"
                        value={settings.price_per_1m_input_tokens}
                        onChange={(e) => setSettings({...settings, price_per_1m_input_tokens: parseFloat(e.target.value) || 0})}
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
                        onChange={(e) => setSettings({...settings, price_per_1m_output_tokens: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    onChange={(e) => setSettings({...settings, profit_multiplier: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Conversão (R$ 1,00 = X Créditos)</Label>
                  <Input 
                    type="number"
                    value={settings.credit_conversion_rate}
                    onChange={(e) => setSettings({...settings, credit_conversion_rate: parseFloat(e.target.value) || 0})}
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