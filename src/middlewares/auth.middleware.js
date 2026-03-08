import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  console.log('🔐 Protect middleware - Token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Token verified, user:', { id: decoded.id, role: decoded.role });
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
