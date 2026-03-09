import Link from 'next/link';
const tools = [
  {
    name: 'Image Generator',
    description: 'Create polished images by describing use cases or the image you want based on the Avail brand.',
    href: '/image-generator',
  },
  {
    name: 'Pixel Generator',
    description: 'Create pixel art icons from prompts, upload images, or draw manually with a built-in editor.',
    href: '/pixel-generator',
  },
  {
    name: 'Storyboard Generator',
    description: 'Break down video concepts into visual storyboards with AI-generated shots and descriptions.',
    href: '/video-generator',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://availproject.org" target="_blank" rel="noopener noreferrer" aria-label="Visit Avail Project website">
            <img src="/images/AvailLogoWorkdmarkBlue.svg" alt="Avail Design Tools" className="h-8 w-auto" />
          </a>
          <Link
            href="/gallery"
            className="brand-link"
          >
            Open Gallery →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            Create Design Assets
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Pick a tool below based on your application.
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
                className="brand-link inline-flex items-center font-medium"
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
