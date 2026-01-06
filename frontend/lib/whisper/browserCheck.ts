export async function checkWebGPUSupport(): Promise<boolean> {
  if (!navigator || !(navigator as any).gpu) {
    return false;
  }

  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

export async function checkBrowserCompatibility() {
  const hasWebGPU = await checkWebGPUSupport();
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  return {
    webgpu: hasWebGPU,
    mediaRecorder: hasMediaRecorder,
    https: isHTTPS,
    isCompatible: hasWebGPU && hasMediaRecorder && isHTTPS,
    isChrome,
  };
}
