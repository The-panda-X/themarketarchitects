'use client';

const KEY = 'tma_last_panel';

export type Panel = 'dashboard' | 'admin';

export function getLastPanel(): Panel {
  if (typeof window === 'undefined') return 'dashboard';
  return (localStorage.getItem(KEY) as Panel) || 'dashboard';
}

export function setLastPanel(panel: Panel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, panel);
}
