import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CRM() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Controle de Clientes (CRM)</h1>
            <p className="text-sm text-muted-foreground">Módulo Integrado JOTA Master.</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Carteira de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." className="pl-8 bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Users className="h-12 w-12 text-muted-foreground opacity-20 mx-auto" />
            <h3 className="text-lg font-bold">Módulo Ativo e Instalado!</h3>
            <p className="text-sm text-muted-foreground">
              O ecossistema JOTA reconheceu sua permissão de acesso a este módulo. A interface completa de listagem, funil de vendas e contratos será injetada aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}