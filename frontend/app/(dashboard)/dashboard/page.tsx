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
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          {user ? `${user.displayName}님의 OPIc 학습 진행 상황` : "OPIc 학습 진행 상황을 확인하세요"}
        </p>
      </div>

      {/* User Level Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>현재 레벨</CardTitle>
            <CardDescription>
              목표: {user.targetLevel.levelName} ({user.targetLevel.levelCode})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">
                {user.currentLevel.levelCode}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {user.currentLevel.levelName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.targetLevel.levelName}까지 {(stats?.totalAttempts || 0)}회 시도
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 시도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              총 연습 횟수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">숙달 문제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.masteredQuestions || 0}</div>
            <p className="text-xs text-muted-foreground">
              완전히 마스터함
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressQuestions || 0}</div>
            <p className="text-xs text-muted-foreground">
              학습 중인 문제
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgScore || "0.0"}</div>
            <p className="text-xs text-muted-foreground">
              전체 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>빠른 시작</CardTitle>
            <CardDescription>
              바로 연습을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/practice")}
            >
              문제 풀기 시작
            </Button>
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => router.push("/roleplay")}
            >
              롤플레이 연습
            </Button>
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => router.push("/survey")}
            >
              서베이 수정
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>학습 현황</CardTitle>
            <CardDescription>
              문제별 숙달도
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">숙달됨</span>
                <span className="text-sm font-medium">{stats?.masteredQuestions || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">진행 중</span>
                <span className="text-sm font-medium">{stats?.inProgressQuestions || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">시도 안 함</span>
                <span className="text-sm font-medium">{stats?.notAttemptedQuestions || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>최근 피드백</CardTitle>
          <CardDescription>
            최근 연습 결과를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFeedbacks.length > 0 ? (
              recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="flex items-start gap-4 p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none line-clamp-2">
                      {feedback.questionText}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {feedback.evaluatedLevel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        점수: {feedback.totalScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 연습 기록이 없습니다. 연습을 시작해보세요!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
