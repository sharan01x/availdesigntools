import Link from 'next/link';
const tools = [
  {
    name: 'Video Generator',
    description: 'Generate cinematic AI videos from text prompts using Replicate models.',
    href: '/video-generator',
  },
  {
    name: 'Image Generator',
    description: 'Create polished AI images with FLUX.2 Pro from a simple prompt.',
    href: '/image-generator',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Avail Design Tools</h1>
          <Link
            href="/gallery"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Open Gallery →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            AI Tools for Visual Creation
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Pick a tool below. Avail Design Tools currently includes a video generator and an image generator,
            with a shared gallery for everything you create.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <article
              key={tool.name}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
            >
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{tool.name}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{tool.description}</p>
              <Link
                href={tool.href}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Open Tool →
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
