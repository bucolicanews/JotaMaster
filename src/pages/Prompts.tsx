import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageSquareQuote, Plus, Trash2, Bot, Save, Loader2, 
  ShieldCheck, Sparkles, Lightbulb, Terminal
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
      userId: session?.user.id
    };
    setPrompts([newPrompt, ...prompts]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este prompt?")) return;
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (session?.user && id.includes('-')) {
      await supabase.from('ai_prompts').delete().eq('id', id);
      toast.success("Prompt removido.");
    }
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
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <MessageSquareQuote className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Biblioteca de Prompts</h1>
            <p className="text-sm text-muted-foreground">Gerencie as personas e instruções de sistema da sua IA.</p>
          </div>
        </div>
        <div className="flex gap-2">
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
        <div className="grid gap-6">
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
                      {prompt.isGlobal && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">GLOBAL</Badge>}
                      {!isOwner && <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-6">
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
        </div>
      )}
    </div>
  );
}