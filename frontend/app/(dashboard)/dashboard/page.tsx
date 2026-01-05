import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { questions, questionTopics, opicLevels } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";

export default async function DashboardPage() {
  // Fetch real data from database
  const [questionsCount] = await db.select({ count: count() }).from(questions);
  const [topicsCount] = await db.select({ count: count() }).from(questionTopics);
  const levels = await db.select().from(opicLevels).orderBy(opicLevels.levelOrder);
  const recentQuestions = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      questionType: questions.questionType,
      topicId: questions.topicId,
    })
    .from(questions)
    .limit(3);
  const topics = await db.select().from(questionTopics).limit(5);

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
            <CardTitle className="text-sm font-medium">OPIc 레벨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{levels.length}단계</div>
            <p className="text-xs text-muted-foreground">
              NL부터 AL까지
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가능한 문제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionsCount.count}</div>
            <p className="text-xs text-muted-foreground">
              다양한 주제로 준비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주제 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topicsCount.count}</div>
            <p className="text-xs text-muted-foreground">
              카페, 집, 여행 등
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 난이도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">IM2-IH</div>
            <p className="text-xs text-muted-foreground">
              중급 수준
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
            <CardTitle>사용 가능한 주제</CardTitle>
            <CardDescription>
              다양한 주제로 연습하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topics.slice(0, 5).map((topic) => (
                <div key={topic.id} className="flex items-center justify-between">
                  <span className="text-sm">{topic.topicName}</span>
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                    {topic.category}
                  </span>
                </div>
              ))}
              {topics.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  데이터를 시딩해주세요 (npm run db:seed)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Questions */}
      <Card>
        <CardHeader>
          <CardTitle>사용 가능한 문제</CardTitle>
          <CardDescription>
            데이터베이스에 저장된 문제 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuestions.map((question) => (
              <div key={question.id} className="flex items-start gap-4 p-3 rounded-lg border">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none line-clamp-2">
                    {question.questionText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    유형: {question.questionType}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  연습하기
                </Button>
              </div>
            ))}
            {recentQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 문제가 없습니다. 데이터를 시딩해주세요 (npm run db:seed)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
