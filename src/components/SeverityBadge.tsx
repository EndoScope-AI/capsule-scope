import { Badge } from "@/components/ui/badge";
import { SeverityLevel } from "@/lib/types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const getColor = () => {
    switch (severity) {
      case 'healthy':
        return 'bg-severity-healthy text-white';
      case 'mild':
        return 'bg-severity-mild text-white';
      case 'moderate':
        return 'bg-severity-moderate text-white';
      case 'severe':
        return 'bg-severity-severe text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge className={`${getColor()} ${className || ''}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
};
