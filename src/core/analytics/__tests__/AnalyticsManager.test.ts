import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsManager } from '../AnalyticsManager';
import { Analytics } from '../../../types/analytics';

describe('AnalyticsManager', () => {
  let analyticsManager: AnalyticsManager;
  const mockEvent: Analytics = {
    event: 'test_event',
    data: { key: 'value' },
    timestamp: Date.now(),
    sessionId: 'test_session'
  };

  beforeEach(() => {
    analyticsManager = new AnalyticsManager();
  });

  describe('trackEvent', () => {
    it('should track an event', async () => {
      await analyticsManager.trackEvent(mockEvent);

      const events = await analyticsManager.getEvents();
      expect(events).toContainEqual(mockEvent);
    });

    it('should handle multiple events', async () => {
      const events = [
        mockEvent,
        { ...mockEvent, event: 'test_event_2' },
        { ...mockEvent, event: 'test_event_3' }
      ];

      for (const event of events) {
        await analyticsManager.trackEvent(event);
      }

      const storedEvents = await analyticsManager.getEvents();
      expect(storedEvents).toEqual(expect.arrayContaining(events));
    });
  });

  describe('getEvents', () => {
    it('should return all tracked events', async () => {
      await analyticsManager.trackEvent(mockEvent);
      const events = await analyticsManager.getEvents();

      expect(Array.isArray(events)).toBe(true);
      expect(events).toContainEqual(mockEvent);
    });

    it('should return empty array if no events', async () => {
      const events = await analyticsManager.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    it('should clear all tracked events', async () => {
      await analyticsManager.trackEvent(mockEvent);
      await analyticsManager.clearEvents();

      const events = await analyticsManager.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe('getEventCount', () => {
    it('should return correct event count', async () => {
      const events = [
        mockEvent,
        { ...mockEvent, event: 'test_event_2' },
        { ...mockEvent, event: 'test_event_3' }
      ];

      for (const event of events) {
        await analyticsManager.trackEvent(event);
      }

      const count = await analyticsManager.getEventCount();
      expect(count).toBe(events.length);
    });

    it('should return 0 if no events', async () => {
      const count = await analyticsManager.getEventCount();
      expect(count).toBe(0);
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by type', async () => {
      const events = [
        mockEvent,
        { ...mockEvent, event: 'test_event_2' },
        { ...mockEvent, event: 'test_event_2' }
      ];

      for (const event of events) {
        await analyticsManager.trackEvent(event);
      }

      const filteredEvents = await analyticsManager.getEventsByType('test_event_2');
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents.every(e => e.event === 'test_event_2')).toBe(true);
    });

    it('should return empty array if no events of type', async () => {
      const filteredEvents = await analyticsManager.getEventsByType('nonexistent');
      expect(filteredEvents).toEqual([]);
    });
  });

  describe('getEventsBySession', () => {
    it('should filter events by session', async () => {
      const events = [
        mockEvent,
        { ...mockEvent, sessionId: 'other_session' },
        { ...mockEvent, sessionId: 'other_session' }
      ];

      for (const event of events) {
        await analyticsManager.trackEvent(event);
      }

      const filteredEvents = await analyticsManager.getEventsBySession('other_session');
      expect(filteredEvents).toHaveLength(2);
      expect(filteredEvents.every(e => e.sessionId === 'other_session')).toBe(true);
    });

    it('should return empty array if no events for session', async () => {
      const filteredEvents = await analyticsManager.getEventsBySession('nonexistent');
      expect(filteredEvents).toEqual([]);
    });
  });
}); 