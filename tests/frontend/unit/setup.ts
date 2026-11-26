import { createPinia, setActivePinia } from 'pinia';
import { enableAutoUnmount } from '@vue/test-utils';

enableAutoUnmount(afterEach);

beforeEach(() => {
  localStorage.clear();
  delete process.env.VITE_API_URL;
  setActivePinia(createPinia());
});

// jsdom não implementa a API modal de <dialog>.
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () { this.open = false; };

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
