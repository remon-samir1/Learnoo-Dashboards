'use client';

import React from 'react';
import IssuesForm from '@/src/components/IssuesForm';

export default function AdminIssuesPage() {
  return (
    <div className="pb-12">
      <IssuesForm isAdmin={true} />
    </div>
  );
}
