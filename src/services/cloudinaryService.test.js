import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// El servicio lee `import.meta.env.VITE_CLOUDINARY_*` AL CARGAR el módulo
// (constantes a nivel de archivo), así que tenemos que:
//   1) Stubear las env antes de importar.
//   2) Resetear módulos para que la siguiente import re-evalúe el archivo
//      con las env nuevas.
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('cloudinaryService.uploadImage', () => {
  it('lanza error claro si Cloudinary NO está configurado', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'tu_cloud_name'); // valor placeholder
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'mi-preset');
    const { uploadImage } = await import('./cloudinaryService');

    await expect(uploadImage(new Blob(['x']))).rejects.toThrow(/Cloudinary no configurado/);
  });

  it('sube el archivo y devuelve secure_url cuando todo va bien', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'mi-cloud');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'mi-preset');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ secure_url: 'https://cdn/x.jpg' }),
    });
    const { uploadImage } = await import('./cloudinaryService');

    const url = await uploadImage(new Blob(['x']));

    expect(url).toBe('https://cdn/x.jpg');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/mi-cloud/image/upload',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza error si el upload falla (response.ok=false)', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'mi-cloud');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'mi-preset');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: { message: 'Boom' } }),
    });
    const { uploadImage } = await import('./cloudinaryService');

    await expect(uploadImage(new Blob(['x']))).rejects.toThrow(/Boom/);
  });
});
