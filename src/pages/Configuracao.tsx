import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Save, Loader2, Globe, Search, Activity
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const Configuracao = () => {
  const { autenticado } = useAuth();

  // Variáveis Locais
  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || '');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || '');
  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [uf, setUf] = useState(localStorage.getItem('jota-uf') || 'SP');
  const [contadorNome, setContadorNome] = useState(localStorage.getItem('jota-contador-nome') || '');
  const [contadorCrc, setContadorCrc] = useState(localStorage.getItem('jota-contador-crc') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('jota-gemini-key') || '');
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash');
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(localStorage.getItem('jota-gemini-search') === 'true');

  const handleSave = () => {
    localStorage.setItem('jota-razaoSocial', razaoSocial);
    localStorage.setItem('jota-cnpj', cnpj);
    localStorage.setItem('jota-uf', uf);
    localStorage.setItem('jota-webhook-test', webhookTestUrl);
    localStorage.setItem('jota-webhook-prod', webhookProdUrl);
    localStorage.setItem('jota-contador-nome', contadorNome);
    localStorage.setItem('jota-contador-crc', contadorCrc);
    localStorage.setItem('jota-gemini-key', geminiKey);
    localStorage.setItem('jota-gemini-model', geminiModel);
    localStorage.setItem('jota-gemini-search', enableGoogleSearch.toString());
    toast.success("Configurações salvas localmente!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" /> Salvar Configurações
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* 1. DADOS DA EMPRESA E CONTADOR */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-muted/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" />Identificação e Responsabilidade</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} /></div>
               <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
               <div className="space-y-2"><Label>Estado (UF)</Label><Select value={uf} onValueChange={setUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
               <div className="space-y-2"><Label>Contador Responsável</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} placeholder="Nome completo" /></div>
               <div className="space-y-2"><Label>CRC do Contador</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} placeholder="Ex: PA-000000/O" /></div>
             </div>
          </div>

          {/* 2. IA LOCAL */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-blue-50/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local (Gemini)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="space-y-2"><Label>Gemini API Key</Label><Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} /></div>
               <div className="space-y-2">
                 <Label>Modelo</Label>
                 <Select value={geminiModel} onValueChange={setGeminiModel}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro</SelectItem>
                     <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                     <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="flex items-center gap-2"><Search className="h-4 w-4 text-blue-500" /> Grounding</Label>
                 <div className="flex items-center justify-between p-2 border border-blue-500/30 rounded bg-blue-500/10">
                   <span className="text-xs text-blue-800">Pesquisa na internet</span>
                   <Switch checked={enableGoogleSearch} onCheckedChange={setEnableGoogleSearch} />
                 </div>
               </div>
             </div>
          </div>

          {/* 3. WEBHOOKS */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-muted/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground" />Integrações Externas (n8n)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2"><Label>Webhook Ambiente Teste</Label><Input value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} placeholder="https://..." /></div>
               <div className="space-y-2"><Label>Webhook Ambiente Produção</Label><Input value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} placeholder="https://..." /></div>
             </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Button type="button" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={handleSave}>
              <Save className="h-5 w-5 mr-2" /> Confirmar e Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracao;