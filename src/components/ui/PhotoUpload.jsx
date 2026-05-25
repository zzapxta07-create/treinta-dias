import { useRef, useState } from 'react';

const MAX_SIZE_MB = 3;
const MAX_PX     = 1024;

function resizeToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoUpload({ value, onChange, label = 'Subir foto' }) {
  const inputRef  = useRef();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Foto muy grande (máx ${MAX_SIZE_MB}MB)`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const b64 = await resizeToBase64(file);
      onChange(b64);
    } catch {
      setError('Error al procesar la foto.');
    } finally {
      setLoading(false);
    }
  }

  const isBase64 = value?.startsWith('data:');
  const imgSrc   = isBase64 ? value : (value?.startsWith('/') ? value : null);

  return (
    <div className="flex flex-col items-center gap-2">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="evidencia"
          className="w-32 h-32 object-cover rounded-xl border border-[#2C2C2C] cursor-pointer"
          onClick={() => inputRef.current?.click()}
        />
      ) : (
        <div
          className="w-32 h-32 flex items-center justify-center rounded-xl border-2 border-dashed border-[#2C2C2C] cursor-pointer hover:border-[#6B7280] transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-[#6B7280] border-t-white rounded-full animate-spin" />
            : <span className="text-[#6B7280] text-xs text-center px-2">{label}</span>
          }
        </div>
      )}
      {value && !loading && (
        <button type="button" className="text-xs text-[#6B7280] hover:text-white underline"
          onClick={() => { onChange(null); }}>
          Quitar foto
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFile} />
    </div>
  );
}
