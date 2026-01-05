import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PracticePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">연습하기</h1>
        <p className="text-muted-foreground">
          맞춤형 문제로 OPIc 실력을 향상시키세요
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar - Question Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>문제 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">주제</p>
                <p className="text-2xl font-bold text-primary">카페</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">문제 유형</p>
                <p className="text-lg">경험 (Experience)</p>
              </div>
              <div>
                <p className="text-sm font-medium">난이도</p>
                <p className="text-lg">IM2</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">목표 시간</p>
                <p className="text-lg">90초</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>학습 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 도입 - 상황 설정</li>
                <li>• 전개 - 구체적 경험</li>
                <li>• 마무리 - 느낀 점</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Question & Answer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>문제</CardTitle>
              <CardDescription>아래 문제에 답변해주세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-lg leading-relaxed">
                  카페에서 있었던 기억에 남는 경험에 대해 말해주세요.
                  언제, 어디서, 누구와 갔는지, 그리고 어떤 일이 있었는지 자세히 설명해주세요.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>답변 녹음</CardTitle>
              <CardDescription>준비가 되면 녹음 버튼을 눌러주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    녹음 준비 완료
                  </p>
                  <Button size="lg" className="w-48">
                    녹음 시작
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  문제 건너뛰기
                </Button>
                <Button className="flex-1">
                  다음 문제
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>오늘의 진행 상황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">완료</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">진행 중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">8.2</p>
                  <p className="text-sm text-muted-foreground">평균 점수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
