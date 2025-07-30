import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // Get the "Authorization" header
  const authHeader = req.header("Authorization");

  // Check if the Authorization header is provided and follows the "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, error: "No token, authorization denied" });
  }

  // Extract the token from the "Bearer <token>" format
  const token = authHeader.split(" ")[1]; // Gets the token after the "Bearer" part

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Attach the decoded token to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error);
    return res
      .status(401)
      .json({ success: false, error: "Token is not valid" });
  }
};
