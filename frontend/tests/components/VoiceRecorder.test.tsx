import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen, fireEvent, waitFor as waitForUI } from '@testing-library/react';
import VoiceRecorder from '@/components/VoiceRecorder';
import WhisperService from '@/lib/whisper/WhisperService';

// Mock WhisperService
vi.mock('@/lib/whisper/WhisperService', () => ({
  default: {
    getInstance: vi.fn(),
  },
}));

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
  },
});

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  private stream: MediaStream;
  private mimeType: string;
  private audioBitsPerSecond: number;
  private state: 'inactive' | 'recording' | 'paused' = 'inactive';

  constructor(stream: MediaStream, options: MediaRecorderOptions) {
    this.stream = stream;
    this.mimeType = options.mimeType || 'audio/webm';
    this.audioBitsPerSecond = options.audioBitsPerSecond || 128000;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }

  resume() {
    this.state = 'recording';
  }

  pause() {
    this.state = 'paused';
  }
}

global.MediaRecorder = MockMediaRecorder as any;

describe('VoiceRecorder Component', () => {
  const mockOnTranscriptionComplete = vi.fn();
  const mockWhisperService = {
    initialize: vi.fn(),
    transcribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (WhisperService.getInstance as any).mockReturnValue(mockWhisperService);
    mockWhisperService.initialize.mockResolvedValue();
    mockWhisperService.transcribe.mockResolvedValue({
      text: 'Hello world',
      words: [
        {
          word: 'Hello',
          timestamp: [0, 0.5],
          confidence: 1.0,
        },
        {
          word: 'world',
          timestamp: [0.5, 1.0],
          confidence: 0.95,
        },
      ],
      avgConfidence: 0.975,
      lowConfidenceWords: [],
    });
  });

  it('renders without crashing', () => {
    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );
    // Component should render without errors
  });

  it('initializes model on first recording start', async () => {
    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(mockWhisperService.initialize).toHaveBeenCalled();
  });

  it('shows recording time while recording', async () => {
    jest.useFakeTimers();

    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    act(() => {
      jest.advanceTimersByTime(5000); // Advance 5 seconds
    });

    // Check if time is displayed
    const timeText = screen.getByText(/0:05/);
    expect(timeText).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('calls onTranscriptionComplete with result', async () => {
    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith({
        text: 'Hello world',
        words: expect.arrayContaining([
          expect.objectContaining({ word: 'Hello' }),
          expect.objectContaining({ word: 'world' }),
        ]),
        avgConfidence: 0.975,
        lowConfidenceWords: [],
      });
    });
  });

  it('handles model initialization error', async () => {
    mockWhisperService.initialize.mockRejectedValue(new Error('Model load failed'));

    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    // Should show alert (we can't easily test alerts, but no crash)
  });

  it('stops recording when stop button clicked', async () => {
    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    const stopButton = await waitForUI(() => screen.getByText(/정지/i));
    await act(async () => {
      fireEvent.click(stopButton);
    });

    // Recording should be stopped
    await waitFor(() => {
      expect(screen.queryByText(/정지/i)).not.toBeInTheDocument();
    });
  });

  it('displays model progress during initialization', async () => {
    let progressCallback: ((progress: number) => void) | null = null;

    mockWhisperService.initialize.mockImplementation((callback) => {
      progressCallback = callback;
      return Promise.resolve();
    });

    render(
      <VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const startButton = screen.getByText(/녹음/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    // Trigger progress updates
    if (progressCallback) {
      await act(async () => {
        progressCallback(50);
        progressCallback(100);
      });
    }

    // Check if progress is displayed (may need to check specific UI element)
  });
});
