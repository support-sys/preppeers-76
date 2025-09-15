
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import WhatsAppChat from "@/components/WhatsAppChat";
import RedirectHandler from "@/components/RedirectHandler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Book from "./pages/Book";
import Interviewers from "./pages/Interviewers";
import InterviewerPayment from "./pages/InterviewerPayment";
import PaymentProcessing from "./pages/PaymentProcessing";
import Pricing from "./pages/Pricing";
import BecomeInterviewer from "./pages/BecomeInterviewer";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import "@/services/cleanupService"; // Start cleanup service

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
                <BrowserRouter>
          <AuthProvider>
            <RedirectHandler />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/book" 
              element={
                <ProtectedRoute requireRole="interviewee">
                  <Book />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interviewers" 
              element={
                <ProtectedRoute requireRole="interviewer">
                  <Interviewers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interviewer-payment" 
              element={
                <ProtectedRoute requireRole="interviewer">
                  <InterviewerPayment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-processing" 
              element={
                <ProtectedRoute>
                  <PaymentProcessing />
                </ProtectedRoute>
              } 
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/become-interviewer" element={<BecomeInterviewer />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Admin Routes - Completely separate from main app */}
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppChat phoneNumber="919028919227" />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
