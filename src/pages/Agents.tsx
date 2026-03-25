import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Zap, Plus, Trash2, Save, Loader2, Workflow, Link2, 
  Download, FileJson, Wrench, MessageSquareQuote, Clock, FileText, Play
} from 'lucide-react';
import { AgentConfig, fetchDbAgents, fetchDbPrompts, callGeminiAgent } from '@/lib/geminiService';
import { DynamicSkill, fetchDbSkills } from '@/lib/skills/taxSkills';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Agents() {
  const { session, isAdmin } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [skills, setSkills] = useState<DynamicSkill[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{title: string, content: string} | null>(null);
  
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const [dbAgents, dbPrompts, dbSkills] = await Promise.all([
          fetchDbAgents(session.user.id, isAdmin),
          fetchDbPrompts(session.user.id, isAdmin),
          fetchDbSkills(session.user.id, isAdmin)
        ]);
        setAgents(dbAgents);
        setPrompts(dbPrompts);
        setSkills(dbSkills);
        await fetchLogs();
      } catch (e) {
        toast.error("Erro ao carregar agentes.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session, isAdmin]);

  const fetchLogs = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('agent_execution_logs')
      .select('id, status, execution_log, created_at, ai_agents(nome)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (!error && data) {
      setExecutionLogs(data);
    }
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: any) => 
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  const toggleAgentSkill = (agentId: string, skillId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    const currentSkills = agent.selectedSkills || [];
    const newSkills = currentSkills.includes(skillId) 
      ? currentSkills.filter(id => id !== skillId) 
      : [...currentSkills, skillId];
    updateAgent(agentId, 'selectedSkills', newSkills);
  };

  const addAgent = () => {
    const newAgent: AgentConfig = {
      id: crypto.randomUUID(),
      nome: 'Novo Agente Autônomo',
      systemPrompt: 'Você é um agente responsável por...',
      order: agents.length + 1,
      selectedSkills: [],
      useN8n: false,
      n8nResponseUrl: 'http://localhost:3001/agent-result',
      enableMonitoring: false,
      monitoringInterval: 60,
      cronPrompt: 'Inicie sua rotina de auditoria autônoma agora.',
      userId: session?.user.id,
      isGlobal: false
    };
    setAgents([newAgent, ...agents]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este agente?")) return;
    setAgents(prev => prev.filter(a => a.id !== id));
    if (session?.user && id.includes('-')) {
      await supabase.from('ai_agents').delete().eq('id', id);
      toast.success("Agente removido.");
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agents, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jota_agents_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Agentes exportados!");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const items = (Array.isArray(imported) ? imported : [imported]).map(a => ({
          ...a,
          id: crypto.randomUUID(),
          userId: session?.user.id,
          isGlobal: false,
          selectedSkills: [] 
        }));
        setAgents([...items, ...agents]);
        toast.success(`${items.length} Agentes importados!`);
      } catch (err) {
        toast.error("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!session?.user) return;
    setIsSaving(true);
    try {
      const uid = session.user.id;
      const agentsToSave = agents.filter(a => isAdmin || (!a.userId || a.userId === uid));

      const dataToUpsert = agentsToSave.map(a => ({
        id: a.id,
        user_id: a.userId || uid,
        module_id: a.moduleId || null,
        nome: a.nome,
        system_prompt: a.systemPrompt,
        order_index: a.order,
        selected_skills: a.selectedSkills || [],
        enable_monitoring: a.enableMonitoring,
        monitoring_interval: a.monitoringInterval,
        use_n8n: a.useN8n,
        n8n_response_url: a.n8nResponseUrl,
        webhook_url: a.webhookUrl,
        cron_prompt: a.cronPrompt,
        is_active: true,
        is_global: a.isGlobal || false
      }));

      if (dataToUpsert.length > 0) {
        const { error } = await supabase.from('ai_agents').upsert(dataToUpsert);
        if (error) throw error;
      }
      
      toast.success("Seus agentes foram salvos com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAgent = async (agent: AgentConfig) => {
    if (!session?.user) return;
    const apiKey = localStorage.getItem('jota-gemini-key');
    if (!apiKey) return toast.error("Chave API do Gemini não configurada.");
    
    setIsTesting(agent.id);
    try {
      const agentSkills = skills.filter(s => (agent.selectedSkills || []).includes(s.id));
      const triggerMessage = agent.cronPrompt || "Inicie sua rotina de auditoria autônoma agora.";
      
      // Simula a chamada que o Cron do Supabase faria
      const reportText = await callGeminiAgent(agent.systemPrompt, triggerMessage, apiKey, agentSkills);
      
      // Salva o resultado manualmente para o usuário ver
      await supabase.from('agent_execution_logs').insert({
        agent_id: agent.id,
        user_id: session.user.id,
        status: 'success',
        execution_log: reportText
      });

      toast.success(`Teste do agente '${agent.nome}' concluído!`);
      await fetchLogs(); // Atualiza a aba de logs

    } catch (error: any) {
      await supabase.from('agent_execution_logs').insert({
        agent_id: agent.id,
        user_id: session.user.id,
        status: 'error',
        execution_log: error.message
      });
      toast.error(`Erro na execução: ${error.message}`);
      await fetchLogs();
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleImport} />
      
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-card">
          <UIDialogHeader className="p-4 border-b bg-muted/10 shrink-0">
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Relatório de Execução</DialogTitle>
            <DialogDescription>Agente: {selectedReport?.title}</DialogDescription>
          </UIDialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-sm max-w-none prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedReport?.content || ""}</ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/10 flex justify-end shrink-0">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agentes Especialistas</h1>
            <p className="text-sm text-muted-foreground">Importe ou configure a sequência de inteligência autônoma.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => importRef.current?.click()}><FileJson className="h-4 w-4 mr-2" /> Importar</Button>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
          <Button variant="outline" onClick={addAgent}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar Agentes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="config"><Wrench className="h-4 w-4 mr-2" /> Configurações</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-2" /> Logs de Execução</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Carregando agentes...</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => {
                const isOwner = !agent.userId || agent.userId === session?.user.id;
                const canEdit = isOwner || isAdmin;

                return (
                  <AccordionItem key={agent.id} value={agent.id} className="border rounded-xl bg-card px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono text-primary border-primary/30">{agent.order}</Badge>
                        <div className="text-left">
                          <span className="font-bold text-sm block">{agent.nome}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            {agent.enableMonitoring && <Clock className="h-3 w-3 text-emerald-500" />}
                            {agent.useN8n && <Workflow className="h-3 w-3 text-orange-500" />}
                            {(!agent.enableMonitoring && !agent.useN8n) && "Modo Passivo (Apenas Chat)"}
                          </span>
                        </div>
                        {agent.useN8n && <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[8px]">N8N WORKFLOW</Badge>}
                        {agent.enableMonitoring && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px]">CRON ATIVO</Badge>}
                        
                        {agent.isGlobal && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">
                            {isAdmin ? 'GLOBAL' : 'GLOBAL (ADMIN)'}
                          </Badge>
                        )}
                        {!isOwner && !agent.isGlobal && (
                          <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                      
                      {!canEdit && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-4 text-xs text-amber-700 font-medium">
                          Este é um agente oficial fornecido pelo sistema. Você não pode editar ou excluir suas configurações.
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/10">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nome do Agente</Label>
                            <Input value={agent.nome} disabled={!canEdit || !!agent.moduleId} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} />
                          </div>
                          
                          {/* OPÇÃO 1: MOTOR NATIVO (CRON) */}
                          <div className="space-y-4 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-lg transition-all hover:shadow-md">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                              <div className="space-y-0.5">
                                <Label className="text-emerald-700 font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Motor Autônomo Nativo</Label>
                                <p className="text-[10px] text-muted-foreground">Roda em background via Supabase.</p>
                              </div>
                              <Switch checked={agent.enableMonitoring} disabled={!canEdit} onCheckedChange={v => { updateAgent(agent.id, 'enableMonitoring', v); if(v) updateAgent(agent.id, 'useN8n', false); }} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase">Acordar a cada (Minutos)</Label>
                                <Input type="number" disabled={!canEdit || !agent.enableMonitoring} value={agent.monitoringInterval || 60} onChange={e => updateAgent(agent.id, 'monitoringInterval', parseInt(e.target.value) || 0)} />
                              </div>
                            </div>
                            <div className="space-y-2 pt-2">
                              <Label className="text-[10px] uppercase">Gatilho Inicial (O que ele deve fazer ao acordar?)</Label>
                              <Textarea 
                                className="text-[11px] h-20 resize-none font-mono bg-white/50 border-emerald-500/20 focus-visible:ring-emerald-500" 
                                placeholder="Ex: Verifique a tabela de clientes e me alerte sobre os inativos."
                                disabled={!canEdit || !agent.enableMonitoring} 
                                value={agent.cronPrompt || ''} 
                                onChange={e => updateAgent(agent.id, 'cronPrompt', e.target.value)} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {/* OPÇÃO 2: N8N (WEBHOOK) */}
                          <div className="space-y-4 p-4 border border-orange-500/20 bg-orange-500/5 rounded-lg transition-all hover:shadow-md h-full">
                            <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                              <div className="space-y-0.5">
                                <Label className="text-orange-700 font-bold flex items-center gap-2"><Workflow className="h-4 w-4" /> Integração Externa (n8n)</Label>
                                <p className="text-[10px] text-muted-foreground">Delega a execução para um Webhook.</p>
                              </div>
                              <Switch checked={agent.useN8n} disabled={!canEdit} onCheckedChange={v => { updateAgent(agent.id, 'useN8n', v); if(v) updateAgent(agent.id, 'enableMonitoring', false); }} />
                            </div>
                            <div className="space-y-2 pt-2">
                              <Label className="text-[10px] uppercase">URL do Webhook (n8n)</Label>
                              <Input disabled={!canEdit || !agent.useN8n} value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} placeholder="https://n8n.seu-servidor.com/..." className="bg-white/50 border-orange-500/20" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase flex items-center gap-1"><Link2 className="h-3 w-3" /> URL de Resposta Assíncrona</Label>
                              <Input disabled={!canEdit || !agent.useN8n} value={agent.n8nResponseUrl || ''} onChange={e => updateAgent(agent.id, 'n8nResponseUrl', e.target.value)} className="bg-white/50 border-orange-500/20" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                        <h4 className="text-xs font-bold uppercase text-blue-700 flex items-center gap-2"><Wrench className="h-3 w-3" /> Skills Vinculadas</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {skills.map(skill => (
                            <div key={skill.id} className="flex items-center space-x-2 p-2 rounded border bg-background hover:bg-blue-50 transition-colors">
                              <Checkbox id={`skill-${agent.id}-${skill.id}`} checked={(agent.selectedSkills || []).includes(skill.id)} onCheckedChange={() => toggleAgentSkill(agent.id, skill.id)} disabled={!canEdit || !!agent.moduleId} />
                              <label htmlFor={`skill-${agent.id}-${skill.id}`} className="text-[11px] font-medium leading-none cursor-pointer truncate">{skill.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-bold text-primary"><MessageSquareQuote className="h-4 w-4" /> Prompt do Sistema</Label>
                        <AgentPromptEditor 
                          value={agent.systemPrompt} 
                          onChange={(val) => updateAgent(agent.id, 'systemPrompt', val)} 
                          prompts={prompts} 
                          skills={skills.filter(s => (agent.selectedSkills || []).includes(s.id))} 
                          className={!canEdit || !!agent.moduleId ? "opacity-70" : ""}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <div className="flex items-center gap-6">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="text-primary border-primary/30 bg-primary/5 hover:bg-primary/10" 
                            onClick={() => handleTestAgent(agent)}
                            disabled={isTesting === agent.id}
                          >
                            {isTesting === agent.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Testar Lógica Agora
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold">Ordem:</Label>
                            <Input type="number" className="w-16 h-8 text-center" disabled={!canEdit || !!agent.moduleId} value={agent.order || 0} onChange={e => updateAgent(agent.id, 'order', parseInt(e.target.value) || 0)} />
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-md border border-amber-500/10">
                              <Switch checked={agent.isGlobal || false} onCheckedChange={v => updateAgent(agent.id, 'isGlobal', v)} />
                              <Label className="text-amber-700 font-bold text-[10px] uppercase">Global</Label>
                            </div>
                          )}
                        </div>
                        {canEdit && !agent.moduleId && (
                          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(agent.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remover Agente
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="shadow-elegant border-primary/20">
            <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Relatórios Autônomos</CardTitle>
                <CardDescription>Histórico de execução dos seus agentes em background e testes manuais.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchLogs}><Clock className="h-4 w-4 mr-2" /> Atualizar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data e Hora</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executionLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">Nenhum log de execução encontrado.</TableCell>
                    </TableRow>
                  ) : executionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold">{log.ai_agents?.nome || 'Agente Desconhecido'}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'success' : 'destructive'} className="text-[10px] uppercase">
                          {log.status === 'success' ? 'Concluído' : 'Falha'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/10"
                          onClick={() => setSelectedReport({ title: log.ai_agents?.nome || 'Log', content: log.execution_log })}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Ver Relatório
                        </Button>
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