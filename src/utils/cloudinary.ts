/**
 * Cloudinary Unsigned Upload Utility
 * Securely uploads images from the browser directly to Cloudinary.
 */
export async function uploadToCloudinary(file: File, shorten = false): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dlpkssnph"; // Sandbox cloud name fallback
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "devoverflow_preset"; // Unsigned preset fallback

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
  }

  const data = await response.json();

  if (shorten) {
    // Return a short representation to fit within Appwrite 50-character schema limits
    return `c:${data.public_id}.${data.format}`;
  }

  return data.secure_url; // Returns the public HTTPS URL
}
