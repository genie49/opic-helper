'use client';

import { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '@/lib/whisper/browserCheck';

interface Props {
  children: React.ReactNode;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BrowserCheck({ children }: Props) {
  const [compatibility, setCompatibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBrowserCompatibility().then(setCompatibility).finally(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">호환성 체크 중...</p>
        </div>
      </div>
    );
  }

  if (!compatibility || !compatibility.isCompatible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 overflow-hidden">
          <CardHeader className="bg-rose-500 text-white pt-10 pb-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <CardTitle className="text-2xl font-black">브라우저 호환성 경고</CardTitle>
            <CardDescription className="text-rose-100/80 font-medium">현재 브라우저에서는 서비스 이용이 제한됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'WebGPU 지원', ok: compatibility?.webgpu },
                { label: 'HTTPS 연결', ok: compatibility?.https },
                { label: '음성 녹음', ok: compatibility?.mediaRecorder },
                { label: '최신 엔진', ok: compatibility?.isChrome || compatibility?.isEdge },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border flex flex-col items-center gap-2 ${item.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  {item.ok ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800">권장 브라우저:</h4>
              <ul className="grid grid-cols-1 gap-2">
                <li className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Google Chrome 113+
                </li>
                <li className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-semibold text-slate-600 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Microsoft Edge 113+
                </li>
              </ul>
            </div>

            <Button asChild className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
              <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
                Chrome 다운로드 하기
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
