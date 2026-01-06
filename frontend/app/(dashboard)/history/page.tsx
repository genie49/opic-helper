import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HistoryPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-2 bg-slate-900 rounded-xl text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            학습 히스토리
          </h1>
          <p className="mt-1 text-muted-foreground ml-12">
            당신의 성장 궤적을 확인하고 취약점을 파악하세요.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm ml-12 md:ml-0">
          <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs h-9 px-4">이번 주</Button>
          <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs h-9 px-4 bg-slate-100 text-slate-900">이번 달</Button>
          <Button variant="ghost" size="sm" className="rounded-lg font-bold text-xs h-9 px-4">전체</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '총 연습 횟수', value: '48회', sub: '+12 이번 주', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>, color: 'bg-blue-50 text-blue-600' },
          { label: '평균 평점', value: '78점', sub: '+3.2% 상승', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, color: 'bg-amber-50 text-amber-600' },
          { label: '누적 학습 시간', value: '12.5h', sub: '목표 달성 82%', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: 'bg-emerald-50 text-emerald-600' },
          { label: '연속 학습', value: '15일', sub: '최고 기록 경신 중', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, color: 'bg-rose-50 text-rose-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</div>
              <p className="text-xs font-bold text-slate-400 mt-1 italic">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity List */}
      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold">상세 활동 기록</CardTitle>
            <CardDescription>연습별 세부 평가 항목을 확인하세요.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {[
              { title: '카페 - 기억에 남는 경험', level: 'IM3', score: 85, time: '2시간 전', tags: ['발화량 9', '문법 8', '어휘 7'], feedback: '문장 수가 충분하고 도입-전개 구조가 아주 양호합니다.' },
              { title: '집 - 현재 거주지 묘사', level: 'IM2', score: 75, time: '어제', tags: ['발화량 8', '문법 7', '어휘 7'], feedback: '전반적으로 유창하나 더 다양한 형용사를 사용하면 좋습니다.' },
              { title: '수영 - 일상 루틴', level: 'IM2', score: 70, time: '2일 전', tags: ['발화량 7', '문법 7', '어휘 6'], feedback: '접속사 활용을 늘려 문장의 연결성을 개선해 보세요.' },
            ].map((activity, i) => (
              <div key={i} className="group flex flex-col md:flex-row md:items-center gap-6 p-8 transition-all hover:bg-slate-50">
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 group-hover:border-primary/20 transition-all">
                    <span className="text-xl font-black text-primary">{activity.level}</span>
                  </div>
                  <div className="md:hidden flex-1">
                    <h4 className="font-bold text-slate-800">{activity.title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{activity.time}</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="hidden md:flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">{activity.title}</h4>
                    <span className="text-xs font-bold text-slate-400 italic">{activity.time}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {activity.tags.map((tag, j) => (
                      <span key={j} className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                    <div className="flex-1" />
                    <div className="text-sm font-black text-slate-700">{activity.score}<span className="text-[10px] font-normal text-slate-400 ml-0.5">/ 100</span></div>
                  </div>
                  
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm text-sm text-slate-600 leading-relaxed group-hover:border-primary/10 transition-all">
                    <span className="font-black text-primary mr-2">AI FEEDBACK</span>
                    {activity.feedback}
                  </div>
                </div>
                
                <div className="shrink-0 flex md:flex-col items-center justify-between md:justify-center gap-4">
                  <Button variant="ghost" size="sm" className="text-slate-400 font-bold hover:text-primary">상세 리포트</Button>
                  <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 hover:bg-primary hover:text-white hover:border-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
            <Button variant="outline" className="h-12 px-10 font-bold rounded-xl border-slate-200 hover:bg-white hover:shadow-md transition-all">
              이전 기록 더 불러오기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
