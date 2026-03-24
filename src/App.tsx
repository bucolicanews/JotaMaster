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
import Skills from "./pages/Skills";
import Prompts from "./pages/Prompts";
import Agents from "./pages/Agents";
import Modules from "./pages/Modules";
import CRM from "./pages/CRM"; 
import Credits from "./pages/Credits";
import AdminFinance from "./pages/AdminFinance";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DynamicRouteHandler from "./pages/DynamicRouteHandler";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ModuleProtectedRoute } from "./components/ModuleProtectedRoute"; 

const queryClient = new QueryClient();

const RotaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Validando credenciais...</p>
      </div>
    );
  }
  
  return autenticado ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      {/* Rotas Públicas (Apenas Login) */}
      <Route path="/login" element={<Login />} />
      
      {/* Rotas Protegidas (Core & Inteligência) */}
      <Route path="/" element={<RotaProtegida><Index /></RotaProtegida>} />
      <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
      <Route path="/prompts" element={<RotaProtegida><Prompts /></RotaProtegida>} />
      <Route path="/configuracao" element={<RotaProtegida><Configuracao /></RotaProtegida>} />
      <Route path="/modules" element={<RotaProtegida><Modules /></RotaProtegida>} />

      {/* Módulos Premium (Exigem Ativação no Marketplace) */}
      <Route path="/skills" element={<RotaProtegida><ModuleProtectedRoute moduleId="skills"><Skills /></ModuleProtectedRoute></RotaProtegida>} />
      <Route path="/agents" element={<RotaProtegida><ModuleProtectedRoute moduleId="agents"><Agents /></ModuleProtectedRoute></RotaProtegida>} />
      <Route path="/credits" element={<RotaProtegida><Credits /></RotaProtegida>} />

      {/* Módulos Legados (Privatizados) */}
      <Route path="/precificacao" element={<RotaProtegida><Pricing /></RotaProtegida>} />
      <Route path="/products" element={<RotaProtegida><ProductList /></RotaProtegida>} />
      <Route path="/audit" element={<RotaProtegida><Audit /></RotaProtegida>} />
      <Route path="/comparison" element={<RotaProtegida><Comparison /></RotaProtegida>} />
      <Route path="/impact" element={<RotaProtegida><ImpactAnalysis /></RotaProtegida>} />
      <Route path="/new-business" element={<RotaProtegida><Viabilidade /></RotaProtegida>} />
      
      {/* Administração */}
      <Route path="/admin" element={<RotaProtegida><AdminDashboard /></RotaProtegida>} />
      <Route path="/admin/finance" element={<RotaProtegida><AdminFinance /></RotaProtegida>} />
      
      {/* ROTA CATCH-ALL PARA MICRO-FRONTENDS (EXTERNAL CDN) */}
      <Route path="/app/:moduleId" element={<RotaProtegida><DynamicRouteHandler /></RotaProtegida>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;