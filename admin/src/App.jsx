import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSchemes from "./pages/admin/AdminSchemes";
import AdminMandiRates from "./pages/admin/AdminMandiRates";
import AdminLayout from "./layouts/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminPolls from "./pages/admin/AdminPolls";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminLanding from "./pages/admin/AdminLanding";
import AdminRegister from "./pages/admin/AdminRegister";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLanding />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />
        
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/groups" element={<AdminGroups />} />
          <Route path="/polls" element={<AdminPolls />} />
          <Route path="/announcements" element={<AdminAnnouncements />} />
          <Route path="/events" element={<AdminEvents />} />
          <Route path="/schemes" element={<AdminSchemes />} />
          <Route path="/mandi-rates" element={<AdminMandiRates />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
