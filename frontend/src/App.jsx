import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/core/Dashboard";
import Landing from "./pages/core/Landing";
import Profile from "./pages/core/Profile";
import AddCrop from "./pages/crops/AddCrop";
import CropDetails from "./pages/crops/CropDetails";
import MyCrops from "./pages/crops/MyCrops";
import Community from "./pages/community/Community";
import Schemes from "./pages/services/Schemes";
import Reports from "./pages/services/Reports";
import PlantDoctor from "./pages/services/PlantDoctor";
import MarketPrices from "./pages/market/MarketPrices";
import BuyerMarket from "./pages/market/BuyerMarket";
import Messenger from "./pages/messages/Messenger";
import ScrollToTop from "./components/ScrollToTop";
import MyBookings from "./pages/rent-machinery/MyBookings";
import AddMachine from "./pages/rent-machinery/AddMachine";
import RentCategories from "./pages/rent-machinery/RentCategories";
import RentListing from "./pages/rent-machinery/RentListing";
import RentDetails from "./pages/rent-machinery/RentDetails";
import MyMachines from "./pages/rent-machinery/MyMachines";
import ManageMachine from "./pages/rent-machinery/ManageMachine";
import GramSathiFullScreen from "./pages/ai/GramSathiFullScreen";
import Weather from "./pages/core/Weather";
import GroupDashboard from "./pages/groups/GroupDashboard";
import CreateGroup from "./pages/groups/CreateGroup";
import GroupDetails from "./pages/groups/GroupDetails";
import PersonalDashboard from "./pages/groups/PersonalDashboard";
// Components
import BottomNav from "./components/BottomNav";
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>


        {/* User Routes */}
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-crop" element={<AddCrop />} />
              <Route path="/rent-machinery" element={<RentCategories />} />
              <Route path="/rent/list/:type" element={<RentListing />} />
              <Route path="/rent/details/:id" element={<RentDetails />} />
              <Route path="/my-machines" element={<MyMachines />} />
              <Route path="/manage-machine/:id" element={<ManageMachine />} />
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
              <Route path="/messages" element={<Messenger />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/ai-chat" element={<GramSathiFullScreen />} />
              
              {/* Work Groups */}
              <Route path="/groups" element={<GroupDashboard />} />
              <Route path="/groups/create" element={<CreateGroup />} />
              <Route path="/groups/personal" element={<PersonalDashboard />} />
              <Route path="/groups/:id" element={<GroupDetails />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;