import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Sparkles } from 'lucide-react';

const Chat = () => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 py-4 md:py-6 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Chat Consultivo Inteligente</h1>
            <p className="text-[10px] md:text-sm text-muted-foreground">Converse com a IA integrada às suas ferramentas.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 w-full px-0 pb-0">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat;