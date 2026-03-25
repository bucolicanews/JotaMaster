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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleImport} />
      
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <MessageSquareQuote className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Biblioteca de Prompts</h1>
            <p className="text-sm text-muted-foreground">Gerencie e importe personas para sua IA.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => importRef.current?.click()}><FileJson className="h-4 w-4 mr-2" /> Importar</Button>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
          <Button variant="outline" onClick={addPrompt}><Plus className="h-4 w-4 mr-2" /> Novo Prompt</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar Biblioteca
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
              <AccordionItem key={prompt.id} value={prompt.id} className="border rounded-xl bg-card px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <div className={prompt.isActive ? "text-indigo-500" : "text-muted-foreground"}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-sm block">{prompt.title}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{prompt.role}</span>
                    </div>
                    
                    {/* INDICADORES VISUAIS DE GOVERNANÇA */}
                    {prompt.isGlobal && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">
                        {isAdmin ? 'GLOBAL' : 'GLOBAL (ADMIN)'}
                      </Badge>
                    )}
                    {!isOwner && !prompt.isGlobal && (
                      <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>
                    )}
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

                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={prompt.isActive} disabled={!canEdit} onCheckedChange={v => updatePrompt(prompt.id, 'isActive', v)} />
                        <Label>Ativo</Label>
                      </div>

                      {/* CONTROLE GLOBAL PARA O ADMIN */}
                      {isAdmin && (
                        <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-md border border-amber-500/10">
                          <Switch checked={prompt.isGlobal || false} onCheckedChange={v => updatePrompt(prompt.id, 'isGlobal', v)} />
                          <Label className="text-amber-700 font-bold text-[10px] uppercase">Global</Label>
                        </div>
                      )}
                    </div>
                    
                    {canEdit && !prompt.moduleId && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(prompt.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover
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