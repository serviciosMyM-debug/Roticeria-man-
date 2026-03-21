'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(formData: FormData) {
    setError('');
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });

    if (!response.ok) {
      const json = await response.json();
      setError(json.error || 'No se pudo iniciar sesión');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="container-app flex min-h-[70vh] items-center justify-center py-10">
      <form action={onSubmit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="text-3xl font-black uppercase">Login admin</h1>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña" required />
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        <button className="btn-primary w-full">Ingresar</button>
      </form>
    </main>
  );
}
