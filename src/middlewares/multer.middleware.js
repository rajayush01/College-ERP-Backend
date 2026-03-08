import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../config/r2.js";

/* =========================
   Generate Timetable Upload URL
========================= */
export const getTimetableUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType required" });
    }

    if (fileType !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    const safeName = fileName
      .replace(/\s+/g, "-")
      .toLowerCase();

    const key = `Elite8-collegeERP/timetables/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60
    });

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("❌ Timetable upload URL error:", err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};
