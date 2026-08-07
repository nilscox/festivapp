import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { Check } from 'lucide-react';

const { Root, Indicator } = BaseCheckbox;

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  name?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <label className="row cursor-pointer items-start gap-2">
      <Root
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={clsx(
          'bg-surface hover:border-line-strong flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border',
          'data-checked:bg-accent data-checked:border-accent',
        )}
      >
        <Indicator className="text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </Indicator>
      </Root>

      <div>
        <div className="text-form font-medium">{label}</div>
        {hint && <div className="text-muted mt-0.5 text-xs">{hint}</div>}
      </div>
    </label>
  );
}
