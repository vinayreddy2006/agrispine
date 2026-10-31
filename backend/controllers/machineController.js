import Machine from "../models/Machine.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";

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

// ==============================================================
// SERVICE / TASK MANAGEMENT ENDPOINTS
// ==============================================================

// GET SERVICES FOR A MACHINE (with booking count breakdown)
export const getMachineServices = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    const tasks = machine.tasks || [];
    
    // If owner, include booking stats for each task
    if (machine.user.toString() === req.user.id) {
      const bookings = await Booking.find({ machine: machine._id, status: { $in: ['pending', 'accepted', 'confirmed'] } });
      const tasksWithStats = tasks.map(t => {
        const taskObj = t.toObject ? t.toObject() : { ...t };
        const pendingCount = bookings.filter(b => b.task?.name?.toLowerCase() === t.name.toLowerCase() && b.status === 'pending').length;
        const confirmedCount = bookings.filter(b => b.task?.name?.toLowerCase() === t.name.toLowerCase() && (b.status === 'accepted' || b.status === 'confirmed')).length;
        return {
          ...taskObj,
          pendingBookingsCount: pendingCount,
          confirmedBookingsCount: confirmedCount
        };
      });
      return res.json({ tasks: tasksWithStats, machineName: machine.name, machineId: machine._id });
    }

    res.json({ tasks, machineName: machine.name, machineId: machine._id });
  } catch (error) {
    console.error("Error fetching machine services:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ADD A NEW SERVICE TO A MACHINE (Owner Only)
export const addMachineService = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to manage services for this machine" });
    }

    const { name, price, priceUnit, description, available } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Service name is required" });
    }

    const newService = {
      name: name.trim(),
      price: Number(price) > 0 ? Number(price) : machine.price,
      priceUnit: priceUnit || machine.priceUnit || 'hour',
      description: description || "",
      available: available !== false
    };

    machine.tasks.push(newService);
    await machine.save();

    res.status(201).json({ success: true, message: "Service added successfully", tasks: machine.tasks });
  } catch (error) {
    console.error("Error adding machine service:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// UPDATE A SERVICE (Owner Only)
export const updateMachineService = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this service" });
    }

    const service = machine.tasks.id(req.params.serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const { name, price, priceUnit, description, available } = req.body;
    if (name !== undefined) service.name = name.trim();
    if (price !== undefined) service.price = Number(price);
    if (priceUnit !== undefined) service.priceUnit = priceUnit;
    if (description !== undefined) service.description = description;
    if (available !== undefined) service.available = available;

    await machine.save();

    res.json({ success: true, message: "Service updated successfully", service, tasks: machine.tasks });
  } catch (error) {
    console.error("Error updating machine service:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// DELETE A SERVICE (Owner Only)
export const deleteMachineService = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    if (machine.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to remove services from this machine" });
    }

    const service = machine.tasks.id(req.params.serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const serviceName = service.name;
    const { forceCancelConfirmed } = req.body;

    // Check for confirmed future bookings
    const confirmedBookings = await Booking.find({
      machine: machine._id,
      "task.name": { $regex: new RegExp(`^${serviceName}$`, "i") },
      status: { $in: ['accepted', 'confirmed'] }
    }).populate("farmer", "name phone village district");

    // If confirmed bookings exist and owner hasn't confirmed cancellation yet
    if (confirmedBookings.length > 0 && !forceCancelConfirmed) {
      return res.status(200).json({
        requiresConfirmation: true,
        confirmedCount: confirmedBookings.length,
        confirmedBookings: confirmedBookings.map(b => ({
          _id: b._id,
          date: b.date,
          farmerName: b.farmer?.name || "Farmer",
          farmerPhone: b.farmer?.phone || "N/A",
          farmerVillage: b.farmer?.village || "",
          totalAmount: b.totalAmount
        })),
        message: `There are ${confirmedBookings.length} confirmed upcoming bookings for "${serviceName}". Removing this service requires explicit confirmation to cancel these bookings.`
      });
    }

    // 1. Auto-reject pending requests for this service
    const pendingBookings = await Booking.find({
      machine: machine._id,
      "task.name": { $regex: new RegExp(`^${serviceName}$`, "i") },
      status: 'pending'
    });

    if (pendingBookings.length > 0) {
      await Booking.updateMany(
        {
          machine: machine._id,
          "task.name": { $regex: new RegExp(`^${serviceName}$`, "i") },
          status: 'pending'
        },
        { status: 'rejected', notes: 'Service discontinued by machinery owner' }
      );

      // Notify affected pending farmers
      for (const pb of pendingBookings) {
        try {
          await Notification.create({
            user: pb.farmer,
            title: "Machinery Booking Request Rejected",
            message: `Your booking request for service "${serviceName}" on ${machine.name} was rejected because this service is no longer offered.`,
            type: "INFO",
            relatedId: pb._id
          });
        } catch (e) {
          console.error("Notification creation error", e);
        }
      }
    }

    // 2. Cancel confirmed bookings if explicitly confirmed by owner
    if (confirmedBookings.length > 0 && forceCancelConfirmed) {
      await Booking.updateMany(
        {
          machine: machine._id,
          "task.name": { $regex: new RegExp(`^${serviceName}$`, "i") },
          status: { $in: ['accepted', 'confirmed'] }
        },
        { status: 'cancelled', notes: 'Service discontinued by machinery owner' }
      );

      // Notify affected confirmed farmers
      for (const cb of confirmedBookings) {
        try {
          await Notification.create({
            user: cb.farmer?._id || cb.farmer,
            title: "Confirmed Machinery Booking Cancelled",
            message: `Your confirmed booking for "${serviceName}" on ${machine.name} scheduled for ${new Date(cb.date).toLocaleDateString()} was cancelled because the owner discontinued this service.`,
            type: "INFO",
            relatedId: cb._id
          });
        } catch (e) {
          console.error("Notification creation error", e);
        }
      }
    }

    // 3. Remove the service subdocument from machine.tasks
    machine.tasks.pull(req.params.serviceId);
    await machine.save();

    res.json({
      success: true,
      message: `Service "${serviceName}" removed successfully.`,
      rejectedPendingCount: pendingBookings.length,
      cancelledConfirmedCount: confirmedBookings.length > 0 && forceCancelConfirmed ? confirmedBookings.length : 0,
      tasks: machine.tasks
    });

  } catch (error) {
    console.error("Error deleting machine service:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
