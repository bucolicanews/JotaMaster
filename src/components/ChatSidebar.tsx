import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, Trash2, Clock, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateTitle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingId && editValue.trim()) {
      onUpdateTitle(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    // CORREÇÃO: Largura unificada para w-64 para alinhar com a sidebar do sistema
    <div className="w-64 flex flex-col bg-muted/10 h-full shrink-0 border-r border-border/50">
      <div className="p-3 border-b border-border/50">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 h-9 text-xs font-bold"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-[10px] text-muted-foreground italic">
              Nenhuma conversa salva.
            </div>
          ) : (
            sessions.sort((a, b) => b.createdAt - a.createdAt).map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all relative overflow-hidden border border-transparent",
                  activeSessionId === session.id 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => !editingId && onSelectSession(session.id)}
              >
                <MessageSquare className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  activeSessionId === session.id ? "text-primary" : "opacity-50"
                )} />
                
                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(e)}
                        className="h-6 text-[10px] py-0 px-1.5 bg-background border-primary/30 focus-visible:ring-primary"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0">
                      <p className="text-[11px] font-semibold truncate leading-tight">
                        {session.title}
                      </p>
                      <p className="text-[8px] opacity-60 flex items-center gap-1">
                        <Clock className="h-2 w-2" />
                        {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botões de ação com visibilidade controlada e shrink-0 */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === session.id ? (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-success hover:text-success hover:bg-success/10" 
                        onClick={saveEdit}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-muted-foreground hover:bg-muted" 
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 hover:text-primary hover:bg-primary/10" 
                        onClick={(e) => startEditing(e, session)}
                        title="Editar título"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 hover:text-destructive hover:bg-destructive/10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        title="Excluir conversa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};