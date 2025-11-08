import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SummaryView from "./pages/SummaryView";
import GroupView from "./pages/GroupView";
import IndividualView from "./pages/IndividualView";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <Routes>
            <Route path="/" element={<Navigate to="/summary" replace />} />
            <Route path="/summary" element={<SummaryView />} />
            <Route path="/group" element={<GroupView />} />
            <Route path="/individual" element={<IndividualView />} />
            <Route path="*" element={<div>Not found</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
