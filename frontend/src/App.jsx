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
import Reports from "./pages/Reports";
import PlantDoctor from "./pages/PlantDoctor";
import Landing from "./pages/Landing";
import MyCrops from "./pages/MyCrops";
import BuyerMarket from "./pages/BuyerMarket";
import ScrollToTop from "./components/ScrollToTop";
import MyBookings from "./pages/MyBookings";
import VillageChat from "./pages/VillageChat";

// Components
import BottomNav from "./components/BottomNav";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen pb-24 bg-gray-50">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="/reports" element={<Reports />} />
        <Route path="/doctor" element={<PlantDoctor />} />
        <Route path="/my-crops" element={<MyCrops />} />
        <Route path="/buyer-market" element={<BuyerMarket />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/village-chat" element={<VillageChat />} />
      </Routes>
      </div>
      <BottomNav />
    </Router>
  );
}

export default App;