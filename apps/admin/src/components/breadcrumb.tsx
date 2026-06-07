import Link from 'next/link';
import React from 'react';

export function Breadcrumb({ parts }: { parts: Array<{ label: React.ReactNode; href?: string }> }) {
  return (
    <div className="row items-center gap-2 text-sm text-dim">
      {parts.map(({ label, href }, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
