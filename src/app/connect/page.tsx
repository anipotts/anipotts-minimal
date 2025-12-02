import FadeIn from "@/components/FadeIn";

export default function ConnectPage() {
  return (
    <div className="flex flex-col gap-12 pb-20">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1">
          <FadeIn>
            <h1 className="text-xs font-bold uppercase tracking-widest text-gray-500">connect</h1>
          </FadeIn>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-col gap-8">
          <FadeIn delay={0.1}>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
              If you're working with llm orchestration systems and think I can help, I'd love to hear from you.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-8 mt-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-widest text-gray-500">email</span>
                <a href="mailto:anirudhpottammal@nyu.edu" className="text-lg text-gray-200 hover:text-accent-400 transition-colors">
                  anirudhpottammal@nyu.edu
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-widest text-gray-500">socials</span>
                <div className="flex gap-6 text-lg">
                  <a href="https://x.com/anirxdhp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent-400 transition-colors">
                    x → @anirxdhp
                  </a>
                  <a href="https://github.com/anipotts" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent-400 transition-colors">
                    github → anipotts
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
