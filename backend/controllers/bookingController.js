import Booking from "../models/Booking.js";
import Machine from "../models/Machine.js";

/* 1. CREATE A BOOKING REQUEST (Farmer / Renter) */
export const createBooking = async (req, res) => {
  try {
    const { machineId, date, task, duration, notes } = req.body;

    if (!machineId || !date) {
      return res.status(400).json({ message: "Machine ID and booking date are required" });
    }

    // Verify machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    // Prevent booking your own machine
    if (machine.user.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot book your own machine" });
    }

    // Historical agreed task rate locking
    const selectedTask = task && task.name ? {
      name: task.name,
      price: Number(task.price) || machine.price,
      priceUnit: task.priceUnit || machine.priceUnit || 'hour'
    } : {
      name: "General Operation",
      price: machine.price,
      priceUnit: machine.priceUnit || 'hour'
    };

    const bookingDuration = Number(duration) > 0 ? Number(duration) : 1;
    const totalAmount = (Number(selectedTask.price) || 0) * bookingDuration;

    const newBooking = new Booking({
      machine: machineId,
      farmer: req.user.id,        // The person booking (renter)
      provider: machine.user,     // The owner of the machine
      date: new Date(date),
      task: selectedTask,
      duration: bookingDuration,
      totalAmount,
      notes: notes || "",
      status: 'pending'
    });

    const savedBooking = await newBooking.save();
    const populated = await Booking.findById(savedBooking._id)
      .populate("machine", "name type price priceUnit image condition tasks")
      .populate("farmer", "name phone profileImage village district")
      .populate("provider", "name phone profileImage village district");

    res.status(201).json(populated);

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* 2. GET ALL MY BOOKINGS (Renter OR Provider) */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ farmer: req.user.id }, { provider: req.user.id }]
    })
    .populate("machine", "name type price priceUnit image condition rating ratingCount")
    .populate("farmer", "name phone profileImage village district")
    .populate("provider", "name phone profileImage village district")
    .sort({ date: -1, createdAt: -1 });

    res.json(bookings);

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* 3. GET RENTER BOOKINGS (Farmer Bookings) */
export const getRenterBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ farmer: req.user.id })
      .populate("machine", "name type price priceUnit image condition rating ratingCount")
      .populate("provider", "name phone profileImage village district")
      .sort({ date: -1, createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching renter bookings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 4. GET OWNER REQUESTS (Incoming bookings on provider's machines) */
export const getOwnerRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user.id })
      .populate("machine", "name type price priceUnit image condition")
      .populate("farmer", "name phone profileImage village district")
      .sort({ date: -1, createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching owner requests:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 5. GET BOOKED DATES FOR A MACHINE (Public Calendar View - Privacy Protected) */
export const getMachineBookedDates = async (req, res) => {
  try {
    const { machineId } = req.params;
    const bookings = await Booking.find({
      machine: machineId,
      status: { $in: ['accepted', 'confirmed', 'pending'] }
    }).select("date status");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching machine booked dates:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 6. UPDATE STATUS (Provider: accept/reject/completed; Farmer: cancel) */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted', 'rejected', 'completed', 'cancelled'
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.provider.toString() === req.user.id;
    const isRenter = booking.farmer.toString() === req.user.id;

    if (!isOwner && !isRenter) {
      return res.status(401).json({ message: "Not authorized to modify this booking" });
    }

    if (status === 'cancelled') {
      if (!isRenter && !isOwner) {
        return res.status(401).json({ message: "Not authorized to cancel" });
      }
      booking.status = 'cancelled';
    } else if (status === 'accepted' || status === 'confirmed') {
      if (!isOwner) {
        return res.status(401).json({ message: "Only machine owner can accept booking requests" });
      }
      booking.status = 'accepted';
    } else if (status === 'rejected') {
      if (!isOwner) {
        return res.status(401).json({ message: "Only machine owner can reject booking requests" });
      }
      booking.status = 'rejected';
    } else if (status === 'completed') {
      booking.status = 'completed';
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("machine", "name type price priceUnit image condition")
      .populate("farmer", "name phone profileImage village district")
      .populate("provider", "name phone profileImage village district");

    res.json(populated);

  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* 7. DELETE BOOKING */
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Not Found" });

    if (booking.farmer.toString() !== req.user.id && booking.provider.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: "Booking deleted" });

  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
