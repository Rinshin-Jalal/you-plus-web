'use client';

import { useState, useCallback } from 'react';

export interface FieldError {
  field: string;
  message: string;
}

export interface FormErrorState {
  errors: Record<string, string>;
  hasErrors: boolean;
  globalError: string | null;
}

export function useFormError() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  /**
   * Set multiple field errors at once
   */
  const setFieldErrors = useCallback((fieldErrors: FieldError[]) => {
    const errorMap: Record<string, string> = {};
    fieldErrors.forEach(({ field, message }) => {
      errorMap[field] = message;
    });
    setErrors(errorMap);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearFieldErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((message: string) => {
    setGlobalError(message);
  }, []);

  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setGlobalError(null);
  }, []);

  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field];
  }, [errors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return !!errors[field];
  }, [errors]);

  const handleApiError = useCallback((error: unknown) => {
    if (error && typeof error === 'object') {
      const apiError = error as {
        message?: string;
        error?: string;
        errors?: FieldError[];
        details?: Record<string, string>;
      };

      if (apiError.errors && Array.isArray(apiError.errors)) {
        setFieldErrors(apiError.errors);
        return;
      }

      if (apiError.details && typeof apiError.details === 'object') {
        const fieldErrors: FieldError[] = Object.entries(apiError.details).map(
          ([field, message]) => ({
            field,
            message: String(message),
          })
        );
        setFieldErrors(fieldErrors);
        return;
      }

      const message = apiError.error || apiError.message || 'An error occurred';
      setGlobalError(message);
    } else {
      setGlobalError(String(error) || 'An unexpected error occurred');
    }
  }, [setFieldErrors]);

  return {
    errors,
    globalError,
    hasErrors: Object.keys(errors).length > 0 || !!globalError,
    hasFieldErrors: Object.keys(errors).length > 0,
    hasGlobalError: !!globalError,
    setFieldError,
    setFieldErrors,
    clearFieldError,
    clearFieldErrors,
    getFieldError,
    hasFieldError,
    setError,
    clearError,
    clearAllErrors,
    handleApiError,
  };
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationFn: (values: T) => Record<string, string> | null
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const { errors, setFieldErrors, clearAllErrors, hasErrors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Mark a field as touched (for showing validation errors)
   */
  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  /**
   * Validate all fields
   */
  const validate = useCallback(() => {
    const validationErrors = validationFn(values);
    if (validationErrors) {
      const fieldErrors = Object.entries(validationErrors).map(([field, message]) => ({
        field,
        message,
      }));
      setFieldErrors(fieldErrors);
      return false;
    }
    clearAllErrors();
    return true;
  }, [values, validationFn, setFieldErrors, clearAllErrors]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);
      clearAllErrors();

      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouched(allTouched);

      const isValid = validate();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, clearAllErrors]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({} as Record<keyof T, boolean>);
    clearAllErrors();
    setIsSubmitting(false);
  }, [initialValues, clearAllErrors]);

  return {
    values,
    errors,
    touched,
    hasErrors,
    isSubmitting,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit,
    reset,
  };
}
