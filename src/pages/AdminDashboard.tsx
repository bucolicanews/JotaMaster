import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Users, Activity, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Segurança de Borda (Frontend): Redireciona se não for admin
  if (!isAdmin && !isLoading) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      // 1. Busca os perfis de forma isolada e segura
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') // Exclui outros admins da visão
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 2. Busca os módulos instalados de forma isolada
      const { data: modulesData, error: modulesError } = await supabase
        .from('installed_modules')
        .select('user_id, module_id, is_active');

      if (modulesError) {
        console.warn("[AppSec] Falha ao carregar módulos. Renderizando apenas perfis.", modulesError);
      }

      // 3. Mescla os dados em memória (Defense in Depth contra falhas de Foreign Key)
      const clientesMapeados = (profilesData || []).map(profile => {
        const userModules = (modulesData || []).filter(m => m.user_id === profile.id);
        return {
          ...profile,
          installed_modules: userModules
        };
      });

      setClientes(clientesMapeados);
    } catch (error: any) {
      toast.error('Erro ao carregar dados dos clientes: ' + error.message);
      console.error("[AdminDashboard] Erro Crítico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Status atualizado para ${newStatus}`);
      carregarClientes();
    } catch (error: any) {
      toast.error('Falha ao atualizar status.');
      console.error("[AdminDashboard] Falha na mutação de status:", error);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.company_name || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.first_name || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.last_name || '').toLowerCase().includes(busca.toLowerCase())
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
            <p className="text-sm text-muted-foreground">Gestão master de locatários e permissões</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-8 bg-background border-border focus:ring-primary"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-elegant border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full border border-blue-500/30">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600/80 font-bold uppercase tracking-wider">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-700">{clientes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant border-primary/20">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> 
            Locatários Ativos no Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Empresa / Responsável</TableHead>
                <TableHead>Tipo (Role)</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Módulos Nativos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Autenticando permissões e carregando dados seguros...</TableCell></TableRow>
              ) : clientesFiltrados.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="font-bold text-foreground">{cliente.company_name || 'Não informado'}</div>
                      <div className="text-xs text-muted-foreground">{cliente.first_name} {cliente.last_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] bg-background">
                        {cliente.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="uppercase text-[10px] bg-primary/20 text-primary hover:bg-primary/30 border-none">
                        {cliente.plan || 'Trial'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {(cliente.installed_modules || []).filter((m: any) => m.is_active).map((m: any) => (
                          <Badge key={m.module_id} variant="secondary" className="text-[9px] border-border/50">
                            {m.module_id}
                          </Badge>
                        ))}
                        {(!cliente.installed_modules || cliente.installed_modules.filter((m:any) => m.is_active).length === 0) && (
                          <span className="text-xs text-muted-foreground italic">Nenhum módulo</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cliente.status === 'active' ? 'default' : 'destructive'} 
                        className={cliente.status === 'active' ? 'bg-success/20 text-success hover:bg-success/30 border-none' : 'border-none'}
                      >
                        {cliente.status === 'active' ? 'Ativo' : 'Suspenso'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cliente.status === 'active' ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' : 'text-success hover:bg-success/10 hover:text-success'}
                        onClick={() => toggleStatus(cliente.id, cliente.status || 'active')}
                      >
                        {cliente.status === 'active' ? 'Suspender' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}