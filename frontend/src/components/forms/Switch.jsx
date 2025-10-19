import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { ToggleSwitch, HelperText } from 'flowbite-react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

function Switch({ control, name, label, helperText, rules, description }) {
  const fieldId = name;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1.5">
          <ToggleSwitch
            id={fieldId}
            checked={Boolean(field.value)}
            label={label}
            onChange={(checked) => field.onChange(checked)}
            aria-describedby={[helperId, description ? `${fieldId}-description` : null]
              .filter(Boolean)
              .join(' ')}
            color={fieldState.invalid ? 'red' : 'blue'}
          />
          {description ? (
            <p id={`${fieldId}-description`} className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
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

Switch.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  helperText: PropTypes.node,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  description: PropTypes.node
};

export default Switch;

