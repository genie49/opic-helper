import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function RoleplayPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">롤플레이</h1>
        <p className="text-muted-foreground">
          AI와 실시간 대화로 롤플레이 문제를 연습하세요
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar - Scenario Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시나리오 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">상황</p>
                <p className="text-lg font-semibold text-primary">카페 위치 안내</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">역할</p>
                <p className="text-sm">친구에게 카페 위치를 전화로 안내하기</p>
              </div>
              <div>
                <p className="text-sm font-medium">예상 질문 수</p>
                <p className="text-lg">3-4개</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>대화 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 질문을 잘 듣고 답변하세요</li>
                <li>• 자연스러운 대화 흐름 유지</li>
                <li>• 구체적인 정보 제공</li>
                <li>• 적절한 연결어 사용</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>통계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">대화 수</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">평균 점수</span>
                <span className="font-semibold">7.8</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Chat Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>롤플레이 시나리오</CardTitle>
              <CardDescription>상황을 확인하고 대화를 시작하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <p className="text-lg leading-relaxed">
                  친구와 카페에서 만나기로 했는데, 친구가 길을 모릅니다.
                  전화로 카페의 위치와 특징을 설명하고 친구의 질문 3-4가지에 답해주세요.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>대화</CardTitle>
              <CardDescription>AI와 실시간으로 대화하세요</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 space-y-4 mb-4 p-4 bg-muted/30 rounded-lg overflow-y-auto min-h-[300px]">
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    AI
                  </div>
                  <div className="flex-1 bg-background p-3 rounded-lg border">
                    <p className="text-sm">
                      안녕! 지금 역 앞에 있는데 카페가 어디에 있어?
                    </p>
                  </div>
                </div>

                {/* User Message Example */}
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm">
                      역에서 나와서 오른쪽으로 가면 큰 편의점이 보일 거야. 그 건물 2층에 있어!
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-semibold">
                    나
                  </div>
                </div>

                {/* Placeholder for no messages */}
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">대화를 시작하려면 아래 버튼을 눌러주세요</p>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-1 text-sm text-muted-foreground">
                    녹음 준비 중...
                  </div>
                  <Button size="sm">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    녹음
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    대화 종료
                  </Button>
                  <Button className="flex-1">
                    대화 시작
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
