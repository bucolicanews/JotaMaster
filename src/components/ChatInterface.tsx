import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Wrench, Trash2, Sparkles, Terminal, MessageSquareQuote, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, sendChatMessage, fetchDbPrompts, fetchDbAgents } from '@/lib/geminiService';
import { DynamicSkill, fetchDbSkills } from '@/lib/skills/taxSkills';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ChatSidebar, ChatSession } from './ChatSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'jota-chat-sessions';

export const ChatInterface = () => {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Listas de Itens para Gatilhos
  const [availableSkills, setAvailableSkills] = useState<DynamicSkill[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [installedModuleIds, setInstalledModuleIds] = useState<string[]>([]);

  const [isManuallyResized, setIsManuallyResized] = useState(false);
  
  // Menu de Menção (@, #, /)
  const [mentionMenu, setMentionMenu] = useState<{ type: 'skill' | 'agent' | 'prompt', filter: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastHeightRef = useRef<number>(0);

  const apiKey = localStorage.getItem('jota-gemini-key') || '';

  useEffect(() => {
    const loadInitialData = async () => {
      if (!session?.user) return;

      // 1. Verifica Módulos Instalados
      const { data: inst } = await supabase.from('installed_modules').select('module_id').eq('user_id', session.user.id).eq('is_active', true);
      const modIds = (inst || []).map(m => m.module_id);
      setInstalledModuleIds(modIds);

      // 2. Busca Itens (Skills e Agentes dependem de módulos, Prompts são grátis)
      const [skills, agents, prompts] = await Promise.all([
        fetchDbSkills(session.user.id),
        fetchDbAgents(session.user.id),
        fetchDbPrompts(session.user.id)
      ]);

      setAvailableSkills(skills.filter(s => s.isActive));
      setAvailableAgents(agents);
      setAvailablePrompts(prompts.filter(p => p.isActive));

      // 3. Carrega Sessões
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          loadSession(parsed[0].id);
        } else {
          createNewChat();
        }
      } else {
        createNewChat();
      }

      // 4. Verifica se veio da Home com prompt inicial
      const initialPrompt = sessionStorage.getItem('jota-initial-prompt');
      if (initialPrompt) {
        setInput(initialPrompt);
        sessionStorage.removeItem('jota-initial-prompt');
      }
    };

    loadInitialData();
  }, [session]);

  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      localStorage.setItem(`jota-chat-msg-${activeSessionId}`, JSON.stringify(messages));
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId && s.title === 'Nova Conversa' && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            const text = firstUserMsg.parts[0].text;
            return { ...s, title: text.substring(0, 40) + (text.length > 40 ? '...' : '') };
          }
        }
        return s;
      }));
    }
  }, [messages, activeSessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: 'Nova Conversa', createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
  };

  const loadSession = (id: string) => {
    setActiveSessionId(id);
    const savedMsgs = localStorage.getItem(`jota-chat-msg-${id}`);
    setMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
  };

  const deleteSession = (id: string) => {
    if (!confirm("Excluir esta conversa?")) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    localStorage.removeItem(`jota-chat-msg-${id}`);
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) loadSession(remaining[0].id);
      else createNewChat();
    }
  };

  const updateSessionTitle = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  useLayoutEffect(() => {
    if (inputRef.current && !isManuallyResized) {
      inputRef.current.style.height = 'inherit';
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.max(44, Math.min(scrollHeight, 600));
      inputRef.current.style.height = `${newHeight}px`;
      lastHeightRef.current = newHeight;
    }
  }, [input, isManuallyResized]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, activeTool]);

  // Lógica de Gatilhos
  const getFilteredItems = () => {
    if (!mentionMenu) return [];
    const filter = mentionMenu.filter.toLowerCase();
    
    if (mentionMenu.type === 'skill') {
      return availableSkills.filter(s => s.name.toLowerCase().includes(filter));
    } else if (mentionMenu.type === 'agent') {
      return availableAgents.filter(a => a.nome.toLowerCase().includes(filter));
    } else {
      return availablePrompts.filter(p => p.title.toLowerCase().includes(filter));
    }
  };

  const filteredItems = getFilteredItems();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setInput(value);

    const textBefore = value.substring(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');
    const lastHash = textBefore.lastIndexOf('#');
    const lastSlash = textBefore.lastIndexOf('/');
    
    const lastTrigger = Math.max(lastAt, lastHash, lastSlash);

    if (lastTrigger !== -1) {
      const charBefore = textBefore[lastTrigger - 1];
      if (lastTrigger === 0 || charBefore === ' ' || charBefore === '\n') {
        const query = textBefore.substring(lastTrigger + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          let type: any = 'skill';
          if (lastTrigger === lastHash) type = 'agent';
          if (lastTrigger === lastSlash) type = 'prompt';
          
          setMentionMenu({ type, filter: query });
          setSelectedIndex(0);
          return;
        }
      }
    }
    setMentionMenu(null);
  };

  const insertItem = (item: any) => {
    const cursor = inputRef.current?.selectionStart || 0;
    const textBefore = input.substring(0, cursor);
    const textAfter = input.substring(cursor);
    const lastTrigger = Math.max(textBefore.lastIndexOf('@'), textBefore.lastIndexOf('#'), textBefore.lastIndexOf('/'));
    
    const prefix = mentionMenu?.type === 'skill' ? '@' : mentionMenu?.type === 'agent' ? '#' : '/';
    const name = item.name || item.nome || item.title;
    
    const newValue = input.substring(0, lastTrigger) + `${prefix}${name} ` + textAfter;
    setInput(newValue);
    setMentionMenu(null);
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = lastTrigger + name.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionMenu && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % filteredItems.length); } 
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length); } 
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertItem(filteredItems[selectedIndex]); } 
      else if (e.key === 'Escape') { setMentionMenu(null); }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) return toast.error("Configure sua Gemini API Key.");

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setActiveTool(null);

    try {
      // Filtra Skills e Agentes baseado no modo grátis (módulos instalados)
      const hasSkillsModule = installedModuleIds.includes('skills');
      const hasAgentsModule = installedModuleIds.includes('agents');
      
      const allowedSkills = hasSkillsModule ? availableSkills : [];

      const responseText = await sendChatMessage(newHistory, apiKey, allowedSkills, (toolName) => {
        setActiveTool(toolName);
      });
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error: any) {
      toast.error("Erro no chat: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  return (
    <Card className="flex h-[calc(100vh-200px)] shadow-elegant border-primary/20 relative overflow-hidden">
      <ChatSidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={loadSession} onNewChat={createNewChat} onDeleteSession={deleteSession} onUpdateTitle={updateSessionTitle} />

      <div className="flex-1 flex flex-col bg-background min-w-0">
        <CardHeader className="border-b border-border/50 bg-muted/20 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-primary/10 rounded-full shrink-0"><Bot className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold truncate">{sessions.find(s => s.id === activeSessionId)?.title || 'Consultor JOTA AI'}</CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {installedModuleIds.includes('skills') ? 'Modo Premium Ativo' : 'Modo Grátis (Apenas Prompts)'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col relative">
          <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                  <Sparkles className="h-12 w-12 text-primary" />
                  <div>
                    <p className="font-bold">Inicie uma conversa técnica</p>
                    <p className="text-xs">Use <span className="font-bold">/</span> para personas, <span className="font-bold">@</span> para ferramentas ou <span className="font-bold">#</span> para agentes.</p>
                  </div>
                </div>
              )}

              {messages.filter(m => m.role !== 'function').map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border")}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border rounded-tl-none")}>
                    <div className="prose prose-sm prose-invert max-w-none break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown></div>
                  </div>
                </div>
              ))}

              {activeTool && (
                <div className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><Wrench className="h-4 w-4 text-emerald-500" /></div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-2 text-[10px] font-mono text-emerald-600">Executando: <span className="font-bold">{activeTool}</span>...</div>
                </div>
              )}

              {isLoading && !activeTool && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border"><Bot className="h-4 w-4 text-primary animate-bounce" /></div>
                  <div className="bg-muted/30 rounded-2xl px-4 py-2 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Processando...</span></div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border/50 bg-muted/10 relative overflow-visible">
            {mentionMenu && filteredItems.length > 0 && (
              <div className="absolute bottom-full left-4 mb-2 w-72 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
                <div className="bg-muted/80 px-3 py-2 border-b border-border flex items-center gap-2">
                  {mentionMenu.type === 'skill' ? <Wrench className="h-3 w-3 text-emerald-500" /> : mentionMenu.type === 'agent' ? <Zap className="h-3 w-3 text-primary" /> : <MessageSquareQuote className="h-3 w-3 text-blue-500" />}
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {mentionMenu.type === 'skill' ? 'Habilidades' : mentionMenu.type === 'agent' ? 'Agentes' : 'Prompts'}
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredItems.map((item, idx) => (
                    <div key={idx} className={cn("px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors", idx === selectedIndex ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/30 border-l-4 border-transparent")} onClick={() => insertItem(item)}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{item.name || item.nome || item.title}</span>
                        <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">{mentionMenu.type}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description || item.role || 'Sem descrição'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto flex items-end gap-2">
              <Textarea ref={inputRef} placeholder="Digite sua dúvida... use / para prompts, @ para skills ou # para agentes." value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} className="flex-1 bg-background min-h-[44px] max-h-[600px] resize-y py-3 px-4 text-base overflow-y-auto" disabled={isLoading} autoComplete="off" rows={1} />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 h-11 w-11 p-0 shrink-0 mb-0.5">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};