import jwt from "jsonwebtoken";

const fetchUser = (req, res, next) => {
  // 1. Get the token from the header
  const token = req.header("auth-token");

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  try {
    // 2. Verify the token
    const data = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user ID to the request object
    // Try to handle both common token structures
    if (data.user) {
        req.user = data.user;
    } else if (data.id) {
        req.user = { id: data.id };
    } else {
        // If we can't find the ID, verify failed logically
        console.log("❌ Token has no 'user' or 'id' field");
        return res.status(401).json({ error: "Invalid Token Structure" });
    }
    
    next(); 
    
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    const isExpired = error.name === "TokenExpiredError" || (error.message && error.message.toLowerCase().includes("jwt expired"));
    res.status(401).json({ 
      error: isExpired ? "jwt expired" : "Invalid Token",
      message: isExpired ? "Your login session has expired. Please log in again to continue." : "Invalid Token"
    });
  }
};

export const optionalFetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.user) {
      req.user = data.user;
    } else if (data.id) {
      req.user = { id: data.id };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

export default fetchUser;
