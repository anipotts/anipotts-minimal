import FadeIn from "@/components/FadeIn";

export default function ConnectPage() {
  return (
    <div className="flex flex-col gap-12 pb-20">
      <FadeIn>
        <h1 className="text-4xl font-bold font-heading text-gray-100">connect</h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
          If you're working with llm orchestration systems and think I can help, I'd love to hear from you.
        </p>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-gray-500">work / collaborations</span>
            <a href="mailto:anirudhpottammal@nyu.edu" className="text-lg text-gray-200 hover:text-accent-400 transition-colors">
              reach out at anirudhpottammal at nyu dot edu
            </a>
          </div>

          <div className="flex flex-col gap-2">
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
  );
}
