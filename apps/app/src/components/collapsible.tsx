'use client';

import { defined } from '@festivapp/utils';
import React, { createContext, Dispatch, SetStateAction, use, useState } from 'react';

const collapsibleContext = createContext<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
} | null>(null);

export function CollapsibleProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return <collapsibleContext.Provider value={{ open, setOpen }}>{children}</collapsibleContext.Provider>;
}

export function CollapsibleTrigger(props: React.ComponentProps<'button'>) {
  const { setOpen } = defined(use(collapsibleContext), new Error('Missing collapsible provider'));

  return <button type="button" onClick={() => setOpen((open) => !open)} {...props} />;
}

export function CollapsibleContent({ children }: { children: React.ReactNode }) {
  const { open } = defined(use(collapsibleContext), new Error('Missing collapsible provider'));

  return open ? children : null;
}
