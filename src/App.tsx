import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ExtractionPage } from './pages/ExtractionPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { CasesPage } from './pages/CasesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/extract" element={<ExtractionPage />} />
            <Route path="/cards/:id" element={<CardDetailPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
