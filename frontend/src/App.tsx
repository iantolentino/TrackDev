import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { BoardPage } from "@/pages/BoardPage";
import { RequestFormPage } from "@/pages/RequestFormPage";
import { RequestStatusPage } from "@/pages/RequestStatusPage";
import { PublicBoardPage } from "@/pages/PublicBoardPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public, no account needed. /request is the status-check landing page;
            /request/new is the actual submission form. */}
        <Route path="/request" element={<RequestStatusPage />} />
        <Route path="/request/new" element={<RequestFormPage />} />
        <Route path="/board" element={<PublicBoardPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<BoardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
