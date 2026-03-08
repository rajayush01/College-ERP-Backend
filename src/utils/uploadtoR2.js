import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2.js";

export const uploadToR2 = async ({ buffer, mimetype, key }) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
};
