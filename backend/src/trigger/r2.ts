/**
 * R2 storage upload via S3 API
 * 
 * This runs on Trigger.dev infrastructure, not Cloudflare Workers,
 * so we use S3 API for R2 access instead of Worker bindings.
 */

import { logger } from "@trigger.dev/sdk/v3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getEnvVar, base64ToBuffer } from "./utils";

export function createS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getEnvVar("R2_ENDPOINT"), // e.g., https://<account_id>.r2.cloudflarestorage.com
    credentials: {
      accessKeyId: getEnvVar("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export async function uploadToR2(
  audioBase64: string,
  userId: string,
  recordingType: string
): Promise<string | null> {
  logger.info(`📤 Uploading ${recordingType} to R2...`);
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    const s3 = createS3Client();
    
    const timestamp = Date.now();
    const key = `recordings/${userId}/${recordingType}_${timestamp}.${extension}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: getEnvVar("R2_BUCKET_NAME"),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        userId,
        recordingType,
        uploadedAt: new Date().toISOString(),
      },
    }));
    
    const backendUrl = getEnvVar("BACKEND_URL");
    const audioUrl = `${backendUrl}/audio/${key}`;
    
    logger.info(`✅ Uploaded to R2: ${audioUrl}`);
    return audioUrl;
  } catch (error) {
    logger.error(`❌ R2 upload error:`, { error });
    return null;
  }
}
