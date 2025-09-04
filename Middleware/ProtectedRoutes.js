import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, error: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // ✅ Normalize user ID
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res
      .status(401)
      .json({ success: false, error: "Token is not valid" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role == "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ success: false, error: "Access denied, admin only" });
  }
};
