import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Wrench, Plus, Trash2, Globe, Code, Search, Book, 
  Play, Loader2, Upload, Save, Download, FileJson
} from 'lucide-react';
import { DynamicSkill, fetchDbSkills, executeSkill } from '@/lib/skills/taxSkills';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Skills() {
  const { session, isAdmin } = useAuth();
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSkill, setIsTestingSkill] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const data = await fetchDbSkills(session.user.id, isAdmin);
        setDynamicSkills(data);
      } catch (e) {
        toast.error("Erro ao carregar skills.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session, isAdmin]);

  const updateSkill = (id: string, field: keyof DynamicSkill, value: any) => 
    setDynamicSkills(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addSkill = () => {
    const newSkill: DynamicSkill = {
      id: crypto.randomUUID(),
      name: 'nova_skill',
      description: 'Descrição da funcionalidade',
      parameters: { type: 'object', properties: {} },
      executionType: 'local_js',
      isActive: true,
      jsCode: 'return { status: "ok" };',
      userId: session?.user.id
    };
    setDynamicSkills([newSkill, ...dynamicSkills]);
  };

  // Correção do Ghosting: Deleta fisicamente do banco de dados
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta ferramenta?")) return;
    
    // 1. Remove da tela imediatamente (Optimistic UI)
    setDynamicSkills(prev => prev.filter(s => s.id !== id));
    
    // 2. Se a Skill já existia no banco (tem '-' no UUID do Supabase), deleta no backend
    if (session?.user && id.includes('-')) {
      try {
        const { error } = await supabase.from('ai_skills').delete().eq('id', id);
        if (error) throw error;
        toast.success("Skill removida com sucesso.");
      } catch (err: any) {
        toast.error("Erro ao excluir do banco de dados: " + err.message);
      }
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dynamicSkills, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jota_skills_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Arquivo de exportação gerado!");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const skillsWithNewIds = (Array.isArray(imported) ? imported : [imported]).map(s => ({
          ...s,
          id: crypto.randomUUID(),
          userId: session?.user.id,
          isGlobal: false
        }));
        setDynamicSkills([...skillsWithNewIds, ...dynamicSkills]);
        toast.success(`${skillsWithNewIds.length} Skills importadas! Clique em Salvar para persistir.`);
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
      const skillsToUpsert = dynamicSkills.map(s => ({
        id: s.id,
        user_id: s.userId || uid,
        module_id: s.moduleId || null,
        name: s.name,
        description: s.description,
        suggested_instruction: s.suggestedInstruction,
        parameters: s.parameters,
        execution_type: s.executionType,
        js_code: s.jsCode,
        webhook_url: s.webhookUrl,
        knowledge_base_text: s.knowledgeBaseText,
        url: s.url,
        selector: s.selector,
        is_active: s.isActive,
        is_global: s.isGlobal || false
      }));

      const { error } = await supabase.from('ai_skills').upsert(skillsToUpsert);
      if (error) throw error;
      toast.success("Skills salvas com sucesso!");
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
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Wrench className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skills e Ferramentas</h1>
            <p className="text-sm text-muted-foreground">Importe ou crie novas habilidades para sua IA.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => importRef.current?.click()}><FileJson className="h-4 w-4 mr-2" /> Importar</Button>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
          <Button variant="outline" onClick={addSkill}><Plus className="h-4 w-4 mr-2" /> Nova Skill</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar Alterações
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Carregando suas ferramentas...</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-3">
          {dynamicSkills.map((skill) => {
            const isOwner = !skill.userId || skill.userId === session?.user.id;
            const canEdit = isOwner || isAdmin;

            return (
              <AccordionItem key={skill.id} value={skill.id} className="border rounded-xl bg-card px-4 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <div className={skill.isActive ? "text-emerald-500" : "text-muted-foreground"}>
                      {skill.executionType === 'webhook' ? <Globe className="h-5 w-5" /> : 
                       skill.executionType === 'local_js' ? <Code className="h-5 w-5" /> : 
                       skill.executionType === 'web_scraping' ? <Search className="h-5 w-5" /> : 
                       <Book className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-sm block">{skill.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{skill.executionType}</span>
                    </div>
                    {skill.isGlobal && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">GLOBAL</Badge>}
                    {!isOwner && <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Técnico (ID)</Label>
                      <Input value={skill.name} disabled={!canEdit || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Execução</Label>
                      <Select value={skill.executionType} disabled={!canEdit || !!skill.moduleId} onValueChange={v => updateSkill(skill.id, 'executionType', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_js">JavaScript Local</SelectItem>
                          <SelectItem value="webhook">Webhook (n8n)</SelectItem>
                          <SelectItem value="knowledge_base">Base de Conhecimento</SelectItem>
                          <SelectItem value="web_scraping">Navegação Web</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <Switch checked={skill.isActive} disabled={!canEdit} onCheckedChange={v => updateSkill(skill.id, 'isActive', v)} />
                      <Label>Skill Ativa</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição para a IA (O que esta ferramenta faz?)</Label>
                    <Input value={skill.description} disabled={!canEdit || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'description', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parâmetros JSON (Schema)</Label>
                      <Textarea className="font-mono text-[10px] h-40 bg-slate-900 text-blue-300" disabled={!canEdit} value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} />
                    </div>
                    {skill.executionType === 'local_js' && (
                      <div className="space-y-2">
                        <Label className="text-emerald-600 font-bold">Código JavaScript (Async)</Label>
                        <Textarea className="font-mono text-[11px] h-40 bg-slate-950 text-emerald-400" disabled={!canEdit} value={skill.jsCode || ''} onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" size="sm" className="text-emerald-600 border-emerald-200" onClick={() => executeSkill(skill.name, {}, dynamicSkills)}>
                      <Play className="h-4 w-4 mr-2" /> Testar Agora
                    </Button>
                    {canEdit && !skill.moduleId && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(skill.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover Skill
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