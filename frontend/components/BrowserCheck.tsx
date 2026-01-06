'use client';

import { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '@/lib/whisper/browserCheck';

interface Props {
  children: React.ReactNode;
}

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">브라우저 호환성 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!compatibility || !compatibility.isCompatible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            브라우저 호환성 문제
          </h2>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              {compatibility?.webgpu ? '✅' : '❌'}
              <span>WebGPU 지원</span>
            </div>
            <div className="flex items-center gap-2">
              {compatibility?.https ? '✅' : '❌'}
              <span>HTTPS 연결</span>
            </div>
            <div className="flex items-center gap-2">
              {compatibility?.mediaRecorder ? '✅' : '❌'}
              <span>음성 녹음 지원</span>
            </div>
            {compatibility?.isChrome && (
              <div className="flex items-center gap-2">
                ✅
                <span>Chrome 브라우저</span>
              </div>
            )}
          </div>

          <p className="text-gray-700 mb-4">
            이 서비스를 이용하려면 다음 브라우저를 사용하세요:
          </p>

          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-6">
            <li>Google Chrome 113 이상</li>
            <li>Microsoft Edge 113 이상</li>
            <li>Android Chrome 121 이상</li>
          </ul>

          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Chrome 다운로드
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
