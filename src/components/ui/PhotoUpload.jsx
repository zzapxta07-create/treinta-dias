import { useRef } from "react";

export default function PhotoUpload({ value, onChange, label = "Subir foto" }) {
  const inputRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {value ? (
        <img
          src={value}
          alt="uploaded"
          className="w-32 h-32 object-cover rounded-lg border border-[#333333] cursor-pointer"
          onClick={() => inputRef.current.click()}
        />
      ) : (
        <div
          className="w-32 h-32 flex items-center justify-center rounded-lg border-2 border-dashed border-[#333333] cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => inputRef.current.click()}
        >
          <span className="text-gray-500 text-xs text-center px-2">{label}</span>
        </div>
      )}
      {value && (
        <button
          className="text-xs text-gray-600 hover:text-gray-400 underline"
          onClick={() => inputRef.current.click()}
        >
          Cambiar foto
        </button>
      )}
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
