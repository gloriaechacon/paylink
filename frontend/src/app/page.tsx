import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <span className="text-green-400 text-sm font-mono tracking-widest uppercase">
            Solana · Cross-chain · Instant
          </span>
          <h1 className="text-6xl font-bold tracking-tight">
            Cobrar en crypto
            <br />
            <span className="text-green-400">nunca fue tan fácil</span>
          </h1>
          <p className="text-gray-400 text-xl">
            Generá un link. Tu cliente paga con lo que tenga.
            <br />
            Vos recibís USDC en Solana.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-green-400 text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-green-300 transition-colors"
          >
            Crear mi link de pago
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
          <div>
            <p className="text-3xl font-bold text-green-400">$0.001</p>
            <p className="text-gray-500 text-sm">fee por tx</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">&lt;1s</p>
            <p className="text-gray-500 text-sm">confirmación</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">10+</p>
            <p className="text-gray-500 text-sm">chains soportadas</p>
          </div>
        </div>
      </div>
    </main>
  );
}
