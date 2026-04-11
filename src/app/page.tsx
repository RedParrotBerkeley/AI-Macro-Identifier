import { AnalysisWorkbench } from "@/components/analysis-workbench";
import { demoAnalysis } from "@/lib/demo-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937,transparent_35%),linear-gradient(180deg,#0b1020_0%,#111827_45%,#f8fafc_45%,#f8fafc_100%)] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-10">
        <AnalysisWorkbench initialAnalysis={demoAnalysis} />
      </section>
    </main>
  );
}
