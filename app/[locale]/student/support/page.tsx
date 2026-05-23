'use client';

import React from 'react';
import IssuesForm from '@/src/components/IssuesForm';

export default function StudentSupportPage() {
  return (
    <div className="pb-12">
      <IssuesForm isAdmin={false} />
    </div>
  );
}
