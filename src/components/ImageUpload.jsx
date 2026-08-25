import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

const MAX_DIM = 1280;   // lado maior máximo
const JPEG_QUALITY = 0.82;

/** Redimensiona e comprime a imagem para < MAX_DIM, retornando um Blob JPEG */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        if (scale >= 1 && file.type === 'image/jpeg') return resolve(file);

        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem')), 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({ images = [], onChange, maxImages = 3 }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      alert(`Máximo de ${maxImages} imagens.`);
      return;
    }

    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const blob     = await compressImage(file);
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const path     = `products/${filename}`;

        const { error } = await supabase.storage
          .from('products')
          .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });

        if (error) throw error;

        const { data } = supabase.storage.from('products').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange([...images, ...urls]);
    } catch (err) {
      alert('Erro ao fazer upload: ' + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = async (url, index) => {
    // Extrair path da URL
    const path = url.split('/products/').pop();
    try {
      await supabase.storage.from('products').remove([`products/${path}`]);
    } catch (err) { console.error(err); }
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="image-upload-wrap">
      <div className="image-upload-grid">
        {images.map((url, i) => (
          <div key={i} className="image-upload-thumb">
            <img src={url} alt={`Foto ${i + 1}`} />
            <button className="image-remove-btn" onClick={() => removeImage(url, i)} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
            {i === 0 && <span className="image-main-badge">Principal</span>}
          </div>
        ))}

        {images.length < maxImages && (
          <div className="image-upload-add" onClick={() => inputRef.current?.click()}>
            {uploading ? (
              <i className="fa-solid fa-spinner fa-spin" style={{ color:'var(--red)', fontSize:'1.5rem' }} />
            ) : (
              <>
                <i className="fa-solid fa-camera" style={{ fontSize:'1.5rem', color:'var(--gray-400)' }} />
                <span>Adicionar foto</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display:'none' }}
        onChange={handleUpload}
      />

      <p style={{ fontSize:'.78rem', color:'var(--gray-400)', marginTop:'.5rem' }}>
        Até {maxImages} fotos · JPG, PNG ou WebP · redimensionadas automaticamente
      </p>
    </div>
  );
}