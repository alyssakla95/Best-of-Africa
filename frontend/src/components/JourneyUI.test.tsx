// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AsyncState, ProgressSteps, SubmitButton } from './JourneyUI';

afterEach(cleanup);

describe('journey UI primitives', () => {
  it('announces loading state without rendering stale content', () => {
    render(
      <AsyncState isLoading loadingLabel="Loading opportunities">
        <p>Loaded content</p>
      </AsyncState>,
    );
    expect(screen.getByRole('status', { name: 'Loading opportunities' })).toBeInTheDocument();
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
  });

  it('offers a retry action for recoverable errors', () => {
    render(
      <AsyncState error="The request could not be loaded." onRetry={() => undefined}>
        <p>Loaded content</p>
      </AsyncState>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('The request could not be loaded.');
    expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled();
  });

  it('marks the current lifecycle step for assistive technology', () => {
    render(
      <ProgressSteps
        label="Listing progress"
        steps={[
          { id: 'apply', label: 'Apply', status: 'complete' },
          { id: 'screen', label: 'Screening', status: 'current' },
          { id: 'list', label: 'Listed', status: 'upcoming' },
        ]}
      />,
    );
    expect(screen.getByRole('list', { name: 'Listing progress' })).toBeInTheDocument();
    expect(screen.getByText('Screening').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('prevents duplicate submissions while pending', () => {
    render(<SubmitButton pending pendingLabel="Submitting request…">Submit request</SubmitButton>);
    expect(screen.getByRole('button', { name: 'Submitting request…' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
