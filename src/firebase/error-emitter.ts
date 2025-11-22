
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We can't use the native EventEmitter because it's not available in the browser.
// The 'events' package is a standard Node.js module that works in the browser.
class AppEventEmitter extends EventEmitter {
  emit<T extends keyof AppEvents>(event: T, ...args: Parameters<AppEvents[T]>): boolean {
    return super.emit(event, ...args);
  }

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): this {
    return super.on(event, listener);
  }
}

export const errorEmitter = new AppEventEmitter();
