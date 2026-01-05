import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          OPIc 학습 진행 상황을 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 레벨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">IM2</div>
            <p className="text-xs text-muted-foreground">
              목표: IH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">학습한 문제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +4 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.5</div>
            <p className="text-xs text-muted-foreground">
              / 10점 만점
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">연속 학습일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12일</div>
            <p className="text-xs text-muted-foreground">
              Great job!
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
            <Button className="w-full" size="lg">
              문제 풀기 시작
            </Button>
            <Button className="w-full" variant="outline" size="lg">
              롤플레이 연습
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>약한 주제</CardTitle>
            <CardDescription>
              집중 학습이 필요한 주제
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">카페 - 경험</span>
                <span className="text-sm font-medium text-destructive">5.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">여행 - 묘사</span>
                <span className="text-sm font-medium text-destructive">6.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">음악 - 루틴</span>
                <span className="text-sm font-medium text-yellow-600">6.8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            최근 학습 기록
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">카페 - 기억에 남는 경험</p>
                <p className="text-sm text-muted-foreground">
                  평가 레벨: IM3 | 점수: 8.2
                </p>
              </div>
              <div className="text-sm text-muted-foreground">2시간 전</div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">집 - 현재 거주지 묘사</p>
                <p className="text-sm text-muted-foreground">
                  평가 레벨: IM2 | 점수: 7.5
                </p>
              </div>
              <div className="text-sm text-muted-foreground">어제</div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">수영 - 일상 루틴</p>
                <p className="text-sm text-muted-foreground">
                  평가 레벨: IM2 | 점수: 7.0
                </p>
              </div>
              <div className="text-sm text-muted-foreground">2일 전</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
