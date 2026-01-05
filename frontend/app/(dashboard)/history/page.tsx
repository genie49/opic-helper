import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HistoryPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">학습 기록</h1>
          <p className="text-muted-foreground">
            지금까지의 학습 활동을 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">이번 주</Button>
          <Button variant="outline">이번 달</Button>
          <Button variant="outline">전체</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 문제 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.8</div>
            <p className="text-xs text-muted-foreground">+0.3 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">학습 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">연속 학습일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15일</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>최근 학습 기록 목록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Activity Item 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">8.5</span>
                </div>
                <div className="w-[2px] h-full bg-border mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">카페 - 기억에 남는 경험</h4>
                    <p className="text-sm text-muted-foreground">평가 레벨: IM3</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2시간 전</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      발화량: 9/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      문법: 8/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                      어휘: 7/10
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">강점:</span> 문장 수가 충분하고 도입-전개 구조가 양호합니다.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Item 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">7.5</span>
                </div>
                <div className="w-[2px] h-full bg-border mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">집 - 현재 거주지 묘사</h4>
                    <p className="text-sm text-muted-foreground">평가 레벨: IM2</p>
                  </div>
                  <span className="text-sm text-muted-foreground">어제</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      발화량: 8/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      문법: 7/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                      어휘: 7/10
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">개선점:</span> 다양한 형용사를 사용하면 더 좋습니다.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Item 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">7.0</span>
                </div>
                <div className="w-[2px] h-full bg-border mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">수영 - 일상 루틴</h4>
                    <p className="text-sm text-muted-foreground">평가 레벨: IM2</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2일 전</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                      발화량: 7/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      문법: 7/10
                    </span>
                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                      어휘: 6/10
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">개선점:</span> 접속사 활용을 늘려보세요 (however, therefore 등).
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Load More Button */}
            <div className="text-center pt-4">
              <Button variant="outline">
                더 보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
