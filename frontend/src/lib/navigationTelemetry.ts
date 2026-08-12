import { api } from '@/services/api';
import type { JourneyId } from './navigation';

export type JourneyNavigationSource = 'desktop_menu' | 'mobile_menu' | 'mobile_dock' | 'journey_bar' | 'home_gateway' | 'footer';
export type JourneyCompletionSignal = 'structured_report_open' | 'review_submission' | 'specialist_request_submitted' | 'decision_room_created';

export function trackJourneySelection(journey: JourneyId, source: JourneyNavigationSource, destination: string) {
  api.trackEvent({
    type: 'click',
    resource_id: `journey:${source}:${journey}`,
    path: destination,
  });
}

export function trackJourneyProgress(journey: JourneyId, destination: string) {
  api.trackEvent({
    type: 'journey_progress',
    resource_id: `journey:${journey}:page_open`,
    path: destination,
  });
}

export function trackJourneyCompletion(journey: JourneyId, signal: JourneyCompletionSignal, destination: string) {
  api.trackEvent({
    type: 'journey_complete',
    resource_id: `journey:${journey}:${signal}`,
    path: destination,
  });
}
