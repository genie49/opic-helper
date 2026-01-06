import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-xl shadow-primary/20">
            O
          </div>
          <span className="font-black text-3xl tracking-tight text-slate-800">OPIc Helper</span>
        </div>

        <div className="w-full max-w-[1000px] grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Info Section */}
          <div className="hidden md:block space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
              AI와 함께하는 가장 스마트한 <br />
              <span className="text-primary italic">OPIc 합격 전략.</span>
            </h2>
            <ul className="space-y-6">
              {[
                { title: '실시간 AI 평가', desc: '당신의 발화를 Grok AI가 5가지 기준으로 즉시 분석합니다.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> },
                { title: '정밀한 발음 체크', desc: '단어별 신뢰도 측정을 통해 취약한 발음을 교정합니다.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg> },
                { title: '맞춤형 시나리오', desc: '서베이 기반 관심사에 맞는 최적의 문제를 추천합니다.', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Login Card */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <Card className="border-none shadow-2xl shadow-slate-200 overflow-hidden bg-white/80 backdrop-blur-xl">
              <CardHeader className="space-y-2 text-center pt-10 pb-6">
                <CardTitle className="text-2xl font-black text-slate-800">시작하기</CardTitle>
                <CardDescription className="text-slate-500 px-8">
                  Google 계정으로 로그인하여 나만의 학습 데이터를 관리하고 AI 피드백을 받아보세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-10 pb-12">
                <form action="/auth/login" method="post">
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" fillOpacity="0.9"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity="0.8"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity="0.8"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity="0.8"/>
                    </svg>
                    Google로 3초 만에 시작
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="bg-white/50 px-4 text-slate-400">
                      OPIc Master Platform
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    가입 시 OPIc Helper의 <span className="underline cursor-pointer hover:text-primary">이용약관</span> 및 <span className="underline cursor-pointer hover:text-primary">개인정보처리방침</span>에 동의하게 됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
