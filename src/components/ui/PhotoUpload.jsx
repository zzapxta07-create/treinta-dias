import { useRef, useState } from 'react';
import api from '../../api/index.js';

// Uploads to backend, returns path string via onChange
export default function PhotoUpload({ value, onChange, label = 'Subir foto' }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post('/api/uploads/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.data.path);
    } catch (err) {
      setError('Error al subir la foto. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  const imgSrc = value
    ? (value.startsWith('http') || value.startsWith('/') ? value : null)
    : null;

  return (
    <div className="flex flex-col items-center gap-2">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="uploaded"
          className="w-32 h-32 object-cover rounded-xl border border-[#2C2C2C] cursor-pointer"
          onClick={() => inputRef.current?.click()}
        />
      ) : (
        <div
          className="w-32 h-32 flex items-center justify-center rounded-xl border-2 border-dashed border-[#2C2C2C] cursor-pointer hover:border-[#6B7280] transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? <div className="w-5 h-5 border-2 border-[#6B7280] border-t-white rounded-full animate-spin" />
            : <span className="text-[#6B7280] text-xs text-center px-2">{label}</span>
          }
        </div>
      )}
      {value && !uploading && (
        <button
          className="text-xs text-[#6B7280] hover:text-white underline"
          onClick={() => inputRef.current?.click()}
        >
          Cambiar foto
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
