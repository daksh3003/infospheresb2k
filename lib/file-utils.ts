/**
 * Generates a safe, ASCII-only filename for storage to avoid issues with 
 * special characters, spaces, or long names in storage buckets.
 */
export const generateSafeStorageFileName = (fileName: string): string => {
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf(".");
    const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : "";

    // Generate a unique safe filename using timestamp and a random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);

    return `file_${timestamp}_${randomStr}${extension}`;
};
