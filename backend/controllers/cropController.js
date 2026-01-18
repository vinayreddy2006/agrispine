import CropCycle from "../models/CropCycle.js";

/* -------------------------------------------------------------------------- */
/* ADD A NEW CROP                               */
/* -------------------------------------------------------------------------- */
export const addCrop = async (req, res) => {
  try {
    const { cropName, area, sowingDate } = req.body;

    // Create new crop linked to the logged-in user (req.user.id)
    const newCrop = new CropCycle({
      user: req.user.id, 
      cropName,
      area,
      sowingDate
    });

    const savedCrop = await newCrop.save();
    res.status(201).json(savedCrop);

  } catch (error) {
    console.error("Error adding crop:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET ALL CROPS (For the Dashboard)                    */
/* -------------------------------------------------------------------------- */
export const getCrops = async (req, res) => {
  try {
    // Find crops where 'user' matches the logged-in ID
    // .sort({ createdAt: -1 }) means show newest first
    const crops = await CropCycle.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.json(crops);

  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE A CROP                                        */
/* -------------------------------------------------------------------------- */
export const deleteCrop = async (req, res) => {
  try {
    // 1. Find the crop to be deleted
    let crop = await CropCycle.findById(req.params.id);
    if (!crop) { return res.status(404).send("Not Found"); }

    // 2. Allow deletion ONLY if user owns this crop
    if (crop.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    // 3. Delete it
    crop = await CropCycle.findByIdAndDelete(req.params.id);
    res.json({ "Success": "Crop has been deleted", crop: crop });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}

/* -------------------------------------------------------------------------- */
/* GET SINGLE CROP DETAILS                                                    */
/* -------------------------------------------------------------------------- */
export const getCropById = async (req, res) => {
  try {
    const crop = await CropCycle.findById(req.params.id);
    
    // Security: Ensure the user owns this crop
    if (!crop) return res.status(404).send("Not Found");
    if (crop.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    res.json(crop);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* ADD EXPENSE TO CROP                                                        */
/* -------------------------------------------------------------------------- */
export const addExpense = async (req, res) => {
  try {
    const { type, amount, date } = req.body;
    
    // Find crop
    const crop = await CropCycle.findById(req.params.id);
    if (!crop) return res.status(404).send("Not Found");
    
    // Security check
    if (crop.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    // Add new expense to the array
    crop.expenses.push({ type, amount, date });
    
    await crop.save();
    res.json(crop); // Return updated crop

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE EXPENSE FROM CROP                                                   */
/* -------------------------------------------------------------------------- */
export const deleteExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;

    // 1. Find crop and check ownership
    const crop = await CropCycle.findById(id);
    if (!crop) return res.status(404).send("Not Found");
    if (crop.user.toString() !== req.user.id) return res.status(401).send("Not Allowed");

    // 2. Remove the specific expense using $pull
    // Mongoose automatically adds _id to subdocuments in an array
    await CropCycle.updateOne(
      { _id: id },
      { $pull: { expenses: { _id: expenseId } } }
    );

    res.json({ success: "Expense deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* MARK CROP AS SOLD (Record Revenue)                                         */
/* -------------------------------------------------------------------------- */
export const sellCrop = async (req, res) => {
  try {
    const { yieldQty, revenue } = req.body;
    
    // Find and update
    // We set status to 'sold', save the yield and revenue
    const crop = await CropCycle.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // Ensure ownership
      { 
        $set: { 
          status: 'sold',
          yieldQty: yieldQty,
          revenue: revenue
        } 
      },
      { new: true }
    );

    if (!crop) return res.status(404).send("Crop not found or unauthorized");
    
    res.json(crop);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* TOGGLE MARKET LISTING (Farmer Side)                                        */
/* -------------------------------------------------------------------------- */
export const toggleListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { isListed, expectedPrice, quantityAvailable, description } = req.body;

    const crop = await CropCycle.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { isListed, expectedPrice, quantityAvailable, description } },
      { new: true }
    );

    if (!crop) return res.status(404).send("Crop not found");
    res.json(crop);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

/* -------------------------------------------------------------------------- */
/* GET ALL MARKET LISTINGS (Buyer Side - Public)                              */
/* -------------------------------------------------------------------------- */
export const getMarketListings = async (req, res) => {
  try {
    // Find all crops where isListed = true, and populate user details (phone/name)
    const listings = await CropCycle.find({ isListed: true })
      .populate("user", "name phone district village") // We need phone number to contact!
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).send("Server Error");
  }
};
