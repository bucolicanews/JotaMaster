import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Wrench, Trash2, Sparkles, Terminal, MessageSquareQuote, Zap, Globe, Search, Plus, MessageSquare } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const STORAGE_KEY = 'jota-chat-sessions';

export const ChatInterface = () => {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isGroundingActive, setIsGroundingActive] = useState(() => localStorage.getItem('jota-gemini-search') === 'true');
  
  const [availableSkills, setAvailableSkills] = useState<DynamicSkill[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [installedModuleIds, setInstalledModuleIds] = useState<string[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  // Estado para controlar a abertura do histórico no mobile
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isManuallyResized, setIsManuallyResized] = useState(false);
  const [mentionMenu, setMentionMenu] = useState<{ type: 'skill' | 'agent' | 'prompt', filter: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const apiKey = localStorage.getItem('jota-gemini-key') || '';

  useEffect(() => {
    const loadInitialData = async () => {
      if (!session?.user) return;
      const { data: inst } = await supabase.from('installed_modules').select('module_id').eq('user_id', session.user.id).eq('is_active', true);
      setInstalledModuleIds((inst || []).map(m => m.module_id));
      const [skills, agents, prompts] = await Promise.all([
        fetchDbSkills(session.user.id),
        fetchDbAgents(session.user.id),
        fetchDbPrompts(session.user.id)
      ]);
      setAvailableSkills(skills.filter(s => s.isActive));
      setAvailableAgents(agents);
      setAvailablePrompts(prompts.filter(p => p.isActive));
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          const lastSessionId = parsed[0].id;
          setActiveSessionId(lastSessionId);
          const savedMsgs = localStorage.getItem(`jota-chat-msg-${lastSessionId}`);
          setMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
        } else { createNewChat(); }
      } else { createNewChat(); }
      const initialPrompt = sessionStorage.getItem('jota-initial-prompt');
      if (initialPrompt) { setInput(initialPrompt); sessionStorage.removeItem('jota-initial-prompt'); }
    };
    loadInitialData();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!activeSessionId) return;
    localStorage.setItem(`jota-chat-msg-${activeSessionId}`, JSON.stringify(messages));
    if (messages.length > 0) {
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
        if (sessionIndex !== -1 && (prev[sessionIndex].title === 'Nova Conversa' || prev[sessionIndex].title === '')) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            const newTitle = firstUserMsg.parts[0].text.substring(0, 40) + (firstUserMsg.parts[0].text.length > 40 ? '...' : '');
            const newSessions = [...prev];
            newSessions[sessionIndex] = { ...newSessions[sessionIndex], title: newTitle };
            return newSessions;
          }
        }
        return prev;
      });
    }
  }, [messages, activeSessionId]);

  useEffect(() => {
    if (sessions.length > 0) { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
  }, [sessions]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: 'Nova Conversa', createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
    setActivePersonaId(null);
    setIsHistoryOpen(false); // Fecha a gaveta no mobile
  };

  const loadSession = (id: string) => {
    setActiveSessionId(id);
    const savedMsgs = localStorage.getItem(`jota-chat-msg-${id}`);
    setMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
    setActivePersonaId(null);
    setIsHistoryOpen(false); // Fecha a gaveta no mobile
  };

  const deleteSession = (id: string) => {
    if (!confirm("Excluir esta conversa?")) return;
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    localStorage.removeItem(`jota-chat-msg-${id}`);
    if (activeSessionId === id) {
      if (newSessions.length > 0) loadSession(newSessions[0].id);
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
      inputRef.current.style.height = `${Math.max(44, Math.min(scrollHeight, 150))}px`;
    }
  }, [input, isManuallyResized]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
    }
  };

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, activeTool]);

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
    if (mentionMenu?.type === 'agent' || mentionMenu?.type === 'prompt') {
      setActivePersonaId(item.id);
      toast.info(`Persona alterada para: ${name}`);
    }
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
    if (!apiKey) return toast.error("Configure sua Gemini API Key no seu Perfil.");
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setActiveTool(null);
    try {
      const hasSkillsModule = installedModuleIds.includes('skills');
      const allowedSkills = hasSkillsModule ? availableSkills : [];
      let overridePrompt = undefined;
      if (activePersonaId) {
        const agent = availableAgents.find(a => a.id === activePersonaId);
        const prompt = availablePrompts.find(p => p.id === activePersonaId);
        if (agent) overridePrompt = agent.systemPrompt;
        else if (prompt) overridePrompt = prompt.content;
      }
      const responseText = await sendChatMessage(newHistory, apiKey, allowedSkills, (toolName) => setActiveTool(toolName), isGroundingActive, overridePrompt);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error: any) {
      toast.error("Erro no chat: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  const filteredItems = mentionMenu ? (mentionMenu.type === 'skill' ? availableSkills.filter(s => s.name.toLowerCase().includes(mentionMenu.filter.toLowerCase())) : mentionMenu.type === 'agent' ? availableAgents.filter(a => a.nome.toLowerCase().includes(mentionMenu.filter.toLowerCase())) : availablePrompts.filter(p => p.title.toLowerCase().includes(mentionMenu.filter.toLowerCase()))) : [];

  const activePersonaName = activePersonaId ? (availableAgents.find(a => a.id === activePersonaId)?.nome || availablePrompts.find(p => p.id === activePersonaId)?.title || 'Consultor JOTA AI') : 'Consultor JOTA AI';

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden bg-background">
      <Card className="flex flex-col md:flex-row flex-1 shadow-elegant border-primary/20 overflow-hidden rounded-none md:rounded-xl">
        
        <div className="hidden md:block w-64 border-r border-border shrink-0 bg-muted/5">
          <ChatSidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={loadSession} onNewChat={createNewChat} onDeleteSession={deleteSession} onUpdateTitle={updateSessionTitle} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <CardHeader className="border-b border-border/50 bg-muted/20 py-2 px-4 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* BOTÃO HISTÓRICO MOBILE */}
                <div className="md:hidden">
                  <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80 border-r border-border">
                      <SheetTitle className="sr-only">Histórico de Conversas</SheetTitle>
                      <ChatSidebar 
                        sessions={sessions} 
                        activeSessionId={activeSessionId} 
                        onSelectSession={loadSession} 
                        onNewChat={createNewChat} 
                        onDeleteSession={deleteSession} 
                        onUpdateTitle={updateSessionTitle} 
                      />
                    </SheetContent>
                  </Sheet>
                </div>

                <div className="p-1.5 bg-primary/10 rounded-full shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0">
                  <CardTitle className="text-xs font-bold truncate">{sessions.find(s => s.id === activeSessionId)?.title || 'Nova Conversa'}</CardTitle>
                  <p className="text-[9px] text-muted-foreground truncate font-bold text-primary uppercase">{activePersonaName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* BOTÃO NOVA CONVERSA RÁPIDO */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={createNewChat}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                  title="Nova Conversa"
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-full border border-border/50 shrink-0">
                  <Globe className={cn("h-3 w-3", isGroundingActive ? "text-blue-500" : "text-muted-foreground")} />
                  <Switch className="scale-75" checked={isGroundingActive} onCheckedChange={(v) => { setIsGroundingActive(v); localStorage.setItem('jota-gemini-search', v.toString()); }} />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
              <div className="p-4 space-y-6 max-w-3xl mx-auto">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-30">
                    <Sparkles className="h-12 w-12 text-primary" />
                    <p className="text-sm font-bold">Como posso ajudar hoje?</p>
                  </div>
                )}
                {messages.filter(m => m.role !== 'function').map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border")}>
                      {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border rounded-tl-none")}>
                      <div className="prose prose-sm prose-invert max-w-none break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown></div>
                    </div>
                  </div>
                ))}
                {activeTool && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0"><Wrench className="h-3.5 w-3.5 text-emerald-500" /></div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-[10px] font-mono text-emerald-600">Executando: {activeTool}...</div>
                  </div>
                )}
                {isLoading && !activeTool && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border border-border shrink-0"><Bot className="h-3.5 w-3.5 text-primary animate-bounce" /></div>
                    <div className="bg-muted/30 rounded-xl px-3 py-1.5 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Pensando...</span></div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/50 bg-muted/10 shrink-0">
              {mentionMenu && filteredItems.length > 0 && (
                <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto sm:w-72 mb-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[100]">
                  <div className="bg-muted/80 px-3 py-1.5 border-b border-border flex items-center gap-2">
                    <Terminal className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Sugestões</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredItems.map((item, idx) => (
                      <div key={idx} className={cn("px-3 py-2 cursor-pointer flex flex-col gap-0.5 border-l-4", idx === selectedIndex ? "bg-primary/10 border-primary" : "hover:bg-muted/30 border-transparent")} onClick={() => insertItem(item)}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground truncate">{item.name || item.nome || item.title}</span>
                          <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">{mentionMenu.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-w-3xl mx-auto flex items-end gap-2">
                <Textarea ref={inputRef} placeholder="Digite sua dúvida..." value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} className="flex-1 bg-background min-h-[44px] max-h-[120px] resize-none py-3 px-4 text-sm overflow-y-auto rounded-xl border-border/50 focus-visible:ring-primary/30" disabled={isLoading} rows={1} />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 h-11 w-11 rounded-xl p-0 shrink-0 mb-0.5 shadow-lg active:scale-95 transition-transform">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};