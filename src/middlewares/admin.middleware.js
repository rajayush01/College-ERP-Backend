export const isAdmin = (req, res, next) => {
  console.log('👑 Admin middleware - User:', req.user);
  
  // Check if user exists (should be set by protect middleware)
  if (!req.user) {
    console.log('❌ No user found in request');
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Check if user has admin role
  if (req.user.role !== "ADMIN") {
    console.log('❌ User role is not ADMIN:', req.user.role);
    return res.status(403).json({ message: "Admin access only" });
  }
  
  console.log('✅ Admin access granted');
  next();
};
