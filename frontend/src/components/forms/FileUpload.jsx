import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { Label, FileInput, HelperText, Button } from 'flowbite-react';
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

function FileUpload({
  control,
  name,
  label,
  helperText,
  description,
  rules,
  accept,
  onClear,
  clearLabel = 'Quitar archivo'
}) {
  const fieldId = name;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = field.value;
        const fileName = value instanceof File ? value.name : typeof value === 'string' ? value : '';

        return (
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
            <FileInput
              id={fieldId}
              accept={accept}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                field.onChange(file);
              }}
              color={fieldState.invalid ? 'failure' : undefined}
              aria-invalid={fieldState.invalid}
              aria-describedby={[helperId, description ? `${fieldId}-description` : null]
                .filter(Boolean)
                .join(' ')}
            />
            {fileName ? (
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                <span className="truncate" title={fileName}>
                  {fileName}
                </span>
                {onClear ? (
                  <Button
                    color="light"
                    size="xs"
                    type="button"
                    onClick={() => {
                      onClear();
                      field.onChange(null);
                    }}
                    className="flex items-center gap-1"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    {clearLabel}
                  </Button>
                ) : null}
              </div>
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
        );
      }}
    />
  );
}

FileUpload.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  helperText: PropTypes.node,
  description: PropTypes.node,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  accept: PropTypes.string,
  onClear: PropTypes.func,
  clearLabel: PropTypes.string
};

export default FileUpload;

