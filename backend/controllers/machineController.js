import Machine from "../models/Machine.js";

// ADD A NEW MACHINE (Provider Only)                    
export const addMachine = async (req, res) => {
  try {
    const { name, type, price, priceUnit, description, image, condition, specs, modelYear, tasks } = req.body;

    const formattedTasks = Array.isArray(tasks) ? tasks.map(t => ({
      name: t.name || "General Operation",
      price: Number(t.price) || Number(price) || 0,
      priceUnit: t.priceUnit || priceUnit || 'hour',
      description: t.description || "",
      available: t.available !== false
    })) : [];

    const newMachine = new Machine({
      user: req.user.id, 
      name,
      type,
      price: Number(price) || 0,
      priceUnit: priceUnit || 'hour',
      description,
      image: image || "https://cdn-icons-png.flaticon.com/512/2318/2318736.png",
      condition: condition || 'Good',
      specs: specs || '',
      modelYear: modelYear ? Number(modelYear) : undefined,
      tasks: formattedTasks
    });

    const savedMachine = await newMachine.save();
    res.status(201).json(savedMachine);

  } catch (error) {
    console.error("Error adding machine:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// UPDATE MACHINE (Owner Only)
export const updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this machine" });
    }

    const { name, type, price, priceUnit, description, image, condition, specs, modelYear, tasks, available } = req.body;

    if (name !== undefined) machine.name = name;
    if (type !== undefined) machine.type = type;
    if (price !== undefined) machine.price = Number(price);
    if (priceUnit !== undefined) machine.priceUnit = priceUnit;
    if (description !== undefined) machine.description = description;
    if (image !== undefined) machine.image = image;
    if (condition !== undefined) machine.condition = condition;
    if (specs !== undefined) machine.specs = specs;
    if (modelYear !== undefined) machine.modelYear = Number(modelYear);
    if (available !== undefined) machine.available = available;

    if (Array.isArray(tasks)) {
      machine.tasks = tasks.map(t => ({
        name: t.name || "General Operation",
        price: Number(t.price) || machine.price,
        priceUnit: t.priceUnit || machine.priceUnit || 'hour',
        description: t.description || "",
        available: t.available !== false
      }));
    }

    const updated = await machine.save();
    res.json(updated);
  } catch (error) {
    console.error("Error updating machine:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET ALL MACHINES (For all users - public marketplace)         
export const getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate("user", "name phone profileImage village mandal district state locationCoordinates")
      .sort({ createdAt: -1 });
    
    res.json(machines);

  } catch (error) {
    console.error("Error fetching machines:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET MACHINE BY ID
export const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate("user", "name phone profileImage village mandal district state locationCoordinates");
    
    if (!machine) return res.status(404).json({ message: "Machine not found" });
    res.json(machine);
  } catch (error) {
    console.error("Error fetching machine details:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE MACHINE (Owner Only)
export const deleteMachine = async (req, res) => {
  try {
    let machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).send("Not Found");
    }

    if (machine.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    await Machine.findByIdAndDelete(req.params.id);
    res.json({ success: "Machine deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET MACHINES BY CATEGORY TYPE (or 'all')
export const getMachinesByType = async (req, res) => {
  try {
    const { type } = req.params;

    const filter = {};
    if (type && type.toLowerCase() !== 'all') {
      filter.type = { $regex: new RegExp(`^${type}$`, "i") };
    }

    const machines = await Machine.find(filter)
      .populate("user", "name phone profileImage village mandal district state locationCoordinates") 
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
    const machines = await Machine.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(machines);
  } catch (error) {
    console.error("Error fetching my machines:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
