import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-4xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:p-12">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <SearchX className="h-6 w-6" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Error 404</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            The page you’re looking for doesn’t exist or may have moved. Use one of the options below to continue.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/studio">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Open Studio
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
