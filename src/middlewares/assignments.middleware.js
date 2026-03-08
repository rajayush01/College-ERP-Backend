import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../config/r2.js";

const ALLOWED_FOLDERS = ["assignments"];

export const getAssignmentUploadUrl = async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (fileType !== "application/pdf") {
    return res.status(400).json({ message: "Only PDF allowed" });
  }

  const safeName = fileName.replace(/\s+/g, "-").toLowerCase();
  const key = `Elite8-collegeERP/assignments/${Date.now()}-${safeName}`;

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
};
