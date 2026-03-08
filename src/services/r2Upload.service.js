import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../config/r2.js";
import crypto from "crypto";

/**
 * R2 Upload Service
 * Handles file uploads to Cloudflare R2 with organized folder structure
 */

/**
 * Generate unique filename with timestamp and random string
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Upload file to R2 with organized folder structure
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} category - Main category (student-documents, teacher-documents, assignments, etc.)
 * @param {string} subFolder - Sub folder (student ID, teacher ID, etc.)
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{fileUrl: string, fileKey: string}>}
 */
export const uploadToR2 = async (fileBuffer, originalName, category, subFolder, mimetype) => {
  try {
    const uniqueFilename = generateUniqueFilename(originalName);
    // Add schoolERP as the main folder prefix
    const fileKey = `collegeERP/${category}/${subFolder}/${uniqueFilename}`;

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimetype,
      // Make files publicly accessible
      ACL: 'public-read'
    };

    const command = new PutObjectCommand(uploadParams);
    await r2Client.send(command);

    // Construct public URL
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

    return {
      fileUrl,
      fileKey,
      originalName
    };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
};

// Note: For photo uploads, use the main uploadToR2 function with appropriate category
// Example: uploadToR2(buffer, filename, "student-photos", studentId, mimetype)
// Example: uploadToR2(buffer, filename, "teacher-photos", teacherId, mimetype)

/**
 * Delete file from R2
 * @param {string} fileKey - File key in R2
 * @returns {Promise<boolean>}
 */
export const deleteFromR2 = async (fileKey) => {
  try {
    const deleteParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey
    };

    const command = new DeleteObjectCommand(deleteParams);
    await r2Client.send(command);
    
    return true;
  } catch (error) {
    console.error('R2 Delete Error:', error);
    throw new Error(`Failed to delete file from R2: ${error.message}`);
  }
};

/**
 * Upload multiple files to R2
 * @param {Array} files - Array of file objects with buffer, originalName, mimetype
 * @param {string} category - Main category
 * @param {string} subFolder - Sub folder
 * @returns {Promise<Array>}
 */
export const uploadMultipleToR2 = async (files, category, subFolder) => {
  try {
    const uploadPromises = files.map(file => 
      uploadToR2(file.buffer, file.originalname, category, subFolder, file.mimetype)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple R2 Upload Error:', error);
    throw new Error(`Failed to upload multiple files to R2: ${error.message}`);
  }
};

/**
 * Delete multiple files from R2
 * @param {Array<string>} fileKeys - Array of file keys to delete
 * @returns {Promise<Array>}
 */
export const deleteMultipleFromR2 = async (fileKeys) => {
  try {
    const deletePromises = fileKeys.map(fileKey => deleteFromR2(fileKey));
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error('Multiple R2 Delete Error:', error);
    throw new Error(`Failed to delete multiple files from R2: ${error.message}`);
  }
};

/**
 * Helper function to extract file key from R2 URL
 * @param {string} fileUrl - Full R2 URL
 * @returns {string} - File key
 */
export const extractFileKeyFromUrl = (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error extracting file key from URL:', error);
    return null;
  }
};