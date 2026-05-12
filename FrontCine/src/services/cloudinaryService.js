const CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file) {
  if (!CLOUD || !PRESET || CLOUD === 'tu_cloud_name') {
    throw new Error('Cloudinary no configurado. Rellena VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en el archivo .env');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', PRESET);
  body.append('folder', 'lumen_cinema');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Error al subir (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url;
}
