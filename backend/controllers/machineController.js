import Machine from "../models/Machine.js";

// ADD A NEW MACHINE (Provider Only)                    
export const addMachine = async (req, res) => {
  try {

    const { name, type, price, priceUnit, description } = req.body;

    const newMachine = new Machine({
      user: req.user.id, 
      name,
      type,
      price,      // e.g., 1200
      priceUnit,  // e.g., "hour" or "acre"
      description
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