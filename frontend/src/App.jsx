import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCrop from "./pages/AddCrop";
import RentMachinery from "./pages/RentMachinery";
import AddMachine from "./pages/AddMachine";

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
      </Routes>
    </Router>
  );
}

export default App;