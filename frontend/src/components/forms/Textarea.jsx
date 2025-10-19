import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { Label, Textarea as FlowbiteTextarea, HelperText } from 'flowbite-react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

function Textarea({ control, name, label, helperText, rules, description, rows = 4, ...rest }) {
  const fieldId = rest.id ?? name;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1.5">
          {label ? (
            <Label htmlFor={fieldId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
            </Label>
          ) : null}
          {description ? (
            <p id={`${fieldId}-description`} className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
          <FlowbiteTextarea
            {...rest}
            {...field}
            id={fieldId}
            rows={rows}
            color={fieldState.invalid ? 'failure' : undefined}
            aria-invalid={fieldState.invalid}
            aria-describedby={[helperId, description ? `${fieldId}-description` : null]
              .filter(Boolean)
              .join(' ')}
          />
          {fieldState.error ? (
            <HelperText id={helperId} color="failure" className="flex items-center gap-2 text-xs">
              <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
              <span>{fieldState.error.message}</span>
            </HelperText>
          ) : helperText ? (
            <HelperText id={helperId} className="text-xs text-slate-500 dark:text-slate-400">
              {helperText}
            </HelperText>
          ) : null}
        </div>
      )}
    />
  );
}

Textarea.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  helperText: PropTypes.node,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  description: PropTypes.node,
  rows: PropTypes.number
};

export default Textarea;

