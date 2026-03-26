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
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do Worker do PDF.js usando CDN para evitar erros de compilação no Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function Skills() {
  const { session, isAdmin } = useAuth();
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState<string | null>(null);
  
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
      userId: session?.user.id,
      isGlobal: false
    };
    setDynamicSkills([newSkill, ...dynamicSkills]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta ferramenta?")) return;
    
    setDynamicSkills(prev => prev.filter(s => s.id !== id));
    
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

  // RESTAURAÇÃO: Motor de extração de arquivos (PDF, Excel, TXT)
  const handleKnowledgeFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, skillId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(skillId);
    try {
      let extractedText = '';

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
        }
      } else if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          extractedText += `--- Planilha: ${sheetName} ---\n${XLSX.utils.sheet_to_csv(sheet)}\n\n`;
        });
      } else {
        extractedText = await file.text(); // Fallback para TXT/JSON
      }

      updateSkill(skillId, 'knowledgeBaseText', extractedText);
      toast.success("Conteúdo extraído com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao extrair arquivo: " + err.message);
    } finally {
      setIsUploadingFile(null);
      event.target.value = ''; // Reseta o input
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      <input type="file" ref={importRef} className="hidden" accept=".json" onChange={handleImport} />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-6 gap-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
            <Wrench className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">Skills e Ferramentas</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Importe ou crie novas habilidades para sua IA.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="h-10 text-xs" onClick={() => importRef.current?.click()}>
            <FileJson className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Importar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 text-xs border-primary/20 text-primary hover:bg-primary/10" onClick={addSkill}>
            <Plus className="h-4 w-4 mr-2 shrink-0" /> <span className="truncate">Nova Skill</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md col-span-2 sm:col-span-1">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" /> : <Save className="h-4 w-4 mr-2 shrink-0" />} <span className="truncate">Salvar Alterações</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Carregando ferramentas...</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-3">
          {dynamicSkills.map((skill) => {
            const isOwner = !skill.userId || skill.userId === session?.user.id;
            const canEdit = isOwner || isAdmin;

            return (
              <AccordionItem key={skill.id} value={skill.id} className="border rounded-xl bg-card px-3 md:px-4 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 w-full pr-4">
                    <div className={cn("shrink-0", skill.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                      {skill.executionType === 'webhook' ? <Globe className="h-5 w-5" /> : 
                       skill.executionType === 'local_js' ? <Code className="h-5 w-5" /> : 
                       skill.executionType === 'web_scraping' ? <Search className="h-5 w-5" /> : 
                       <Book className="h-5 w-5" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{skill.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block truncate">
                        {skill.executionType === 'knowledge_base' ? 'BASE DE CONHECIMENTO' : skill.executionType.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0 hidden sm:flex">
                      {skill.isGlobal && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px]">
                          {isAdmin ? 'GLOBAL' : 'GLOBAL (ADMIN)'}
                        </Badge>
                      )}
                      {!isOwner && !skill.isGlobal && (
                        <Badge variant="outline" className="text-[8px]">COMUNIDADE</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-6">
                  
                  {!canEdit && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-4 text-xs text-amber-700 font-medium">
                      Esta é uma ferramenta oficial fornecida pelo sistema. Você não pode editar ou excluir suas configurações.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Técnico (ID)</Label>
                      <Input value={skill.name} disabled={!canEdit || !!skill.moduleId} onChange={e => updateSkill(skill.id, 'name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Execução</Label>
                      <Select value={skill.executionType} disabled={!canEdit || !!skill.moduleId} onValueChange={v => updateSkill(skill.id, 'executionType', v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_js">JavaScript Local</SelectItem>
                          <SelectItem value="webhook">Webhook (n8n)</SelectItem>
                          <SelectItem value="knowledge_base">Base de Conhecimento (Textos/PDFs)</SelectItem>
                          <SelectItem value="web_scraping">Navegação Web (Scraping)</SelectItem>
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

                  {/* RESTAURAÇÃO: Blocos Condicionais de Configuração por Tipo */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parâmetros JSON (Schema)</Label>
                      <Textarea 
                        className="font-mono text-[10px] h-40 bg-slate-900 text-blue-300" 
                        disabled={!canEdit} 
                        value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} 
                        onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} 
                      />
                    </div>

                    {/* BLOCO: JavaScript Local */}
                    {skill.executionType === 'local_js' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label className="text-emerald-600 font-bold">Código JavaScript (Async)</Label>
                        <Textarea 
                          className="font-mono text-[11px] h-40 bg-slate-950 text-emerald-400" 
                          disabled={!canEdit} 
                          value={skill.jsCode || ''} 
                          onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} 
                        />
                      </div>
                    )}

                    {/* BLOCO: Webhook */}
                    {skill.executionType === 'webhook' && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label className="text-blue-600 font-bold">URL do Webhook (n8n, Make, Zapier)</Label>
                        <Input 
                          className="bg-blue-500/5 border-blue-500/20"
                          disabled={!canEdit} 
                          value={skill.webhookUrl || ''} 
                          onChange={e => updateSkill(skill.id, 'webhookUrl', e.target.value)} 
                          placeholder="https://n8n.seu-servidor.com/webhook/..." 
                        />
                      </div>
                    )}

                    {/* BLOCO: Web Scraping */}
                    {skill.executionType === 'web_scraping' && (
                      <div className="space-y-4 animate-in fade-in duration-300 bg-orange-500/5 p-4 rounded-lg border border-orange-500/20">
                        <div className="space-y-2">
                          <Label className="text-orange-600 font-bold">URL Alvo (Site a ser lido)</Label>
                          <Input 
                            disabled={!canEdit} 
                            value={skill.url || ''} 
                            onChange={e => updateSkill(skill.id, 'url', e.target.value)} 
                            placeholder="https://..." 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-orange-600 font-bold">Seletor CSS (Opcional)</Label>
                          <Input 
                            disabled={!canEdit} 
                            value={skill.selector || ''} 
                            onChange={e => updateSkill(skill.id, 'selector', e.target.value)} 
                            placeholder="ex: .article-content, #main-table" 
                          />
                        </div>
                      </div>
                    )}

                    {/* BLOCO: Base de Conhecimento (Textos, PDFs, Excel) */}
                    {skill.executionType === 'knowledge_base' && (
                      <div className="space-y-2 flex flex-col h-full animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                          <Label className="text-purple-600 font-bold">Base de Conhecimento (Texto Bruto)</Label>
                          <div className="relative">
                            <input 
                              type="file" 
                              id={`file-${skill.id}`} 
                              className="hidden" 
                              accept=".txt,.csv,.pdf,.xlsx,.xls" 
                              onChange={(e) => handleKnowledgeFileUpload(e, skill.id)} 
                              disabled={!canEdit || isUploadingFile === skill.id} 
                            />
                            <Label htmlFor={`file-${skill.id}`} className={cn("cursor-pointer", (!canEdit || isUploadingFile === skill.id) && "pointer-events-none opacity-50")}>
                              <div className="flex items-center gap-2 bg-purple-500/10 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-500/20 transition-colors text-[10px] font-bold uppercase">
                                {isUploadingFile === skill.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                {isUploadingFile === skill.id ? 'Extraindo...' : 'Importar Arquivo'}
                              </div>
                            </Label>
                          </div>
                        </div>
                        <Textarea 
                          className="font-mono text-[11px] flex-1 min-h-[160px] bg-slate-950 text-purple-300 border-purple-500/30" 
                          disabled={!canEdit} 
                          value={skill.knowledgeBaseText || ''} 
                          onChange={e => updateSkill(skill.id, 'knowledgeBaseText', e.target.value)} 
                          placeholder="Cole manuais, tabelas ou textos longos aqui. Ou clique em Importar Arquivo para extrair dados de um PDF ou Excel automaticamente..." 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-4 border-t border-border/50 gap-4">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto text-emerald-600 border-emerald-200" onClick={() => executeSkill(skill.name, {}, dynamicSkills)}>
                        <Play className="h-4 w-4 mr-2" /> Testar Agora
                      </Button>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-md border border-amber-500/10 w-full sm:w-auto justify-between sm:justify-start">
                          <Switch checked={skill.isGlobal || false} onCheckedChange={v => updateSkill(skill.id, 'isGlobal', v)} />
                          <Label className="text-amber-700 font-bold text-[10px] uppercase">Global</Label>
                        </div>
                      )}
                    </div>
                    
                    {canEdit && !skill.moduleId && (
                      <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={() => handleDelete(skill.id)}>
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