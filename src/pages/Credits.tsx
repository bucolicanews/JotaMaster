import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, PlusCircle, History, Zap, CreditCard, ArrowUpRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Credits() {
  const { session } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchWalletData();
    }
  }, [session]);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      // Busca Saldo
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session?.user.id)
        .single();
      
      setBalance(wallet?.balance ?? 0);

      // Busca Histórico
      const { data: txs } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setTransactions(txs || []);
    } catch (error) {
      console.error("Erro ao carregar carteira:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = (amount: number, price: number) => {
    toast.info(`Iniciando checkout PagBank para ${amount} créditos (R$ ${price.toFixed(2)})...`);
    // Aqui entrará a chamada para a Edge Function do PagBank
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Minha Carteira</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus créditos para uso da Inteligência Artificial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CARD DE SALDO */}
        <Card className="lg:col-span-1 shadow-elegant border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saldo Disponível</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            {isLoading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            ) : (
              <>
                <span className="text-6xl font-black text-primary mb-2">{balance}</span>
                <span className="text-sm font-bold text-muted-foreground">Créditos JOTA</span>
              </>
            )}
          </CardContent>
        </Card>

        {/* PACOTES DE RECARGA */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { qty: 50, price: 10, label: 'Starter' },
            { qty: 250, price: 45, label: 'Pro', popular: true },
            { qty: 1000, price: 150, label: 'Enterprise' }
          ].map((pkg) => (
            <Card key={pkg.qty} className={cn(
              "relative overflow-hidden transition-all hover:scale-105 cursor-pointer border-2",
              pkg.popular ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
            )} onClick={() => handleBuyCredits(pkg.qty, pkg.price)}>
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                  Melhor Valor
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{pkg.label}</CardTitle>
                <CardDescription>{pkg.qty} Créditos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">R$ {pkg.price}</div>
                <Button className="w-full gap-2" variant={pkg.popular ? "default" : "outline"}>
                  <CreditCard className="h-4 w-4" /> Comprar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* HISTÓRICO */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Últimas Transações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">Nenhuma transação realizada.</TableCell>
                </TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs font-mono">{new Date(tx.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant={tx.amount > 0 ? "success" : "outline"} className="text-[10px] uppercase">
                      {tx.type === 'purchase' ? 'Compra' : 'Consumo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{tx.description}</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    tx.amount > 0 ? "text-success" : "text-destructive"
                  )}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}