import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Users, Activity, Search, Blocks, Edit, Save, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Estado para edição de preços no catálogo
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

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

  const salvarPrecoModulo = async (id: string) => {
    // Validação de Input (AppSec)
    const precoNum = parseFloat(editPrice);
    if (isNaN(precoNum) || precoNum < 0) {
      toast.error('Valor inválido. O preço deve ser um número positivo.');
      return;
    }

    try {
      const { error } = await supabase.from('system_modules').update({ price: precoNum }).eq('id', id);
      if (error) throw error;
      toast.success('Preço atualizado com sucesso.');
      setEditingModuleId(null);
      carregarDados();
    } catch (error: any) {
      toast.error('Falha ao atualizar preço.');
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
              <CardDescription>Defina quais plugins estão visíveis para os clientes e o preço base.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Preço (R$)</TableHead>
                    <TableHead>Nativo?</TableHead>
                    <TableHead>Visível na Loja?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogo.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-destructive">Nenhum módulo encontrado no BD. Execute o script SQL.</TableCell></TableRow>
                  ) : catalogo.map((mod) => (
                    <TableRow key={mod.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{mod.id}</TableCell>
                      <TableCell>
                        <div className="font-bold">{mod.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{mod.description}</div>
                      </TableCell>
                      <TableCell>
                        {editingModuleId === mod.id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" min="0" step="0.01"
                              className="w-24 h-8 text-sm"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => salvarPrecoModulo(mod.id)}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingModuleId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">R$ {Number(mod.price).toFixed(2)}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => { setEditPrice(mod.price); setEditingModuleId(mod.id); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{mod.is_native ? 'Sim' : 'Não'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={mod.is_active} onCheckedChange={() => toggleStatusModulo(mod.id, mod.is_active)} />
                          <span className="text-xs text-muted-foreground">{mod.is_active ? 'Online' : 'Oculto'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}