'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { StartupFlow } from '@/components/startup/StartupFlow';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <StartupFlow />
    </ErrorBoundary>
  );
}
