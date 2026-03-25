import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, Plus, Trash2, Save, Loader2, Workflow, Link2, 
  Download, FileJson, Wrench, MessageSquareQuote
} from 'lucide-react';
import { AgentConfig, fetchDbAgents, fetchDbPrompts } from '@/lib/geminiService';
import { DynamicSkill, fetchDbSkills } from '@/lib/skills/taxSkills';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';

export default function Agents() {
  const { session, isAdmin } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [skills, setSkills] = useState<DynamicSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      } catch (e) {
        toast.error("Erro ao carregar agentes.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session, isAdmin]);

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
          selectedSkills: [] // Reset skills on import to avoid ID mismatch
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
      
      // SEGURANÇA (Fail Safe): Filtra apenas os agentes que o usuário tem permissão para editar.
      // Se não for Admin, não tenta enviar os agentes Globais no UPSERT, evitando o erro de RLS.
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
        is_active: true,
        is_global: a.isGlobal || false
      }));

      // Se a lista estiver vazia (só existem globais), não fazemos a requisição.
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleImport} />
      
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
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ordem de Execução</span>
                    </div>
                    {agent.useN8n && <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[8px]">N8N WORKFLOW</Badge>}
                    
                    {/* INDICADORES VISUAIS DE GOVERNANÇA */}
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
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Workflow className="h-3 w-3" /> Webhook de Execução (n8n)</Label>
                        <Input value={agent.webhookUrl || ''} disabled={!canEdit || !!agent.moduleId} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} placeholder="https://n8n.seu-servidor.com/..." />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-md bg-background">
                        <div className="space-y-0.5">
                          <Label className="text-orange-700 font-bold">Modo n8n</Label>
                          <p className="text-[10px] text-muted-foreground">Habilita resposta assíncrona via URL.</p>
                        </div>
                        <Switch checked={agent.useN8n} disabled={!canEdit || !!agent.moduleId} onCheckedChange={v => updateAgent(agent.id, 'useN8n', v)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Link2 className="h-3 w-3" /> URL de Resposta</Label>
                        <Input disabled={!canEdit || !agent.useN8n || !!agent.moduleId} value={agent.n8nResponseUrl || ''} onChange={e => updateAgent(agent.id, 'n8nResponseUrl', e.target.value)} />
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
    </div>
  );
}