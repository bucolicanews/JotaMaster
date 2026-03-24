import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, Zap, Wrench, MessageSquareQuote, ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const handleStartChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    // Salva o input inicial para o chat carregar
    sessionStorage.setItem('jota-initial-prompt', input);
    navigate('/chat');
  };

  const suggestionCards = [
    { title: "Análise Tributária", desc: "Como a LC 214 afeta meu comércio?", icon: Zap, color: "text-amber-500" },
    { title: "Cálculo de Margem", desc: "Qual o markup ideal para lucro de 15%?", icon: Sparkles, color: "text-primary" },
    { title: "Dúvida Contábil", desc: "O que é o Fator R no Simples Nacional?", icon: MessageSquareQuote, color: "text-blue-500" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 max-w-5xl mx-auto animate-in fade-in duration-700">
      
      {/* Saudação Estilo Gemini */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary-glow to-amber-500 bg-clip-text text-transparent">
          Olá, {profile?.first_name || 'Empreendedor'}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-medium">
          Como posso ajudar o seu negócio hoje?
        </p>
      </div>

      {/* Barra de Busca Centralizada */}
      <form 
        onSubmit={handleStartChat}
        className="w-full max-w-3xl relative group mb-12"
      >
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center bg-card border-2 border-border group-focus-within:border-primary/50 rounded-2xl p-2 shadow-elegant transition-all">
          <div className="pl-4 pr-2">
            <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input 
            placeholder="Digite sua dúvida, use / para prompts ou @ para ferramentas..." 
            className="border-none bg-transparent text-lg h-14 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button 
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
            disabled={!input.trim()}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex gap-4 mt-4 px-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
            Atalhos:
          </span>
          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setInput(input + ' /')}>/ Prompts</Badge>
          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setInput(input + ' @')}>@ Skills</Badge>
          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setInput(input + ' #')}># Agentes</Badge>
        </div>
      </form>

      {/* Cards de Sugestão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {suggestionCards.map((card, i) => (
          <Card 
            key={i}
            className="p-6 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group border-border/50"
            onClick={() => setInput(card.desc)}
          >
            <card.icon className={cn("h-6 w-6 mb-4 transition-transform group-hover:scale-110", card.color)} />
            <h3 className="font-bold text-sm mb-1">{card.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      {/* Footer Discreto */}
      <div className="mt-16 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
          <Zap className="h-3 w-3 text-primary" /> JOTA Master Intelligence — v1.0
        </p>
      </div>
    </div>
  );
};

const Badge = ({ children, className, variant, onClick }: any) => (
  <span 
    onClick={onClick}
    className={cn(
      "px-2 py-0.5 rounded-full border text-[10px] font-bold transition-colors",
      variant === 'outline' ? "border-border text-muted-foreground" : "bg-primary text-primary-foreground",
      className
    )}
  >
    {children}
  </span>
);

export default Index;