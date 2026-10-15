import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Pages
import MissionControlPage from './pages/MissionControlPage';
import MissionDetailPage from './pages/MissionDetailPage';
import VerificationPage from './pages/VerificationPage';
import RehearsalApprovalPage from './pages/RehearsalApprovalPage';
import RewindPage from './pages/RewindPage';
import AuditLedgerPage from './pages/AuditLedgerPage';
import IntelligenceLabPage from './pages/IntelligenceLabPage';
import McpControlPage from './pages/McpControlPage';
import ChaosArenaPage from './pages/ChaosArenaPage';
import RealityGapPage from './pages/RealityGapPage';
import ComparePage from './pages/ComparePage';
import ReportPage from './pages/ReportPage';
import Layout from './components/Layout';
import BrandIntro from './components/BrandIntro';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BrandIntro />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/missions" replace />} />
            <Route path="/missions" element={<MissionControlPage />} />
            <Route path="/missions/:id" element={<MissionDetailPage />} />
            <Route path="/missions/:id/verification" element={<VerificationPage />} />
            <Route path="/missions/:id/rehearsal" element={<RehearsalApprovalPage />} />
            <Route path="/missions/:id/rewind" element={<RewindPage />} />
            <Route path="/missions/:id/report" element={<ReportPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/audit" element={<AuditLedgerPage />} />
            <Route path="/intelligence" element={<IntelligenceLabPage />} />
            <Route path="/mcp" element={<McpControlPage />} />
            <Route path="/chaos" element={<ChaosArenaPage />} />
            <Route path="/gaps" element={<RealityGapPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
