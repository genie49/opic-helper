import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 md:py-32">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
            AI 기반 OPIc 학습 서비스
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            실시간 AI 평가와 피드백으로 OPIc 점수를 향상시키세요.
            <br />
            맞춤형 학습으로 목표 레벨을 달성하세요.
          </p>
        </div>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link href="/dashboard">시작하기</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/practice">연습 모드</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-24 bg-muted/40">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>실시간 AI 평가</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Grok AI가 5가지 기준으로 답변을 즉시 평가하고 상세한 피드백을 제공합니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>맞춤형 학습</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                약한 주제를 자동으로 파악하고 집중 학습할 수 있도록 문제를 추천합니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>롤플레이 연습</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                실전처럼 AI와 대화하며 롤플레이 문제에 대비할 수 있습니다.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12 md:py-24">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="max-w-[600px] text-muted-foreground">
            Google 계정으로 간편하게 시작할 수 있습니다.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard">무료로 시작하기</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
