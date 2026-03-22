import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Users, Activity, Search, Blocks, Edit, Save, X, Globe, Code } from 'lucide-react';
import { Input } from "@/components/ui/input";
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
  
  // Estado para edição de dados do catálogo
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    price: '',
    module_type: 'internal',
    bundle_url: ''
  });

  if (!isAdmin && !isLoading) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // 1. Carga de Clientes
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: modulesData } = await supabase.from('installed_modules').select('user_id, module_id, is_active');
      const clientesMapeados = (profilesData || []).map(profile => ({
        ...profile,
        installed_modules: (modulesData || []).filter(m => m.user_id === profile.id)
      }));
      setClientes(clientesMapeados);

      // 2. Carga do Catálogo de Módulos (Marketplace)
      const { data: catalogData, error: catalogError } = await supabase
        .from('system_modules').select('*').order('name', { ascending: true });
      
      if (catalogError) {
        console.warn("[AppSec] Tabela system_modules não encontrada. Você rodou o script SQL?", catalogError);
      } else {
        setCatalogo(catalogData || []);
      }

    } catch (error: any) {
      toast.error('Erro ao carregar painel: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatusCliente = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Status do cliente atualizado.`);
      carregarDados();
    } catch (error: any) {
      toast.error('Falha ao atualizar status.');
    }
  };

  const toggleStatusModulo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('system_modules').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Disponibilidade do módulo alterada.`);
      carregarDados();
    } catch (error: any) {
      toast.error('Falha ao atualizar módulo.');
    }
  };

  const iniciarEdicaoModulo = (mod: any) => {
    setEditingModuleId(mod.id);
    setEditForm({
      price: mod.price?.toString() || '0',
      module_type: mod.module_type || 'internal',
      bundle_url: mod.bundle_url || ''
    });
  };

  const salvarEdicaoModulo = async (id: string) => {
    // Validação de Input (AppSec)
    const precoNum = parseFloat(editForm.price);
    if (isNaN(precoNum) || precoNum < 0) {
      toast.error('Valor inválido. O preço deve ser um número positivo.');
      return;
    }

    let urlFinal = editForm.bundle_url?.trim();

    if (editForm.module_type === 'iframe') {
      if (!urlFinal || !urlFinal.startsWith('https://')) {
        toast.error('Segurança: Módulos externos exigem URLs seguras (iniciadas com https://).');
        return;
      }
    } else {
      // Se for internal, limpamos a URL para não manter lixo no BD
      urlFinal = '';
    }

    try {
      const { error } = await supabase.from('system_modules').update({ 
        price: precoNum,
        module_type: editForm.module_type,
        bundle_url: urlFinal || null
      }).eq('id', id);
      
      if (error) throw error;
      toast.success('Módulo atualizado com sucesso.');
      setEditingModuleId(null);
      carregarDados();
    } catch (error: any) {
      toast.error('Falha ao atualizar módulo. Verifique o console.');
      console.error(error);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.company_name || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.first_name || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel de Controle Admin</h1>
            <p className="text-sm text-muted-foreground">Gestão master de locatários e ecossistema</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="clientes"><Users className="h-4 w-4 mr-2" /> Locatários</TabsTrigger>
          <TabsTrigger value="catalogo"><Blocks className="h-4 w-4 mr-2" /> Catálogo SaaS</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-4">
          <div className="flex items-center gap-4 w-full md:w-64 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." className="pl-8 bg-background" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
          </div>

          <Card className="shadow-elegant border-primary/20">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Módulos Ativos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando dados seguros...</TableCell></TableRow>
                  ) : clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="font-bold">{cliente.company_name || 'Não informado'}</div>
                        <div className="text-xs text-muted-foreground">{cliente.first_name} {cliente.last_name}</div>
                      </TableCell>
                      <TableCell><Badge className="uppercase text-[10px]">{cliente.plan || 'Trial'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {(cliente.installed_modules || []).filter((m: any) => m.is_active).map((m: any) => (
                            <Badge key={m.module_id} variant="secondary" className="text-[9px]">{m.module_id}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.status === 'active' ? 'default' : 'destructive'}>{cliente.status === 'active' ? 'Ativo' : 'Suspenso'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatusCliente(cliente.id, cliente.status || 'active')}>
                          {cliente.status === 'active' ? 'Suspender' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <Card className="shadow-elegant border-primary/20">
            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">Vitrine de Módulos (Marketplace)</CardTitle>
              <CardDescription>Configure precificação, tipo de injeção (Nativo vs CDN) e endpoints dos módulos.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Módulo</TableHead>
                    <TableHead className="min-w-[120px]">Preço (R$)</TableHead>
                    <TableHead className="min-w-[150px]">Tipo Renderização</TableHead>
                    <TableHead className="min-w-[250px]">URL (App Externo)</TableHead>
                    <TableHead className="w-[120px]">Visível?</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogo.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-destructive">Nenhum módulo encontrado no BD. Execute o script SQL.</TableCell></TableRow>
                  ) : catalogo.map((mod) => {
                    const isEditing = editingModuleId === mod.id;
                    
                    return (
                      <TableRow key={mod.id} className={isEditing ? "bg-muted/30" : ""}>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{mod.id}</TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{mod.name}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{mod.description}</div>
                        </TableCell>
                        
                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="number" min="0" step="0.01"
                              className="h-8 text-sm"
                              value={editForm.price}
                              onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            />
                          ) : (
                            <span className="font-mono font-semibold">R$ {Number(mod.price).toFixed(2)}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Select 
                              value={editForm.module_type} 
                              onValueChange={(val) => setEditForm({...editForm, module_type: val})}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">Interno (React)</SelectItem>
                                <SelectItem value="iframe">Externo (Iframe)</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={mod.module_type === 'iframe' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}>
                              {mod.module_type === 'iframe' ? <Globe className="h-3 w-3 mr-1" /> : <Code className="h-3 w-3 mr-1" />}
                              {mod.module_type === 'iframe' ? 'App CDN' : 'Nativo'}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="url"
                              placeholder="https://..."
                              className="h-8 text-xs font-mono"
                              value={editForm.bundle_url}
                              disabled={editForm.module_type !== 'iframe'}
                              onChange={(e) => setEditForm({...editForm, bundle_url: e.target.value})}
                            />
                          ) : (
                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={mod.bundle_url}>
                              {mod.bundle_url || 'N/A (Built-in)'}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch disabled={isEditing} checked={mod.is_active} onCheckedChange={() => toggleStatusModulo(mod.id, mod.is_active)} />
                            <span className="text-xs text-muted-foreground">{mod.is_active ? 'Online' : 'Oculto'}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-success bg-success/10 hover:bg-success/20" onClick={() => salvarEdicaoModulo(mod.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive bg-destructive/10 hover:bg-destructive/20" onClick={() => setEditingModuleId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => iniciarEdicaoModulo(mod)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}