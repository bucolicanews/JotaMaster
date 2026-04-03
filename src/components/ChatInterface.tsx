import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Wrench, Sparkles, MessageSquareQuote, Zap, Globe, Plus, MessageSquare, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, sendChatMessage, fetchDbPrompts, fetchDbAgents } from '@/lib/geminiService';
import { DynamicSkill, fetchDbSkills } from '@/lib/skills/taxSkills';
import { OLLAMA_MODELS, OllamaMessage, OllamaConfig, getOllamaConfig, getUserCredits, sendOllamaMessage, debitOllamaCredits } from '@/lib/ollamaService';
import { VERTEX_MODELS, VertexConfig, getVertexConfig, getUserCreditsVertex, sendVertexMessage, debitVertexCredits } from '@/lib/vertexService';
import { DEEPSEEK_MODELS, DeepSeekMessage, DeepSeekConfig, getDeepSeekConfig, getUserCreditsDeepSeek, sendDeepSeekMessage, debitDeepSeekCredits } from '@/lib/deepseekService';
import { GROQ_MODELS, GroqMessage, GroqConfig, getGroqConfig, getUserCreditsGroq, sendGroqMessage, debitGroqCredits } from '@/lib/groqService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ChatSidebar, ChatSession } from './ChatSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ChatInterface = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isManuallyResized] = useState(false);
  const [mentionMenu, setMentionMenu] = useState<{ type: 'skill' | 'agent' | 'prompt', filter: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [apiKey, setApiKey] = useState<string | undefined>();
  const [chatProvider, setChatProvider] = useState<'gemini' | 'ollama' | 'vertex' | 'deepseek' | 'groq'>('gemini');
  const [ollamaModel, setOllamaModel] = useState('llama');
  const [vertexModel, setVertexModel] = useState('gemini-2.0-flash');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig | null>(null);
  const [vertexConfig, setVertexConfig] = useState<VertexConfig | null>(null);
  const [deepseekConfig, setDeepseekConfig] = useState<DeepSeekConfig | null>(null);
  const [groqConfig, setGroqConfig] = useState<GroqConfig | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [lastUserInput, setLastUserInput] = useState<string>('');

  useEffect(() => {
    const loadInitialData = async () => {
      if (!session?.user) return;

      const { data: inst } = await supabase
        .from('installed_modules')
        .select('module_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      setInstalledModuleIds((inst || []).map((m: any) => m.module_id));

      const { data: profileData } = await supabase
        .from('profiles')
        .select('api_key')
        .eq('id', session.user.id)
        .single();
      if (profileData?.api_key) setApiKey(profileData.api_key);

      const cfg = await getOllamaConfig();
      setOllamaConfig(cfg);

      const vcfg = await getVertexConfig();
      setVertexConfig(vcfg);

      const dcfg = await getDeepSeekConfig();
      setDeepseekConfig(dcfg);

      const gcfg = await getGroqConfig();
      setGroqConfig(gcfg);

      if (session.user.id) {
        const credits = await getUserCredits(session.user.id);
        setUserCredits(credits);
      }

      const [skills, agents, prompts] = await Promise.all([
        fetchDbSkills(session.user.id),
        fetchDbAgents(session.user.id),
        fetchDbPrompts(session.user.id),
      ]);
      setAvailableSkills(skills.filter((s: any) => s.isActive));
      setAvailableAgents(agents);
      setAvailablePrompts(prompts.filter((p: any) => p.isActive));

      await loadSessions(session.user.id);

      const initialPrompt = sessionStorage.getItem('jota-initial-prompt');
      if (initialPrompt) {
        setInput(initialPrompt);
        sessionStorage.removeItem('jota-initial-prompt');
      }
    };
    loadInitialData();
  }, [session?.user?.id]);

  const loadSessions = async (uid: string) => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      const mapped: ChatSession[] = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        createdAt: new Date(s.created_at).getTime(),
      }));
      setSessions(mapped);
      setActiveSessionId(mapped[0].id);
      await loadMessages(mapped[0].id);
    } else {
      await createNewChat(uid);
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map((m: any) => ({ role: m.role as any, parts: [{ text: m.content }] })));
    } else {
      setMessages([]);
    }
  };

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    if (!userId) return;
    await supabase.from('chat_messages').insert({ session_id: sessionId, user_id: userId, role, content });
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  };

  const createNewChat = async (uid?: string) => {
    const ownerId = uid || userId;
    if (!ownerId) return;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: ownerId, title: 'Nova Conversa' })
      .select('id, title, created_at')
      .single();

    if (error || !data) { toast.error('Erro ao criar conversa.'); return; }

    const newSession: ChatSession = {
      id: data.id,
      title: data.title,
      createdAt: new Date(data.created_at).getTime(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(data.id);
    setMessages([]);
    setActivePersonaId(null);
    setIsHistoryOpen(false);
  };

  const loadSession = async (id: string) => {
    setActiveSessionId(id);
    setActivePersonaId(null);
    setIsHistoryOpen(false);
    await loadMessages(id);
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Excluir esta conversa?')) return;
    await supabase.from('chat_sessions').delete().eq('id', id);
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      if (newSessions.length > 0) await loadSession(newSessions[0].id);
      else await createNewChat();
    }
  };

  const updateSessionTitle = async (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', id);
  };

  const autoUpdateTitle = async (sessionId: string, firstUserText: string) => {
    const current = sessions.find(s => s.id === sessionId);
    if (!current || (current.title !== 'Nova Conversa' && current.title !== '')) return;
    const newTitle = firstUserText.substring(0, 40) + (firstUserText.length > 40 ? '...' : '');
    await updateSessionTitle(sessionId, newTitle);
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
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
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
    if (!input.trim() || isLoading || !activeSessionId) return;
    if (chatProvider === 'gemini' && !apiKey) return toast.error('Configure sua Gemini API Key no seu Perfil.');

    if (chatProvider === 'ollama') {
      if (!userId) return;
      const credits = await getUserCredits(userId);
      if (credits <= 0) return toast.error('Créditos insuficientes. Adquira créditos para continuar.');
    }

    if (chatProvider === 'vertex') {
      if (!userId) return;
      const credits = await getUserCreditsVertex(userId);
      if (credits <= 0) return toast.error('Créditos insuficientes. Adquira créditos para continuar.');
    }

    if (chatProvider === 'deepseek') {
      if (!userId) return;
      const credits = await getUserCreditsDeepSeek(userId);
      if (credits <= 0) return toast.error('Créditos insuficientes. Adquira créditos para continuar.');
    }

    if (chatProvider === 'groq') {
      if (!userId) return;
      const credits = await getUserCreditsGroq(userId);
      if (credits <= 0) return toast.error('Créditos insuficientes. Adquira créditos para continuar.');
    }

    const userText = input;
    setLastUserInput(userText);
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setActiveTool(null);

    await saveMessage(activeSessionId, 'user', userText);
    await autoUpdateTitle(activeSessionId, userText);

    try {
      let responseText = '';

      if (chatProvider === 'ollama') {
        let systemPrompt: string | undefined;
        if (activePersonaId) {
          const agent = availableAgents.find((a: any) => a.id === activePersonaId);
          const prompt = availablePrompts.find((p: any) => p.id === activePersonaId);
          if (agent) systemPrompt = agent.systemPrompt;
          else if (prompt) systemPrompt = prompt.content;
        }

        const hasSkillsModule = installedModuleIds.includes('skills');
        const allowedSkills = hasSkillsModule ? availableSkills : [];

        const ollamaHistory: OllamaMessage[] = newHistory
          .filter(m => m.role === 'user' || m.role === 'model')
          .map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
          }));

        const result = await sendOllamaMessage(
          ollamaHistory,
          ollamaModel,
          ollamaConfig?.illama_api_key || '',
          allowedSkills,
          systemPrompt,
          (toolName) => setActiveTool(toolName)
        );

        responseText = result.text;

        if (ollamaConfig) {
          try {
            const debited = await debitOllamaCredits(userId!, result.inputTokens, result.outputTokens, ollamaConfig, ollamaModel);
            if (debited > 0) {
              const newBalance = await getUserCredits(userId!);
              setUserCredits(newBalance);
              toast.info(`${debited.toFixed(2)} crédito${debited !== 1 ? 's' : ''} descontado${debited !== 1 ? 's' : ''}.`, { duration: 2000 });
            }
          } catch (debitErr: any) {
            toast.warning('Aviso: ' + debitErr.message);
          }
        }
      } else if (chatProvider === 'vertex') {
        let systemPrompt: string | undefined;
        if (activePersonaId) {
          const agent = availableAgents.find((a: any) => a.id === activePersonaId);
          const prompt = availablePrompts.find((p: any) => p.id === activePersonaId);
          if (agent) systemPrompt = agent.systemPrompt;
          else if (prompt) systemPrompt = prompt.content;
        }

        const hasSkillsModule = installedModuleIds.includes('skills');
        const allowedSkills = hasSkillsModule ? availableSkills : [];

        const freshVertexConfig = await getVertexConfig();
        const vertexApiKey = freshVertexConfig.vertex_api_key;

        console.log('[ChatInterface] vertex_api_key presente:', !!vertexApiKey, 'length:', vertexApiKey?.length);

        const result = await sendVertexMessage(
          newHistory,
          vertexModel,
          vertexApiKey,
          allowedSkills,
          systemPrompt,
          isGroundingActive,
          (toolName) => setActiveTool(toolName)
        );

        responseText = result.text;

        if (userId) {
          try {
            const debited = await debitVertexCredits(userId, result.inputTokens, result.outputTokens, freshVertexConfig, vertexModel);
            if (debited > 0) {
              const newBalance = await getUserCreditsVertex(userId);
              setUserCredits(newBalance);
              toast.info(`${debited.toFixed(2)} créditos descontados.`, { duration: 2000 });
            }
          } catch (debitErr: any) {
            toast.warning('Aviso: ' + debitErr.message);
          }
        }
      } else if (chatProvider === 'deepseek') {
        let systemPrompt: string | undefined;
        if (activePersonaId) {
          const agent = availableAgents.find((a: any) => a.id === activePersonaId);
          const prompt = availablePrompts.find((p: any) => p.id === activePersonaId);
          if (agent) systemPrompt = agent.systemPrompt;
          else if (prompt) systemPrompt = prompt.content;
        }

        const hasSkillsModule = installedModuleIds.includes('skills');
        const allowedSkills = hasSkillsModule ? availableSkills : [];

        const freshDeepSeekConfig = await getDeepSeekConfig();

        const deepseekHistory: DeepSeekMessage[] = newHistory
          .filter(m => m.role === 'user' || m.role === 'model')
          .map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
          }));

        const result = await sendDeepSeekMessage(
          deepseekHistory,
          deepseekModel,
          freshDeepSeekConfig.deepseek_api_key,
          allowedSkills,
          systemPrompt,
          (toolName) => setActiveTool(toolName)
        );

        responseText = result.text;

        if (userId) {
          try {
            const debited = await debitDeepSeekCredits(userId, result.inputTokens, result.outputTokens, freshDeepSeekConfig, deepseekModel);
            if (debited > 0) {
              const newBalance = await getUserCreditsDeepSeek(userId);
              setUserCredits(newBalance);
              toast.info(`${debited.toFixed(2)} créditos descontados.`, { duration: 2000 });
            }
          } catch (debitErr: any) {
            toast.warning('Aviso: ' + debitErr.message);
          }
        }
      } else if (chatProvider === 'groq') {
        let systemPrompt: string | undefined;
        if (activePersonaId) {
          const agent = availableAgents.find((a: any) => a.id === activePersonaId);
          const prompt = availablePrompts.find((p: any) => p.id === activePersonaId);
          if (agent) systemPrompt = agent.systemPrompt;
          else if (prompt) systemPrompt = prompt.content;
        }

        const hasSkillsModule = installedModuleIds.includes('skills');
        const allowedSkills = hasSkillsModule ? availableSkills : [];

        const freshGroqConfig = await getGroqConfig();

        const groqHistory: GroqMessage[] = newHistory
          .filter(m => m.role === 'user' || m.role === 'model')
          .map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
          }));

        const result = await sendGroqMessage(
          groqHistory,
          groqModel,
          allowedSkills,
          systemPrompt,
          (toolName) => setActiveTool(toolName)
        );

        responseText = result.text;

        if (userId) {
          try {
            const debited = await debitGroqCredits(userId, result.inputTokens, result.outputTokens, freshGroqConfig, groqModel);
            if (debited > 0) {
              const newBalance = await getUserCreditsGroq(userId);
              setUserCredits(newBalance);
              toast.info(`${debited.toFixed(2)} créditos descontados.`, { duration: 2000 });
            }
          } catch (debitErr: any) {
            toast.warning('Aviso: ' + debitErr.message);
          }
        }
      } else {
        const hasSkillsModule = installedModuleIds.includes('skills');
        const allowedSkills = hasSkillsModule ? availableSkills : [];

        let overridePrompt: string | undefined;
        if (activePersonaId) {
          const agent = availableAgents.find((a: any) => a.id === activePersonaId);
          const prompt = availablePrompts.find((p: any) => p.id === activePersonaId);
          if (agent) overridePrompt = agent.systemPrompt;
          else if (prompt) overridePrompt = prompt.content;
        }

        responseText = await sendChatMessage(
          newHistory,
          apiKey,
          allowedSkills,
          (toolName) => setActiveTool(toolName),
          isGroundingActive,
          overridePrompt
        );
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
      await saveMessage(activeSessionId, 'model', responseText);
    } catch (error: any) {
      toast.error('Erro no chat: ' + error.message);
      setInput(lastUserInput);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  const getFilteredItems = () => {
    if (!mentionMenu) return [];
    const filter = mentionMenu.filter.toLowerCase();
    if (mentionMenu.type === 'skill') return availableSkills.filter((s: any) => s.name.toLowerCase().includes(filter));
    if (mentionMenu.type === 'agent') return availableAgents.filter((a: any) => a.nome.toLowerCase().includes(filter));
    return availablePrompts.filter((p: any) => p.title.toLowerCase().includes(filter));
  };

  const filteredItems = getFilteredItems();

  const activePersonaName = activePersonaId
    ? (availableAgents.find((a: any) => a.id === activePersonaId)?.nome || availablePrompts.find((p: any) => p.id === activePersonaId)?.title || 'Consultor JOTA AI')
    : 'Consultor JOTA AI';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        <div className="hidden md:block w-64 border-r border-border shrink-0 bg-muted/5">
          <ChatSidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={loadSession} onNewChat={createNewChat} onDeleteSession={deleteSession} onUpdateTitle={updateSessionTitle} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-full relative">

          <div className="border-b border-border/50 bg-muted/20 py-2 px-4 shrink-0 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="md:hidden">
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64 border-r border-border">
                    <SheetTitle className="sr-only">Histórico de Conversas</SheetTitle>
                    <ChatSidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={loadSession} onNewChat={createNewChat} onDeleteSession={deleteSession} onUpdateTitle={updateSessionTitle} />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="p-1.5 bg-primary/10 rounded-full shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold truncate">{sessions.find(s => s.id === activeSessionId)?.title || 'Nova Conversa'}</h2>
                <p className="text-[9px] text-muted-foreground truncate font-bold text-primary uppercase">{activePersonaName}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => createNewChat()}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                title="Nova Conversa"
              >
                <Plus className="h-5 w-5" />
              </Button>

              <Select value={chatProvider} onValueChange={(v: 'gemini' | 'ollama' | 'vertex' | 'deepseek' | 'groq') => setChatProvider(v)}>
                <SelectTrigger className="h-8 w-28 text-[11px] border-border/50 bg-background/50 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="vertex">Vertex AI</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>

              {chatProvider === 'vertex' && (
                <Select value={vertexModel} onValueChange={setVertexModel}>
                  <SelectTrigger className="h-8 w-44 text-[11px] border-border/50 bg-background/50 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTEX_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {chatProvider === 'groq' && (
                <Select value={groqModel} onValueChange={setGroqModel}>
                  <SelectTrigger className="h-8 w-44 text-[11px] border-border/50 bg-background/50 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROQ_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {chatProvider === 'deepseek' && (
                <Select value={deepseekModel} onValueChange={setDeepseekModel}>
                  <SelectTrigger className="h-8 w-44 text-[11px] border-border/50 bg-background/50 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEEPSEEK_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {chatProvider === 'ollama' && (
                <Select value={ollamaModel} onValueChange={setOllamaModel}>
                  <SelectTrigger className="h-8 w-36 text-[11px] border-border/50 bg-background/50 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OLLAMA_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(chatProvider === 'ollama' || chatProvider === 'vertex' || chatProvider === 'deepseek' || chatProvider === 'groq') && userCredits !== null && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-bold shrink-0",
                  userCredits <= 5
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  <Coins className="h-3 w-3" />
                  {Number(userCredits ?? 0).toFixed(2)}
                </div>
              )}

              {(chatProvider === 'gemini' || chatProvider === 'vertex') && (
                <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-full border border-border/50 shrink-0">
                  <Globe className={cn("h-3 w-3", isGroundingActive ? "text-blue-500" : "text-muted-foreground")} />
                  <Label htmlFor="grounding-toggle" className="hidden sm:inline-block text-[10px] font-bold uppercase cursor-pointer">Pesquisa Web</Label>
                  <Switch className="scale-75" checked={isGroundingActive} onCheckedChange={(v) => { setIsGroundingActive(v); localStorage.setItem('jota-gemini-search', v.toString()); }} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-0 flex flex-col bg-background">
            <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
              <div className="space-y-6 max-w-4xl mx-auto pb-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-30">
                    <Sparkles className="h-12 w-12 text-primary" />
                    <div>
                      <p className="font-bold">Inicie uma conversa técnica</p>
                      <p className="text-xs">Use <span className="font-bold">/</span> para invocar personas, <span className="font-bold">@</span> para ferramentas ou <span className="font-bold">#</span> para agentes.</p>
                    </div>
                  </div>
                )}

                {messages.filter(m => m.role !== 'function').map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border")}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border border-border rounded-tl-none")}>
                      <div className="prose prose-sm prose-invert max-w-none break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown></div>
                    </div>
                  </div>
                ))}

                {activeTool && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0"><Wrench className="h-4 w-4 text-emerald-500" /></div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-2 text-[10px] font-mono text-emerald-600 break-words">Executando: <span className="font-bold">{activeTool}</span>...</div>
                  </div>
                )}

                {isLoading && !activeTool && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0"><Bot className="h-4 w-4 text-primary animate-bounce" /></div>
                    <div className="bg-muted/30 rounded-2xl px-4 py-2 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Processando...</span></div>
                  </div>
                )}

                {!isLoading && input === lastUserInput && lastUserInput !== '' && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleSend()}
                    >
                      <Send className="h-3 w-3" />
                      Reenviar mensagem
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/10 shrink-0 relative overflow-visible">
              {mentionMenu && filteredItems.length > 0 && (
                <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto sm:w-72 mb-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
                  <div className="bg-muted/80 px-3 py-2 border-b border-border flex items-center gap-2">
                    {mentionMenu.type === 'skill' ? <Wrench className="h-3 w-3 text-emerald-500" /> : mentionMenu.type === 'agent' ? <Zap className="h-3 w-3 text-primary" /> : <MessageSquareQuote className="h-3 w-3 text-blue-500" />}
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {mentionMenu.type === 'skill' ? 'Habilidades' : mentionMenu.type === 'agent' ? 'Agentes' : 'Prompts'}
                    </span>
                  </div>
                  <div className="max-h-48 sm:max-h-60 overflow-y-auto">
                    {filteredItems.map((item, idx) => (
                      <div key={idx} className={cn("px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors", idx === selectedIndex ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/30 border-l-4 border-transparent")} onClick={() => insertItem(item)}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground truncate max-w-[70%]">{item.name || item.nome || item.title}</span>
                          <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50 shrink-0">{mentionMenu.type}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description || item.role || 'Sem descrição'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-w-4xl mx-auto flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  placeholder="Digite sua dúvida... use / para personas, @ para ferramentas ou # para agentes."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-background min-h-[44px] max-h-[120px] resize-none py-3 px-3 sm:px-4 text-sm sm:text-base overflow-y-auto rounded-xl border-border/50 focus-visible:ring-primary/30"
                  disabled={isLoading}
                  autoComplete="off"
                  rows={1}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 h-11 w-11 rounded-xl p-0 shrink-0 mb-0.5 shadow-md transition-transform hover:scale-105 active:scale-95">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
