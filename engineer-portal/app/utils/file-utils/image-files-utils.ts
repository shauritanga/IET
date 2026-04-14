/**
 * Converts a given file to a Base64-encoded string.
 *
 * @param file - The file to be converted into a Base64 string.
 * @returns A promise that resolves with the Base64-encoded string of the file.
 *          The promise is rejected if there's an error during the file reading process.
 */
export const generateBase64Image = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = (error) => {
            reject(new Error(JSON.stringify(error)));
        };
    });
};
