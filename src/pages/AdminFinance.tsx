import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Users, Activity, Loader2, ArrowUpRight, Wallet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function AdminFinance() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCost: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalTokens: 0
  });
  const [userConsumptions, setUserConsumptions] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchFinancialData();
    }
  }, [isAdmin]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // 1. Busca os Logs de Uso (sem tentar o JOIN problemático)
      const { data: logs, error: logsError } = await supabase
        .from('ai_usage_logs')
        .select('*');
      
      if (logsError) throw logsError;

      // 2. Busca os Perfis separadamente (Resiliência de Arquitetura)
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, company_name, first_name');
        
      if (profError) throw profError;

      // 3. Calcula Estatísticas Globais
      const totals = (logs || []).reduce((acc, log) => ({
        totalCost: acc.totalCost + (Number(log.cost_to_google) || 0),
        totalRevenue: acc.totalRevenue + (Number(log.price_charged) || 0),
        totalTokens: acc.totalTokens + (Number(log.input_tokens) || 0) + (Number(log.output_tokens) || 0)
      }), { totalCost: 0, totalRevenue: 0, totalTokens: 0 });

      setStats({
        ...totals,
        totalProfit: totals.totalRevenue - totals.totalCost
      });

      // 4. Agrupa por Usuário Cruzando as Tabelas em Memória
      const grouped = (logs || []).reduce((acc: any, log) => {
        const userId = log.user_id;
        const userProfile = profiles?.find(p => p.id === userId);
        const userName = userProfile?.company_name || userProfile?.first_name || 'Usuário Desconhecido';

        if (!acc[userId]) {
          acc[userId] = {
            name: userName,
            cost: 0,
            revenue: 0,
            tokens: 0,
            requests: 0
          };
        }
        
        acc[userId].cost += (Number(log.cost_to_google) || 0);
        acc[userId].revenue += (Number(log.price_charged) || 0);
        acc[userId].tokens += (Number(log.input_tokens) || 0) + (Number(log.output_tokens) || 0);
        acc[userId].requests += 1;
        
        return acc;
      }, {});

      setUserConsumptions(Object.values(grouped));

    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros: " + error.message);
      console.error("[Admin Finance] Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-6 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">Painel Financeiro Master</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Monitoramento de custos Vertex AI e lucratividade SaaS.</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchFinancialData} disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />} Atualizar Dados
        </Button>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Custo Total (Google)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{formatCurrency(stats.totalCost)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Valor a pagar ao Google Cloud</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Faturamento Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Valor total cobrado dos clientes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success shadow-sm bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-success">{formatCurrency(stats.totalProfit)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Margem de lucro da operação</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Volume de Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total de processamento consumido</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE CONSUMO POR USUÁRIO */}
      <Card className="shadow-elegant border-primary/20">
        <CardHeader className="bg-muted/10 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Consumo por Locatário</CardTitle>
          </div>
          <CardDescription>Detalhamento de custos e receitas individuais.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/5">
                <TableHead>Empresa / Usuário</TableHead>
                <TableHead className="text-right">Requisições</TableHead>
                <TableHead className="text-right">Custo (Google)</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userConsumptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    Nenhum log de uso registrado até o momento.
                  </TableCell>
                </TableRow>
              ) : userConsumptions.map((user, idx) => {
                const profit = user.revenue - user.cost;
                const roi = user.cost > 0 ? (profit / user.cost) * 100 : 0;
                
                return (
                  <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold truncate max-w-[200px]">{user.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{user.requests}</TableCell>
                    <TableCell className="text-right text-destructive font-mono text-xs">{formatCurrency(user.cost)}</TableCell>
                    <TableCell className="text-right text-primary font-bold">{formatCurrency(user.revenue)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-black",
                      profit >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={roi >= 100 ? "success" : "outline"} className="text-[10px]">
                        {roi.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}