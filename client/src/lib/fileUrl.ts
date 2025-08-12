// pages/api/get-file-url.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";

const s3 = new S3Client({
    region: process.env.REGION,
    endpoint: process.env.ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_SECRET!,
    },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Missing or invalid key" });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: "your-private-bucket-name",
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    res.status(200).json({ url: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate presigned URL" });
  }
}
