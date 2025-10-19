import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Label, HelperText } from 'flowbite-react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const createSelectStyles = (isDarkMode) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.7)' : 'transparent',
    borderColor: state.isFocused
      ? 'rgb(14 165 233 / 0.8)'
      : state.hasValue
        ? isDarkMode
          ? 'rgba(148, 163, 184, 0.5)'
          : 'rgb(148 163 184 / 0.6)'
        : isDarkMode
          ? 'rgba(71, 85, 105, 0.8)'
          : 'rgb(226 232 240)',
    boxShadow: state.isFocused ? '0 0 0 2px rgb(14 165 233 / 0.25)' : 'none',
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)',
    transition: 'all 150ms ease',
    borderWidth: '1px'
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(56,189,248,0.25)' : 'rgb(14 165 233 / 0.15)',
    color: isDarkMode ? 'rgb(125 211 252)' : 'rgb(14 116 144)'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(191 219 254)' : provided.color
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'rgb(14 165 233 / 0.25)'
      : state.isFocused
        ? 'rgb(14 165 233 / 0.15)'
        : isDarkMode
          ? 'rgba(15,23,42,0.95)'
          : 'transparent',
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(148 163 184)' : 'rgb(100 116 139)'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  input: (provided) => ({
    ...provided,
    color: isDarkMode ? 'rgb(226 232 240)' : 'rgb(15 23 42)'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.95)' : 'white',
    zIndex: 50
  })
});

function MultiSelect({
  control,
  name,
  label,
  helperText,
  rules,
  description,
  options,
  placeholder = 'Selecciona una opción',
  isClearable = false,
  isCreatable = false,
  onCreateOption,
  ...rest
}) {
  const fieldId = rest.id ?? name;
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const isDarkMode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const selectStyles = createSelectStyles(isDarkMode);
  const SelectComponent = isCreatable ? CreatableSelect : Select;

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
          <SelectComponent
            {...rest}
            {...field}
            inputId={fieldId}
            isMulti
            options={options}
            placeholder={placeholder}
            onChange={(value) => field.onChange(value)}
            value={field.value ?? []}
            styles={selectStyles}
            isClearable={isClearable}
            classNamePrefix="codex-multiselect"
            aria-invalid={fieldState.invalid}
            aria-describedby={[helperId, description ? `${fieldId}-description` : null]
              .filter(Boolean)
              .join(' ')}
            onCreateOption={isCreatable ? onCreateOption : undefined}
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

MultiSelect.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  helperText: PropTypes.node,
  rules: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  description: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  placeholder: PropTypes.string,
  isClearable: PropTypes.bool,
  isCreatable: PropTypes.bool,
  onCreateOption: PropTypes.func
};

export default MultiSelect;

