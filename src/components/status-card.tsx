import type { CheckHalalStatusOutput } from '@/ai/flows/check-halal-status';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

type Status = 'halal' | 'haram' | 'doubtful';

interface StatusCardProps {
  status: CheckHalalStatusOutput;
}

export function StatusCard({ status }: StatusCardProps) {
  let statusType: Status;
  if (!status.isHalal) {
    statusType = 'haram';
  } else if (status.concerns && status.concerns.toLowerCase() !== 'none' && status.concerns.trim() !== '') {
    statusType = 'doubtful';
  } else {
    statusType = 'halal';
  }

  const statusConfig = {
    halal: {
      icon: <CheckCircle2 className="w-12 h-12 text-primary" />,
      text: 'Halal',
      description: 'This product appears to be Halal based on its ingredients.',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      textColor: 'text-primary',
    },
    haram: {
      icon: <XCircle className="w-12 h-12 text-destructive" />,
      text: 'Not Halal',
      description: 'This product contains ingredients that are not Halal.',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      textColor: 'text-destructive',
    },
    doubtful: {
      icon: <AlertTriangle className="w-12 h-12 text-accent" />,
      text: 'Potential Concerns',
      description: 'This product may contain ingredients that are of concern. Please review carefully.',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      textColor: 'text-accent',
    },
  };

  const config = statusConfig[statusType];

  return (
    <div className={cn('p-6 rounded-lg border-2 flex flex-col items-center text-center gap-4', config.bgColor, config.borderColor)}>
      {config.icon}
      <div className="space-y-1">
        <h2 className={cn('text-3xl font-bold font-headline', config.textColor)}>
          {config.text}
        </h2>
        <p className={cn('text-sm', config.textColor, 'opacity-90')}>
          {config.description}
        </p>
      </div>
      {(statusType === 'haram' || statusType === 'doubtful') && status.concerns && status.concerns.toLowerCase() !== 'none' && status.concerns.trim() !== '' && (
        <div className="text-left w-full bg-background/50 p-3 rounded-md text-sm text-foreground">
            <p className="font-bold">Reason:</p>
            <p>{status.concerns}</p>
        </div>
      )}
    </div>
  );
}
