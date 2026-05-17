import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The service reads `import.meta.env.VITE_CLOUDINARY_*` AT MODULE LOAD
// (file-level constants), so we must:
//   1) Stub the env vars BEFORE importing.
//   2) Reset modules so the next import re-evaluates the file with the
//      new env values.
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('cloudinaryService.uploadImage', () => {
  it('throws a clear error if Cloudinary is NOT configured', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'tu_cloud_name'); // placeholder value
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'mi-preset');
    const { uploadImage } = await import('./cloudinaryService');

    await expect(uploadImage(new Blob(['x']))).rejects.toThrow(/Cloudinary no configurado/);
  });

  it('uploads the file and returns secure_url on success', async () => {
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

  it('throws if the upload fails (response.ok=false)', async () => {
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
