import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageSquareQuote, Plus, Trash2, Bot, Save, Loader2, 
  Download, FileJson, Terminal
} from 'lucide-react';
import { PromptConfig, fetchDbPrompts } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PromptSystemEditor } from '@/components/PromptSystemEditor';
import { cn } from '@/lib/utils';

export default function Prompts() {
  const { session, isAdmin } = useAuth();
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const data = await fetchDbPrompts(session.user.id, isAdmin);
        setPrompts(data);
      } catch (e) {
        toast.error("Erro ao carregar prompts.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session, isAdmin]);

  const updatePrompt = (id: string, field: keyof PromptConfig, value: any) => 
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const addPrompt = () => {
    const newPrompt: PromptConfig = {
      id: crypto.randomUUID(),
      title: 'Novo Especialista',
      role: 'Consultor',
      content: 'Você é um especialista em...',
      isActive: true,
      userId: session?.user.id,
      isGlobal: false
    };
    setPrompts([newPrompt, ...prompts]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta persona?")) return;
    
    setPrompts(prev => prev.filter(p => p.id !== id));
    
    if (session?.user && id.includes('-')) {
      try {
        const { error } = await supabase.from('ai_prompts').delete().eq('id', id);
        if (error) throw error;
        toast.success("Prompt removido com sucesso.");
      } catch (err: any) {
        toast.error("Erro ao excluir do banco de dados: " + err.message);
      }
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jota_prompts_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Biblioteca exportada!");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const items = (Array.isArray(imported) ? imported : [imported]).map(p => ({
          ...p,
          id: crypto.randomUUID(),
          userId: session?.user.id,
          isGlobal: false
        }));
        setPrompts([...items, ...prompts]);
        toast.success(`${items.length} Prompts importados!`);
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
      const dataToUpsert = prompts.map(p => ({
        id: p.id,
        user_id: p.userId || uid,
        module_id: p.moduleId || null,
        title: p.title,
        role: p.role,
        content: p.content,
        is_active: p.isActive,
        is_global: p.isGlobal || false
      }));

      const { error } = await supabase.from('ai_prompts').upsert(dataToUpsert);
      if (error) throw error;
      toast.success("Biblioteca de Prompts atualizada!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleImport} />
      
      {/* HEADER REFORMULADO: Responsividade Mobile-First */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-6 gap-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shrink-0">
            <MessageSquareQuote className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">Biblioteca de Prompts</h1>
            <p className="text-xs text-muted-foreground">Gerencie e importe personas para sua IA.</p>
          </div>
        </div>
        
        {/* GRID DE BOTÕES: 2 colunas no mobile, flex no desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="h-10 text-xs" onClick={() => importRef.current?.click()}>
            <FileJson className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Importar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs border-primary/20 text-primary hover:bg-primary/10" onClick={addPrompt}>
            <Plus className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Novo Prompt</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-10 text-xs bg-indigo-600 hover:bg-indigo-700 shadow-md col-span-2 sm:col-span-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" /> : <Save className="h-4 w-4 mr-2 shrink-0" />} <span className="truncate">Salvar Biblioteca</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Carregando personas...</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-3">
          {prompts.map((prompt) => {
            const isOwner = !prompt.userId || prompt.userId === session?.user.id;
            const canEdit = isOwner || isAdmin;

            return (
              <AccordionItem key={prompt.id} value={prompt.id} className="border rounded-xl bg-card px-3 md:px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 w-full pr-4">
                    <div className={cn("shrink-0", prompt.isActive ? "text-indigo-500" : "text-muted-foreground")}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{prompt.title}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block truncate">{prompt.role}</span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0 hidden sm:flex">
                      {prompt.isGlobal && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">
                          {isAdmin ? 'GLOBAL' : 'GLOBAL (ADMIN)'}
                        </Badge>
                      )}
                      {!isOwner && !prompt.isGlobal && (
                        <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-6">
                  
                  {!canEdit && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-4 text-xs text-amber-700 font-medium">
                      Este é um prompt oficial fornecido pelo sistema. Você não pode editar ou excluir suas configurações.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título do Prompt</Label>
                      <Input value={prompt.title} disabled={!canEdit || !!prompt.moduleId} onChange={e => updatePrompt(prompt.id, 'title', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Persona / Papel</Label>
                      <Input value={prompt.role} disabled={!canEdit || !!prompt.moduleId} onChange={e => updatePrompt(prompt.id, 'role', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-indigo-600 font-bold flex items-center gap-2">
                      <Terminal className="h-4 w-4" /> Instruções de Sistema
                    </Label>
                    <PromptSystemEditor 
                      value={prompt.content} 
                      onChange={val => updatePrompt(prompt.id, 'content', val)} 
                      className={!canEdit || !!prompt.moduleId ? "opacity-70" : ""}
                    />
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-4 border-t border-border/50 gap-4">
                    <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        <Label className="font-bold">Ativo no Sistema</Label>
                        <Switch checked={prompt.isActive} disabled={!canEdit} onCheckedChange={v => updatePrompt(prompt.id, 'isActive', v)} />
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-md border border-amber-500/10 w-full sm:w-auto justify-between sm:justify-start">
                          <Label className="text-amber-700 font-bold text-[10px] uppercase">Acesso Global</Label>
                          <Switch checked={prompt.isGlobal || false} onCheckedChange={v => updatePrompt(prompt.id, 'isGlobal', v)} />
                        </div>
                      )}
                    </div>
                    
                    {canEdit && !prompt.moduleId && (
                      <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={() => handleDelete(prompt.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover Persona
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