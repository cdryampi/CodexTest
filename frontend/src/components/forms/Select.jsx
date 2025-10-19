import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { Label, Select as FlowbiteSelect, HelperText } from 'flowbite-react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

function Select({ control, name, label, helperText, rules, description, children, placeholder, ...rest }) {
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
          <FlowbiteSelect
            {...rest}
            {...field}
            id={fieldId}
            value={field.value ?? ''}
            aria-invalid={fieldState.invalid}
            aria-describedby={[helperId, description ? `${fieldId}-description` : null]
              .filter(Boolean)
              .join(' ')}
            color={fieldState.invalid ? 'failure' : undefined}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {children}
          </FlowbiteSelect>
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

Select.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  helperText: PropTypes.node,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  description: PropTypes.node,
  children: PropTypes.node,
  placeholder: PropTypes.string
};

export default Select;

