import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 lg:pt-48 lg:pb-56">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(99,102,241,0.1)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="container mx-auto px-4 md:px-8 max-w-7xl text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
              AI와 함께하는 <span className="text-primary">OPIc 마스터</span>
            </h1>
            <p className="mt-8 text-xl text-muted-foreground leading-relaxed md:text-2xl">
              실시간 AI 평가와 정밀한 피드백으로 점수를 향상시키세요.
              <br className="hidden sm:inline" />
              당신의 목표 등급 달성을 위한 스마트한 학습 파트너.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-105">
                <Link href="/dashboard">무료로 시작하기</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-semibold bg-background/50 backdrop-blur-sm transition-all hover:bg-accent">
                <Link href="/practice">체험하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">학습 효율을 극대화하는 핵심 기능</h2>
            <p className="mt-4 text-lg text-muted-foreground">당신의 답변을 분석하고 가장 빠른 합격 길을 제시합니다.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-none shadow-lg shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14.71 12 2.5a.5.5 0 0 1 .8.4l-.8 8.11h6.2a.5.5 0 0 1 .4.87L10.5 24.1a.5.5 0 0 1-.8-.4l.8-8.11H4.3a.5.5 0 0 1-.3-.89Z"/></svg>
                </div>
                <CardTitle className="text-xl">실시간 AI 평가</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Grok AI가 5가지 평가 기준을 바탕으로 당신의 답변을 즉시 분석하고 보완점을 제시합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <CardTitle className="text-xl">개인 맞춤형 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  취약한 주제와 문법적 오류를 자동으로 파악하여 당신에게 꼭 필요한 문제를 우선적으로 추천합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic-2"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </div>
                <CardTitle className="text-xl">자연스러운 롤플레이</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  어색한 대화는 그만! 실제 상황 같은 시나리오를 통해 AI와 자연스럽게 대화하며 실전 감각을 익힙니다.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl md:px-16 md:py-24">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">준비는 끝났습니다.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
              지금 가입하고 목표 등급을 향한 첫 걸음을 내딛으세요.
              <br />
              무료 체험판을 통해 AI 성능을 직접 확인해보세요.
            </p>
            <div className="mt-10 flex justify-center">
              <Button size="xl" asChild variant="secondary" className="h-16 px-10 text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
                <Link href="/dashboard">지금 바로 시작하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs">O</div>
              <span className="font-bold text-lg tracking-tight">OPIc Helper</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 OPIc Helper. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">이용약관</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
