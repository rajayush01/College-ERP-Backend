import SharedDocument from "../../models/SharedDocument.js";

/**
 * Student / Teacher: View shared documents
 */
export const getSharedDocuments = async (req, res) => {
  try {
    const role = req.user.role; // STUDENT / TEACHER

    const documents = await SharedDocument.find({
      visibleTo: role,
    }).sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error("Get shared documents error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
