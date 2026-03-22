import React, { useState } from 'react';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DynamicModuleLoaderProps {
  url: string;
  title: string;
}

export const DynamicModuleLoader: React.FC<DynamicModuleLoaderProps> = ({ url, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 animate-in zoom-in-95 duration-300">
        <Alert variant="destructive" className="max-w-md shadow-elegant border-destructive/50">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Falha de Segurança / Conexão</AlertTitle>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            Não foi possível carregar o módulo <strong>"{title}"</strong>. 
            A URL fornecida de origem (<em>{url}</em>) está inacessível, offline ou foi bloqueada por nossas rigorosas políticas de segurança (CSP).
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-border shadow-sm bg-muted/5">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-10 animate-out fade-out duration-500 fill-mode-forwards">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
          <p className="mt-4 text-sm font-bold text-foreground tracking-widest uppercase">Injetando Micro-Frontend...</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-success font-mono bg-success/10 px-2 py-1 rounded border border-success/20">
            <ShieldCheck className="h-3 w-3" /> Sandbox Isolado Ativo
          </div>
        </div>
      )}
      
      <iframe
        src={url}
        title={title}
        className="w-full h-full border-none transition-opacity duration-500"
        style={{ opacity: isLoading ? 0 : 1 }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};