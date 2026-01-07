"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalAttempts: number;
  masteredQuestions: number;
  inProgressQuestions: number;
  notAttemptedQuestions: number;
  avgScore: string;
  levelHistory: Array<{ level: string; achievedAt: Date }>;
}

interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  currentLevel: {
    id: string;
    levelCode: string;
    levelName: string;
  };
  targetLevel: {
    id: string;
    levelCode: string;
    levelName: string;
  };
}

interface RecentFeedback {
  id: string;
  questionId: string;
  questionText: string;
  evaluatedLevel: string;
  totalScore: number;
  createdAt: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState<RecentFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setUser(data.user);
      setStats(data.stats);
      setRecentFeedbacks(data.recentFeedbacks);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">대시보드</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {user ? (
              <>반가워요, <span className="font-semibold text-foreground">{user.displayName}</span>님! 오늘도 목표 등급을 향해 달려볼까요?</>
            ) : (
              "OPIc 학습 진행 상황을 확인하세요"
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => router.push("/practice")}
            className="shadow-lg shadow-primary/20"
          >
            연습 시작하기
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Level Info Card */}
        {user && (
          <Card className="lg:col-span-1 border-none shadow-xl shadow-primary/10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </div>
            <CardHeader>
              <CardTitle className="text-primary-foreground/80 font-medium">현재 실력</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-7xl font-black tracking-tighter">
                  {user.currentLevel?.levelCode || "-"}
                </div>
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-2">
                    {user.currentLevel?.levelName || "미설정"}
                  </div>
                  <p className="text-primary-foreground/70 text-sm">
                    목표: <span className="text-white font-semibold">{user.targetLevel?.levelCode || "-"}</span> ({user.targetLevel?.levelName || "미설정"})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid gap-4 grid-cols-2">
          <Card className="border-none shadow-md shadow-primary/5 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">전체 시도</CardTitle>
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.totalAttempts || 0}회</div>
              <p className="mt-1 text-xs text-muted-foreground">누적 학습 횟수</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-primary/5 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">평균 점수</CardTitle>
              <div className="p-2 bg-accent/20 rounded-lg text-accent-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.avgScore || "0.0"}점</div>
              <p className="mt-1 text-xs text-muted-foreground">전체 평균 평점</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-primary/5 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">숙달 문제</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.masteredQuestions || 0}개</div>
              <p className="mt-1 text-xs text-muted-foreground">완벽히 정복한 문제</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-primary/5 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">진행 중</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats?.inProgressQuestions || 0}개</div>
              <p className="mt-1 text-xs text-muted-foreground">학습 진행 중인 문제</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions Card */}
        <Card className="border-none shadow-lg shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-xl font-bold">빠른 실행</CardTitle>
            <CardDescription>학습 도구에 바로 접근하세요</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6">
            <Button
              className="w-full h-14 justify-start px-6 text-lg font-semibold transition-all hover:translate-x-1"
              variant="default"
              onClick={() => router.push("/practice")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
              실전 연습 문제 풀기
            </Button>
            <Button
              className="w-full h-14 justify-start px-6 text-lg font-semibold transition-all hover:translate-x-1"
              variant="outline"
              onClick={() => router.push("/roleplay")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              AI 롤플레이 연습
            </Button>
            <Button
              className="w-full h-14 justify-start px-6 text-lg font-semibold transition-all hover:translate-x-1"
              variant="secondary"
              onClick={() => router.push("/survey")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-muted-foreground"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              맞춤 설정 (서베이) 수정
            </Button>
          </CardContent>
        </Card>

        {/* Study Progress Card */}
        <Card className="border-none shadow-lg shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-xl font-bold">학습 현황</CardTitle>
            <CardDescription>전체 문제 대비 숙달도</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {(() => {
                const total = (stats?.masteredQuestions || 0) + (stats?.inProgressQuestions || 0) + (stats?.notAttemptedQuestions || 0) || 1;
                const masteredPercent = Math.round(((stats?.masteredQuestions || 0) / total) * 100);
                
                return (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>학습 달성률</span>
                        <span className="text-primary">{masteredPercent}%</span>
                      </div>
                      <div className="h-4 w-full bg-muted rounded-full overflow-hidden p-0.5">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${masteredPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100/50">
                        <div className="text-xl font-bold text-emerald-700">{stats?.masteredQuestions || 0}</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">숙달</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="text-xl font-bold text-primary">{stats?.inProgressQuestions || 0}</div>
                        <div className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">진행</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                        <div className="text-xl font-bold text-muted-foreground">{stats?.notAttemptedQuestions || 0}</div>
                        <div className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">미시도</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedbacks Card */}
      <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">최근 연습 리포트</CardTitle>
              <CardDescription>가장 최근에 받은 AI 피드백입니다</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/history")} className="text-primary font-semibold hover:bg-primary/5">
              전체 보기 →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentFeedbacks.length > 0 ? (
              recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="group flex items-center gap-6 p-6 transition-all hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/history/${feedback.id}`)}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background shadow-sm border border-border group-hover:border-primary/20 group-hover:shadow-md transition-all">
                    <span className="text-lg font-bold text-primary">{feedback.evaluatedLevel}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {feedback.questionText}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(feedback.createdAt).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-foreground">{feedback.totalScore}<span className="text-xs font-normal text-muted-foreground ml-0.5">/ 100</span></div>
                    <div className="mt-1 flex gap-1 justify-end">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1 w-3 rounded-full ${s <= (feedback.totalScore / 20) ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">아직 연습 기록이 없네요</h3>
                <p className="text-muted-foreground/70 mt-1 max-w-xs">연습을 시작하고 AI의 정밀한 피드백을 받아보세요.</p>
                <Button className="mt-6" variant="outline" onClick={() => router.push("/practice")}>첫 연습 시작하기</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
