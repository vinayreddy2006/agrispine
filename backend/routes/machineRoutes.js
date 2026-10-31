import express from "express";
import fetchUser, { optionalFetchUser } from "../middlewares/fetchUser.js";
import { 
  addMachine, 
  getAllMachines, 
  getMachineById,
  updateMachine,
  deleteMachine, 
  getMachinesByType, 
  getMyMachines,
  getMachineServices,
  addMachineService,
  updateMachineService,
  deleteMachineService
} from "../controllers/machineController.js";

const router = express.Router();

// ROUTE 1: Get All Machines
router.get("/fetchall", optionalFetchUser, getAllMachines);

// ROUTE 2: Get Machine by ID
router.get("/detail/:id", optionalFetchUser, getMachineById);

// ROUTE 3: Add a Machine (POST /api/machines/add)
router.post("/add", fetchUser, addMachine);

// ROUTE 4: Update Machine (PUT /api/machines/update/:id)
router.put("/update/:id", fetchUser, updateMachine);

// ROUTE 5: Delete Machine (DELETE /api/machines/delete/:id)
router.delete("/delete/:id", fetchUser, deleteMachine);

// ROUTE 6: Get by Category
router.get("/type/:type", optionalFetchUser, getMachinesByType);

// ROUTE 7: Get Logged-in Provider's Machines
router.get("/own", fetchUser, getMyMachines);

// ROUTE 8: Service / Task Management Endpoints (Owner Only)
router.get("/:id/services", fetchUser, getMachineServices);
router.post("/:id/services", fetchUser, addMachineService);
router.put("/:id/services/:serviceId", fetchUser, updateMachineService);
router.delete("/:id/services/:serviceId", fetchUser, deleteMachineService);

export default router;
