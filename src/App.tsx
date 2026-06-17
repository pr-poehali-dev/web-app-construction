import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Inspection from "./pages/Inspection";
import Inspections from "./pages/Inspections";
import Objects from "./pages/Objects";
import AddObject from "./pages/AddObject";
import Balance from "./pages/Balance";
import Purchases from "./pages/Purchases";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/inspection" element={<RequireAuth><Inspection /></RequireAuth>} />
            <Route path="/inspections" element={<RequireAuth><Inspections /></RequireAuth>} />
            <Route path="/objects" element={<RequireAuth><Objects /></RequireAuth>} />
            <Route path="/add-object" element={<RequireAuth><AddObject /></RequireAuth>} />
            <Route path="/balance" element={<RequireAuth><Balance /></RequireAuth>} />
            <Route path="/purchases" element={<RequireAuth><Purchases /></RequireAuth>} />
            <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
