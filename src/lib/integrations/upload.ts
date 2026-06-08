export function getCloudinaryUploadConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    hasApiKey: Boolean(process.env.CLOUDINARY_API_KEY),
    hasApiSecret: Boolean(process.env.CLOUDINARY_API_SECRET),
    isConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    ),
  };
}
