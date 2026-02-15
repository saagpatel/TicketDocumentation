import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.clearAllTimers();
  });

  it('should initialize with empty toasts', () => {
    const { toasts } = useToastStore.getState();
    expect(toasts).toEqual([]);
  });

  it('should add toast with success type', () => {
    useToastStore.getState().addToast('Test message', 'success');

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].id).toBeDefined();
  });

  it('should add toast with error type', () => {
    useToastStore.getState().addToast('Error message', 'error');

    const { toasts } = useToastStore.getState();
    expect(toasts[0].type).toBe('error');
  });

  it('should add toast with info type', () => {
    useToastStore.getState().addToast('Info message', 'info');

    const { toasts } = useToastStore.getState();
    expect(toasts[0].type).toBe('info');
  });

  it('should remove toast by id', () => {
    useToastStore.getState().addToast('Message 1', 'info');
    useToastStore.getState().addToast('Message 2', 'info');

    const { toasts } = useToastStore.getState();
    const firstId = toasts[0].id;

    useToastStore.getState().removeToast(firstId);

    const updatedToasts = useToastStore.getState().toasts;
    expect(updatedToasts).toHaveLength(1);
    expect(updatedToasts[0].message).toBe('Message 2');
  });

  it('should handle multiple toasts', () => {
    useToastStore.getState().addToast('Message 1', 'info');
    useToastStore.getState().addToast('Message 2', 'success');
    useToastStore.getState().addToast('Message 3', 'error');

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(3);
  });
});
