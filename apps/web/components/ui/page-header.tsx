import type React from 'react';

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-4xl font-extrabold">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 text-lg">{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
