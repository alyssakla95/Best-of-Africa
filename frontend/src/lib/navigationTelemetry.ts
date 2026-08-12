import { api } from '@/services/api';
import type { JourneyId } from './navigation';

export type JourneyNavigationSource = 'desktop_menu' | 'mobile_menu' | 'mobile_dock' | 'journey_bar' | 'home_gateway' | 'footer';

export function trackJourneySelection(journey: JourneyId, source: JourneyNavigationSource, destination: string) {
  api.trackEvent({
    type: 'click',
    resource_id: `journey:${source}:${journey}`,
    path: destination,
  });
}
