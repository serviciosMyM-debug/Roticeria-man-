export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-black py-10 text-white">
      <div className="container-app grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-black uppercase">Sabores de Barrio</h3>
          <p className="mt-2 text-zinc-300">Comida casera, rápida y lista para llevar.</p>
        </div>
        <div>
          <h4 className="font-bold uppercase">Horarios</h4>
          <p className="mt-2 text-zinc-300">Lunes a sábado · 11:00 a 15:00 y 19:00 a 23:30</p>
        </div>
        <div>
          <h4 className="font-bold uppercase">Ubicación</h4>
          <p className="mt-2 text-zinc-300">San Lorenzo, Santa Fe</p>
        </div>
      </div>
    </footer>
  );
}
