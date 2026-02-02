import Machine from "../models/Machine.js";

// ADD A NEW MACHINE (Provider Only)                    
export const addMachine = async (req, res) => {
  try {

    const { name, type, price, priceUnit, description ,image} = req.body;

    const newMachine = new Machine({
      user: req.user.id, 
      name,
      type,
      price,      // e.g., 1200
      priceUnit,  // e.g., "hour" or "acre"
      description,
      image
    });

    const savedMachine = await newMachine.save();
    res.status(201).json(savedMachine);

  } catch (error) {
    console.error("Error adding machine:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET ALL MACHINES (For Farmers to see)         
export const getAllMachines = async (req, res) => {
  try {

    const machines = await Machine.find().populate("user", "name phone village").sort({ createdAt: -1 });
    
    res.json(machines);

  } catch (error) {
    console.error("Error fetching machines:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE MACHINE (Owner Only)                                                */
/* -------------------------------------------------------------------------- */
export const deleteMachine = async (req, res) => {
  try {
    // 1. Find the machine
    let machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).send("Not Found");
    }

    // 2. Check if the logged-in user is the Owner
    if (machine.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    // 3. Delete it
    await Machine.findByIdAndDelete(req.params.id);
    res.json({ success: "Machine deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// backend/controllers/machineController.js

export const getMachinesByType = async (req, res) => {
  try {
    const { type } = req.params;

    const machines = await Machine.find({ 
      type: { $regex: new RegExp(`^${type}$`, "i") } 
    })
    // 👇 FIX: Change "image" to "profileImage"
    .populate("user", "name phone profileImage village") 
    .sort({ createdAt: -1 });
    
    res.json(machines);

  } catch (error) {
    console.error("Error fetching machines by type:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET MACHINES FOR LOGGED IN USER (Provider's "My Machines")
export const getMyMachines = async (req, res) => {
  try {
    // req.user.id comes from the fetchUser middleware
    const machines = await Machine.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(machines);
  } catch (error) {
    console.error("Error fetching my machines:", error);
    res.status(500).json({ message: "Server Error" });
  }
};