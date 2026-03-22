import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Comparison from "./pages/Comparison";
import Audit from "./pages/Audit";
import ImpactAnalysis from "./pages/ImpactAnalysis";
import ProductList from "./pages/ProductList";
import Configuracao from "./pages/Configuracao";
import Viabilidade from "./pages/Viabilidade";
import Chat from "./pages/Chat";
import Modules from "./pages/Modules";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Componente para proteger rotas privadas garantindo que aguarda o check de sessão
const RotaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Validando credenciais de acesso...</p>
      </div>
    );
  }
  
  return autenticado ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/precificacao" element={<Pricing />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/configuracao" element={<Configuracao />} />
      
      {/* Rotas Protegidas */}
      <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
      <Route path="/comparison" element={<RotaProtegida><Comparison /></RotaProtegida>} />
      <Route path="/impact" element={<RotaProtegida><ImpactAnalysis /></RotaProtegida>} />
      <Route path="/new-business" element={<RotaProtegida><Viabilidade /></RotaProtegida>} />
      <Route path="/modules" element={<RotaProtegida><Modules /></RotaProtegida>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;