import express from "express";
import fetchUser from "../middlewares/fetchUser.js";
import { addMachine, getAllMachines, deleteMachine, getMachinesByType, getMyMachines } from "../controllers/machineController.js";

const router = express.Router();

// ROUTE 1: Get All Machines (Public or Login Required? Let's keep it Login Required)
router.get("/fetchall", fetchUser, getAllMachines);

// ROUTE 2: Add a Machine (POST /api/machines/add)
router.post("/add", fetchUser, addMachine);

// ROUTE 3: Delete Machine (DELETE /api/machines/delete/:id)
router.delete("/delete/:id", fetchUser, deleteMachine);

// NEW ROUTE: Get by Category
// Example usage: GET /api/machines/type/Tractor
router.get("/type/:type", fetchUser, getMachinesByType);

router.get("/own", fetchUser, getMyMachines);

export default router;