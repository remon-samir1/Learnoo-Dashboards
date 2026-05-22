'use client';

import React from 'react';
import IssuesForm from '@/src/components/IssuesForm';

export default function DoctorIssuesPage() {
  return (
    <div className="pb-12">
      <IssuesForm isAdmin={false} />
    </div>
  );
}
