import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCrop from "./pages/AddCrop";
import RentMachinery from "./pages/RentMachinery";
import AddMachine from "./pages/AddMachine";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Schemes from "./pages/Schemes";
import MarketPrices from "./pages/MarketPrices";
import CropDetails from "./pages/CropDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-crop" element={<AddCrop />} />
        <Route path="/rent-machinery" element={<RentMachinery />} />
        <Route path="/add-machine" element={<AddMachine />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/market" element={<MarketPrices />} />
        <Route path="/crop/:id" element={<CropDetails />} />
      </Routes>
    </Router>
  );
}

export default App;