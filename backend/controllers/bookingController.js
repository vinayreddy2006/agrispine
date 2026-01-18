import Booking from "../models/Booking.js";
import Machine from "../models/Machine.js";

/* 1. CREATE A BOOKING REQUEST (Farmer) */
export const createBooking = async (req, res) => {
  try {
    const { machineId, date, notes } = req.body;

    // Verify machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) return res.status(404).json({ message: "Machine not found" });

    // Prevent booking your own machine
    if (machine.user.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot book your own machine" });
    }

    const newBooking = new Booking({
      machine: machineId,
      farmer: req.user.id,        // The person booking
      provider: machine.user,     // The owner of the machine
      date,
      notes
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).send("Server Error");
  }
};

/* 2. GET MY BOOKINGS (With Auto-Cleanup) */
export const getMyBookings = async (req, res) => {
  try {
    const today = new Date();
    
    // --- AUTO-DELETE LOGIC (The "Garbage Collector") ---
    
    // 1. Calculate Date Thresholds
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30); // Clean junk after 30 days

    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365); // Clean history after 1 year

    // 2. Delete "Junk" (Rejected bookings or Expired Pending requests older than 30 days)
    await Booking.deleteMany({
      $or: [
        { status: 'rejected', updatedAt: { $lt: thirtyDaysAgo } },
        { status: 'pending', date: { $lt: thirtyDaysAgo } } // Pending items where the date passed 30 days ago
      ]
    });

    // 3. Delete "Old History" (Completed bookings older than 1 year)
    await Booking.deleteMany({
      status: 'completed',
      date: { $lt: oneYearAgo }
    });

    // --- END AUTO-DELETE ---

    // 4. Fetch the remaining relevant bookings
    const bookings = await Booking.find({
      $or: [{ farmer: req.user.id }, { provider: req.user.id }]
    })
    .populate("machine", "name type price image")
    .populate("farmer", "name phone")
    .populate("provider", "name phone")
    .sort({ createdAt: -1 });

    res.json(bookings);

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send("Server Error");
  }
};

/* 3. UPDATE STATUS (Provider Only - Accept/Reject) */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // e.g., "confirmed" or "rejected"
    const bookingId = req.params.id;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).send("Booking not found");

    // Security: Only the Provider (Owner) can accept/reject
    if (booking.provider.toString() !== req.user.id) {
      return res.status(401).send("Not Authorized to update this booking");
    }

    booking.status = status;
    await booking.save();

    res.json(booking);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* 4. DELETE BOOKING (Cleanup) */
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("Not Found");

    // Allow delete if user is either the Farmer OR the Provider
    if (booking.farmer.toString() !== req.user.id && booking.provider.toString() !== req.user.id) {
      return res.status(401).send("Not Authorized");
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: "Booking deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};