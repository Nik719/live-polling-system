import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "@/contexts/SocketContext";
import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import StudentSetup from "./pages/StudentSetup";
import StudentWaiting from "./pages/StudentWaiting";
import StudentAnswer from "./pages/StudentAnswer";
import StudentResults from "./pages/StudentResults";
import StudentKicked from "./pages/StudentKicked";
import TeacherLive from "./pages/TeacherLive";
import TeacherSetup from "./pages/TeacherSetup";
import PollHistory from "./pages/PollHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create-poll" element={<CreatePoll />} />
            <Route path="/student-setup" element={<StudentSetup />} />
            <Route path="/student-waiting" element={<StudentWaiting />} />
            <Route path="/student-answer" element={<StudentAnswer />} />
            <Route path="/student-results" element={<StudentResults />} />
            <Route path="/student-kicked" element={<StudentKicked />} />
            <Route path="/teacher-setup" element={<TeacherSetup />} />
            <Route path="/teacher-live" element={<TeacherLive />} />
            <Route path="/poll-history" element={<PollHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SocketProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
