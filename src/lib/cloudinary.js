export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Endpoint "auto" lida automaticamente com imagens, vídeos, PDFs e áudios
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao fazer upload no Cloudinary');
    }

    const data = await response.json();
    return data.secure_url; // URL pública e segura (https) do arquivo
};
