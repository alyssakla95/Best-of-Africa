// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BetaChatWidget } from './BetaChatWidget';
import { useMember } from '../../context/MemberContext';
import { useAudio } from '../../context/AudioContext';

vi.mock('../../context/MemberContext', () => ({ useMember: vi.fn() }));
vi.mock('../../context/AudioContext', () => ({ useAudio: vi.fn() }));

const memberState = { isMember: true } as ReturnType<typeof useMember>;
const audioState = (currentTrack: unknown) => ({ currentTrack }) as ReturnType<typeof useAudio>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('member chat floating-control priority', () => {
  it('renders the chat launcher when playback is inactive', () => {
    vi.mocked(useMember).mockReturnValue(memberState);
    vi.mocked(useAudio).mockReturnValue(audioState(null));

    render(<BetaChatWidget />);

    expect(screen.getByRole('button', { name: 'Open the analyst chat' })).toBeInTheDocument();
  });

  it('yields the floating-control area while an audio track is active', () => {
    vi.mocked(useMember).mockReturnValue(memberState);
    vi.mocked(useAudio).mockReturnValue(audioState({ title: 'Active briefing' }));

    render(<BetaChatWidget />);

    expect(screen.queryByRole('button', { name: 'Open the analyst chat' })).not.toBeInTheDocument();
  });
});
