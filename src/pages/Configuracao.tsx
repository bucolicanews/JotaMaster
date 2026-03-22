import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Bot, Trash2, Plus, Zap, 
  Code, Globe, RotateCcw, Search, FileText, ChevronDown, 
  Wrench, Play, Lock, Book, Upload, Loader2, Eraser, Info, BookOpen, Copy, Check, Download, MessageSquareQuote,
  Lightbulb, Terminal, Cpu, HelpCircle, Workflow, Clock, Activity, Link2, Save
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AgentConfig, PromptConfig, fetchDbAgents, fetchDbPrompts } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DynamicSkill, fetchDbSkills, executeSkill } from '@/lib/skills/taxSkills';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';
import { PromptSystemEditor } from '@/components/PromptSystemEditor';
import * as XLSX from 'xlsx';

let pdfjsLib: any = null;
const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Configuracao = () => {
  const { autenticado, session, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSkillIdForUpload, setActiveSkillIdForUpload] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTestingSkill, setIsTestingSkill] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

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

  // Variáveis do Banco de Dados
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>([]);

  useEffect(() => {
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
  }, [razaoSocial, cnpj, uf, webhookTestUrl, webhookProdUrl, contadorNome, contadorCrc, geminiKey, geminiModel, enableGoogleSearch]);

  useEffect(() => {
    const loadDbData = async () => {
      if (!session?.user) return;
      setIsLoadingDB(true);
      try {
        const [dbAgents, dbPrompts, dbSkills] = await Promise.all([
          fetchDbAgents(session.user.id),
          fetchDbPrompts(session.user.id),
          fetchDbSkills(session.user.id)
        ]);
        setAgents(dbAgents);
        setPrompts(dbPrompts);
        setDynamicSkills(dbSkills);
      } catch (e) {
        toast.error("Erro ao carregar dados do banco.");
      } finally {
        setIsLoadingDB(false);
      }
    };
    loadDbData();
  }, [session]);

  const cleanTextNoise = (text: string) => text.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ").replace(/\t/g, " ").replace(/ +/g, " ").replace(/\n\s*\n/g, "\n\n").trim();

  const saveToDatabase = async () => {
    if (!session?.user) return toast.error("Usuário não autenticado.");
    setIsSaving(true);
    try {
      const uid = session.user.id;

      // Filtra apenas os itens que o usuário atual tem permissão para salvar (seus próprios itens)
      const mySkills = dynamicSkills.filter(s => !s.userId || s.userId === uid);
      if (mySkills.length > 0) {
        const skillsToUpsert = mySkills.map(s => ({
          id: s.id, user_id: uid, module_id: s.moduleId || null,
          name: s.name, description: s.description, suggested_instruction: s.suggestedInstruction,
          parameters: s.parameters, execution_type: s.executionType, js_code: s.jsCode, webhook_url: s.webhookUrl,
          knowledge_base_text: s.knowledgeBaseText, url: s.url, selector: s.selector, is_active: s.isActive,
          is_global: s.isGlobal || false
        }));
        await supabase.from('ai_skills').upsert(skillsToUpsert);
      }

      const myPrompts = prompts.filter(p => !p.userId || p.userId === uid);
      if (myPrompts.length > 0) {
        const promptsToUpsert = myPrompts.map(p => ({
          id: p.id, user_id: uid, module_id: p.moduleId || null,
          title: p.title, role: p.role, content: p.content, is_active: p.isActive,
          is_global: p.isGlobal || false
        }));
        await supabase.from('ai_prompts').upsert(promptsToUpsert);
      }

      const myAgents = agents.filter(a => !a.userId || a.userId === uid);
      if (myAgents.length > 0) {
        const agentsToUpsert = myAgents.map(a => ({
          id: a.id, user_id: uid, module_id: a.moduleId || null,
          nome: a.nome, system_prompt: a.systemPrompt, order_index: a.order,
          selected_skills: a.selectedSkills || [], enable_monitoring: a.enableMonitoring,
          monitoring_interval: a.monitoringInterval, use_n8n: a.useN8n, n8n_response_url: a.n8nResponseUrl,
          webhook_url: a.webhookUrl, is_active: true,
          is_global: a.isGlobal || false
        }));
        await supabase.from('ai_agents').upsert(agentsToUpsert);
      }

      toast.success("Configurações salvas no Banco de Dados!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    setDynamicSkills(prev => prev.filter(s => s.id !== id));
    if (session?.user && id.includes('-')) await supabase.from('ai_skills').delete().eq('id', id);
  };

  const handleDeletePrompt = async (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (session?.user && id.includes('-')) await supabase.from('ai_prompts').delete().eq('id', id);
  };

  const handleDeleteAgent = async (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (session?.user && id.includes('-')) await supabase.from('ai_agents').delete().eq('id', id);
  };

  const handleTestSkill = async (skill: DynamicSkill) => {
    setIsTestingSkill(skill.id);
    try {
      const result = await executeSkill(skill.name, {}, dynamicSkills);
      if (result.error) toast.error(`Erro: ${result.error}`);
      else {
        toast.success("Teste concluído!");
        if (skill.executionType === 'web_scraping' && result.conteudo) {
          updateSkill(skill.id, 'knowledgeBaseText', cleanTextNoise(result.conteudo));
        }
      }
    } catch (err: any) { toast.error(`Falha: ${err.message}`); } 
    finally { setIsTestingSkill(null); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSkillIdForUpload) return;
    setIsExtracting(true);
    try {
      let text = "";
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".pdf")) {
        if (!pdfjsLib) {
          pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          text += `--- Planilha: ${sheetName} ---\n`;
          text += XLSX.utils.sheet_to_txt(workbook.Sheets[sheetName]) + "\n\n";
        });
      } else { text = await file.text(); }
      updateSkill(activeSkillIdForUpload, 'knowledgeBaseText', cleanTextNoise(text));
      toast.success("Conteúdo extraído com sucesso!");
    } catch (error: any) { 
      toast.error(`Erro na extração: ${error.message}`); 
    } finally { 
      setIsExtracting(false); setActiveSkillIdForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: any) => setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  const toggleAgentSkill = (agentId: string, skillId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    const currentSkills = agent.selectedSkills || [];
    updateAgent(agentId, 'selectedSkills', currentSkills.includes(skillId) ? currentSkills.filter(id => id !== skillId) : [...currentSkills, skillId]);
  };
  const updatePrompt = (id: string, field: keyof PromptConfig, value: any) => setPrompts(prompts.map(p => p.id === id ? { ...p, [field]: value } : p));
  const updateSkill = (id: string, field: keyof DynamicSkill, value: any) => setDynamicSkills(dynamicSkills.map(s => s.id === id ? { ...s, [field]: value } : s));
  
  const addPrompt = () => setPrompts([{ id: generateUUID(), title: 'Novo Prompt', role: 'Especialista', content: '', isActive: true }, ...prompts]);
  const addSkill = () => setDynamicSkills([{ id: generateUUID(), name: 'nova_skill', description: 'Descrição', parameters: { type: 'object', properties: {} }, executionType: 'local_js', isActive: true, jsCode: 'return { status: "ok" };' }, ...dynamicSkills]);
  const addAgent = () => setAgents([...agents, { id: generateUUID(), nome: 'Novo Agente', systemPrompt: '', order: agents.length + 1, selectedSkills: [], enableMonitoring: false, monitoringInterval: 60, useN8n: false, n8nResponseUrl: 'http://localhost:3001/agent-result' }]);

  return (
    <div className="container mx-auto px-4 py-8">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.xlsx,.xls,.csv,.txt" />

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={saveToDatabase} disabled={isSaving || isLoadingDB} className="bg-primary hover:bg-primary/90">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar no Banco
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {isLoadingDB && (
            <div className="flex flex-col items-center justify-center py-6 text-primary">
               <Loader2 className="h-8 w-8 animate-spin mb-2" />
               <p className="text-sm font-bold animate-pulse">Sincronizando com o Banco de Dados...</p>
            </div>
          )}

          {!isLoadingDB && (
            <>
              {/* 1. DADOS DA EMPRESA E CONTADOR */}
              <div className="space-y-6 rounded-lg border border-border p-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" />Identificação e Responsabilidade</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} /></div>
                   <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
                   <div className="space-y-2"><Label>Estado (UF)</Label><Select value={uf} onValueChange={setUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                   <div className="space-y-2"><Label>Contador Responsável</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} placeholder="Nome completo" /></div>
                   <div className="space-y-2"><Label>CRC do Contador</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} placeholder="Ex: PA-000000/O" /></div>
                 </div>
              </div>

              {autenticado ? (
                <>
                  {/* 3. BIBLIOTECA DE PROMPTS */}
                  <div className="space-y-4 rounded-lg border border-indigo-500/30 p-4 bg-indigo-500/5">
                     <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600"><MessageSquareQuote className="h-5 w-5" />Biblioteca de Prompts</h3>
                         <p className="text-xs text-indigo-700/70">Gerencie os cérebros e personas da sua IA.</p>
                       </div>
                       <Button type="button" size="sm" variant="outline" className="border-indigo-200 text-indigo-600" onClick={addPrompt}><Plus className="h-4 w-4 mr-2" /> Novo Prompt</Button>
                     </div>

                     <Accordion type="multiple" className="w-full space-y-2">
                       {prompts.map((prompt) => {
                         const isOwner = !prompt.userId || prompt.userId === session?.user.id;
                         return (
                           <AccordionItem key={prompt.id} value={prompt.id} className="border rounded-md bg-background px-4">
                             <AccordionTrigger className="hover:no-underline py-3">
                               <div className="flex items-center gap-3">
                                 <div className={prompt.isActive ? "text-indigo-500" : "text-muted-foreground"}><Bot className="h-4 w-4" /></div>
                                 <span className="font-bold text-sm">{prompt.title}</span>
                                 {prompt.moduleId && <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[8px] h-4">MÓDULO: {prompt.moduleId}</Badge>}
                                 {!isOwner && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] h-4">GLOBAL</Badge>}
                               </div>
                             </AccordionTrigger>
                             <AccordionContent className="pt-2 pb-4 space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2"><Label>Título</Label><Input value={prompt.title} disabled={!isOwner || !!prompt.moduleId} onChange={e => updatePrompt(prompt.id, 'title', e.target.value)} /></div>
                                 <div className="space-y-2"><Label>Persona</Label><Input value={prompt.role} disabled={!isOwner || !!prompt.moduleId} onChange={e => updatePrompt(prompt.id, 'role', e.target.value)} /></div>
                               </div>
                               <div className="space-y-2">
                                 <Label className="text-indigo-600">Instruções de Sistema</Label>
                                 <PromptSystemEditor value={prompt.content} onChange={e => { if (isOwner && !prompt.moduleId) updatePrompt(prompt.id, 'content', e); }} />
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                 <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2"><Switch checked={prompt.isActive} disabled={!isOwner} onCheckedChange={v => updatePrompt(prompt.id, 'isActive', v)} /><Label>Ativo</Label></div>
                                    {isAdmin && isOwner && (
                                      <div className="flex items-center gap-2">
                                        <Switch checked={prompt.isGlobal} onCheckedChange={v => updatePrompt(prompt.id, 'isGlobal', v)} />
                                        <Label className="text-amber-600 font-bold">Global (Compartilhar com todos)</Label>
                                      </div>
                                    )}
                                 </div>
                                 {isOwner && !prompt.moduleId && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeletePrompt(prompt.id)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>}
                               </div>
                             </AccordionContent>
                           </AccordionItem>
                         );
                       })}
                     </Accordion>
                  </div>

                  {/* 4. SKILLS E FERRAMENTAS */}
                  <div className="space-y-4 rounded-lg border border-emerald-500/30 p-4 bg-emerald-500/5">
                     <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600"><Wrench className="h-5 w-5" />Skills e Ferramentas</h3>
                         <p className="text-xs text-emerald-700/70">Ferramentas de banco de dados ou execução isolada.</p>
                       </div>
                       <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={addSkill}><Plus className="h-4 w-4 mr-2" /> Nova Skill</Button>
                     </div>

                     <Accordion type="multiple" className="w-full space-y-2">
                       {dynamicSkills.map((skill) => {
                         const isOwner = !skill.userId || skill.userId === session?.user.id;
                         return (
                           <AccordionItem key={skill.id} value={skill.id} className="border rounded-md bg-background px-4">
                             <AccordionTrigger className="hover:no-underline py-3">
                               <div className="flex items-center gap-3">
                                 <div className={skill.isActive ? "text-emerald-500" : "text-muted-foreground"}>
                                   {skill.executionType === 'webhook' ? <Globe className="h-4 w-4" /> : skill.executionType === 'local_js' ? <Code className="h-4 w-4" /> : skill.executionType === 'web_scraping' ? <Search className="h-4 w-4" /> : <Book className="h-4 w-4" />}
                                 </div>
                                 <span className="font-bold text-sm">{skill.name}</span>
                                 {skill.moduleId && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] h-4">MÓDULO: {skill.moduleId}</Badge>}
                                 {!isOwner && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] h-4">GLOBAL</Badge>}
                               </div>
                             </AccordionTrigger>
                             <AccordionContent className="pt-2 pb-4 space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="space-y-2"><Label>Nome Técnico</Label><Input value={skill.name} disabled={!isOwner || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'name', e.target.value)} /></div>
                                 <div className="space-y-2">
                                   <Label>Tipo de Execução</Label>
                                   <Select value={skill.executionType} disabled={!isOwner || !!skill.moduleId} onValueChange={v => updateSkill(skill.id, 'executionType', v)}>
                                     <SelectTrigger><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="local_js">JavaScript Local</SelectItem>
                                       <SelectItem value="webhook">Webhook (n8n)</SelectItem>
                                       <SelectItem value="knowledge_base">Base de Conhecimento</SelectItem>
                                       <SelectItem value="web_scraping">Navegação Web</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div className="flex items-center gap-2 pt-6"><Switch checked={skill.isActive} disabled={!isOwner} onCheckedChange={v => updateSkill(skill.id, 'isActive', v)} /><Label>Ativa</Label></div>
                               </div>

                               <div className="space-y-2"><Label>Descrição para a IA</Label><Input value={skill.description} disabled={!isOwner || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'description', e.target.value)} /></div>

                               <div className="space-y-2">
                                 <Label className="text-emerald-600">Instrução Sugerida</Label>
                                 <Textarea value={skill.suggestedInstruction || ''} disabled={!isOwner || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'suggestedInstruction', e.target.value)} className="text-xs h-20" />
                               </div>

                               {skill.executionType === 'knowledge_base' ? (
                                 <div className="space-y-3">
                                   <div className="flex items-center justify-between">
                                     <Label className="flex items-center gap-2 text-blue-600"><Book className="h-3 w-3" /> Conteúdo da Base</Label>
                                     <div className="flex gap-2">
                                       <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-amber-200 text-amber-600" disabled={!isOwner} onClick={() => { const cleaned = cleanTextNoise(skill.knowledgeBaseText || ''); updateSkill(skill.id, 'knowledgeBaseText', cleaned); toast.success("Ruído removido!"); }}><Eraser className="h-3 w-3 mr-1" /> Limpar</Button>
                                       <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-blue-200 text-blue-600" onClick={() => { setActiveSkillIdForUpload(skill.id); fileInputRef.current?.click(); }} disabled={!isOwner || isExtracting || !!skill.moduleId}>{isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Arquivo</Button>
                                     </div>
                                   </div>
                                   <Textarea className="font-sans text-xs h-64 bg-slate-950 text-blue-300 border-blue-900/50" disabled={!isOwner || !!skill.moduleId} value={skill.knowledgeBaseText || ''} onChange={e => updateSkill(skill.id, 'knowledgeBaseText', e.target.value)} />
                                 </div>
                               ) : (
                                 <div className="space-y-4">
                                   {skill.executionType === 'web_scraping' && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-blue-500/5 border-blue-500/20">
                                       <div className="space-y-2"><Label className="text-blue-600 flex items-center gap-2"><Globe className="h-3 w-3" /> URL do Site</Label><Input value={skill.url || ''} disabled={!isOwner || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'url', e.target.value)} /></div>
                                       <div className="space-y-2"><Label className="text-blue-600 flex items-center gap-2"><Search className="h-3 w-3" /> Seletor CSS</Label><Input value={skill.selector || ''} disabled={!isOwner || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'selector', e.target.value)} /></div>
                                     </div>
                                   )}
                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                     <div className="space-y-2"><Label>Parâmetros JSON</Label><Textarea className="font-mono text-[10px] h-48 bg-slate-900 text-blue-300" disabled={!isOwner || !!skill.moduleId} value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} /></div>
                                     {skill.executionType === 'local_js' && <div className="space-y-2"><Label className="text-emerald-600">Código JavaScript</Label><Textarea className="font-mono text-[11px] h-48 bg-slate-950 text-emerald-400" disabled={!isOwner || !!skill.moduleId} value={skill.jsCode || ''} onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} /></div>}
                                   </div>
                                 </div>
                               )}
                               <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                 <div className="flex gap-2 items-center">
                                   <Button type="button" variant="outline" size="sm" className="text-emerald-600 border-emerald-200" onClick={() => handleTestSkill(skill)} disabled={isTestingSkill === skill.id}>{isTestingSkill === skill.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Testar Skill</Button>
                                   {isAdmin && isOwner && (
                                     <div className="flex items-center gap-2 ml-4">
                                       <Switch checked={skill.isGlobal} onCheckedChange={v => updateSkill(skill.id, 'isGlobal', v)} />
                                       <Label className="text-amber-600 font-bold">Global (Compartilhar com todos)</Label>
                                     </div>
                                   )}
                                 </div>
                                 {isOwner && !skill.moduleId && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSkill(skill.id)}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>}
                               </div>
                             </AccordionContent>
                           </AccordionItem>
                         );
                       })}
                     </Accordion>
                  </div>

                  {/* 5. AGENTES ESPECIALISTAS */}
                  <div className="space-y-4 rounded-lg border border-primary/30 p-4 bg-primary/5">
                     <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Agentes Especialistas (Timeline)</h3>
                         <p className="text-xs text-primary/70">Configure a sequência de inteligência autônoma.</p>
                       </div>
                       <Button type="button" size="sm" onClick={addAgent}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
                     </div>

                     <Accordion type="multiple" className="w-full space-y-2">
                       {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => {
                         const isOwner = !agent.userId || agent.userId === session?.user.id;
                         return (
                           <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4">
                             <AccordionTrigger className="hover:no-underline py-3">
                               <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="font-mono">{agent.order}</Badge>
                                 <span className="font-bold text-sm">{agent.nome}</span>
                                 {agent.moduleId && <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] h-4">MÓDULO: {agent.moduleId}</Badge>}
                                 {agent.enableMonitoring && <Badge className="bg-emerald-500 text-[8px] h-4">MONITORANDO</Badge>}
                                 {!isOwner && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] h-4">GLOBAL</Badge>}
                               </div>
                             </AccordionTrigger>
                             <AccordionContent className="pt-2 pb-4 space-y-6">
                               
                               <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2"><Label>Nome do Agente</Label><Input value={agent.nome} disabled={!isOwner || !!agent.moduleId} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} /></div>
                                   <div className="space-y-2"><Label>Webhook n8n (Execução)</Label><Input value={agent.webhookUrl || ''} disabled={!isOwner || !!agent.moduleId} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} /></div>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                   <div className="flex items-center justify-between p-3 border rounded-md bg-orange-500/5 border-orange-500/20"><div className="space-y-0.5"><Label className="text-orange-700 flex items-center gap-2"><Workflow className="h-3 w-3" /> Usar n8n</Label></div><Switch checked={agent.useN8n} disabled={!isOwner || !!agent.moduleId} onCheckedChange={v => updateAgent(agent.id, 'useN8n', v)} /></div>
                                   <div className="space-y-2"><Label className="text-orange-700 flex items-center gap-2"><Link2 className="h-3 w-3" /> URL de Resposta do n8n</Label><Input disabled={!isOwner || !agent.useN8n || !!agent.moduleId} value={agent.n8nResponseUrl || ''} onChange={e => updateAgent(agent.id, 'n8nResponseUrl', e.target.value)} /></div>
                                 </div>
                               </div>

                               <div className="space-y-4 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                                 <h4 className="text-xs font-bold uppercase text-blue-700 flex items-center gap-2"><Wrench className="h-3 w-3" /> Skills Vinculadas</h4>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                   {dynamicSkills.map(skill => (
                                     <div key={skill.id} className="flex items-center space-x-2 p-2 rounded border bg-background hover:bg-blue-50">
                                       <Checkbox id={`skill-${agent.id}-${skill.id}`} checked={(agent.selectedSkills || []).includes(skill.id)} onCheckedChange={() => toggleAgentSkill(agent.id, skill.id)} disabled={!isOwner || !!agent.moduleId} />
                                       <label htmlFor={`skill-${agent.id}-${skill.id}`} className="text-[11px] font-medium leading-none cursor-pointer truncate">{skill.name}</label>
                                     </div>
                                   ))}
                                 </div>
                               </div>

                               <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><MessageSquareQuote className="h-4 w-4 text-primary" /> Prompt do Sistema</Label>
                                 {!isOwner || agent.moduleId ? (
                                   <Textarea className="font-mono text-[11px] h-48 bg-slate-950 text-primary border-primary/30" disabled value={agent.systemPrompt} />
                                 ) : (
                                   <AgentPromptEditor value={agent.systemPrompt} onChange={(val) => updateAgent(agent.id, 'systemPrompt', val)} prompts={prompts} skills={dynamicSkills.filter(s => (agent.selectedSkills || []).includes(s.id))} />
                                 )}
                               </div>

                               <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                 <div className="flex items-center gap-6">
                                   <div className="flex items-center gap-2"><Label>Ordem:</Label><Input type="number" className="w-16 h-8 text-center" disabled={!isOwner || !!agent.moduleId} value={agent.order || 0} onChange={e => updateAgent(agent.id, 'order', parseInt(e.target.value) || 0)} /></div>
                                   {isAdmin && isOwner && (
                                     <div className="flex items-center gap-2">
                                       <Switch checked={agent.isGlobal} onCheckedChange={v => updateAgent(agent.id, 'isGlobal', v)} />
                                       <Label className="text-amber-600 font-bold">Global (Compartilhar com todos)</Label>
                                     </div>
                                   )}
                                 </div>
                                 {isOwner && !agent.moduleId && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAgent(agent.id)}><Trash2 className="h-4 w-4 mr-2" /> Remover Agente</Button>}
                               </div>
                             </AccordionContent>
                           </AccordionItem>
                         );
                       })}
                     </Accordion>
                  </div>

                  {/* 6. IA LOCAL */}
                  <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-50/5">
                     <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local</h3>
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
                </>
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-bold">Acesso Restrito</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">As configurações avançadas de IA estão protegidas.</p>
                </div>
              )}
            </>
          )}

          <div className="pt-6 border-t border-border">
            <Button type="button" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={saveToDatabase} disabled={isSaving || isLoadingDB}>
              {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />} Confirmar e Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracao;