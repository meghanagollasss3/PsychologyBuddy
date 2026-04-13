import React from 'react';
import { User, Mail, Phone, Calendar, Lock, Eye, EyeOff } from 'lucide-react';

interface RegistrationFormFieldProps {
  id: string;
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
}

export const RegistrationFormField: React.FC<RegistrationFormFieldProps> = ({
  id,
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  icon,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  error,
  required = false,
  className = "",
  maxLength,
}) => {
  const inputType = showPasswordToggle && showPassword ? "text" : type;
  
  return (
    <div>
      <label className="block text-[14px] sm:text-[16px] font-semibold text-[#344054] mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full h-[50px] -mb-[5px] pl-13 pr-4 py-4 border border-[#D0D5DD] rounded-[16px] focus:ring-2 focus:ring-[#1B9EE0] focus:border-transparent outline-none transition ${
            icon ? 'pl-11' : 'pl-4'
          } ${showPasswordToggle ? 'pr-12' : 'pr-4'} ${className}`}
          required={required}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
