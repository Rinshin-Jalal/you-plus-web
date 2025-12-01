/**
 * useFormError Hook
 * Manages form validation and error display
 */

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

/**
 * useFormError Hook
 * Provides form error management with field-level and global error support
 */
export function useFormError() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Set error for a specific field
   */
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

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Clear all field errors
   */
  const clearFieldErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Set global error message
   */
  const setError = useCallback((message: string) => {
    setGlobalError(message);
  }, []);

  /**
   * Clear global error
   */
  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  /**
   * Clear all errors (field and global)
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setGlobalError(null);
  }, []);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field];
  }, [errors]);

  /**
   * Check if a specific field has an error
   */
  const hasFieldError = useCallback((field: string): boolean => {
    return !!errors[field];
  }, [errors]);

  /**
   * Handle API error response
   * Automatically maps errors to fields if possible
   */
  const handleApiError = useCallback((error: unknown) => {
    if (error && typeof error === 'object') {
      const apiError = error as {
        message?: string;
        error?: string;
        errors?: FieldError[];
        details?: Record<string, string>;
      };

      // Check for field-level errors
      if (apiError.errors && Array.isArray(apiError.errors)) {
        setFieldErrors(apiError.errors);
        return;
      }

      // Check for details object with field errors
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

      // Set as global error
      const message = apiError.error || apiError.message || 'An error occurred';
      setGlobalError(message);
    } else {
      setGlobalError(String(error) || 'An unexpected error occurred');
    }
  }, [setFieldErrors]);

  return {
    // State
    errors,
    globalError,
    hasErrors: Object.keys(errors).length > 0 || !!globalError,
    hasFieldErrors: Object.keys(errors).length > 0,
    hasGlobalError: !!globalError,

    // Field error methods
    setFieldError,
    setFieldErrors,
    clearFieldError,
    clearFieldErrors,
    getFieldError,
    hasFieldError,

    // Global error methods
    setError,
    clearError,

    // Combined methods
    clearAllErrors,
    handleApiError,
  };
}

/**
 * Hook for simple validation with error state
 */
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationFn: (values: T) => Record<string, string> | null
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const { errors, setFieldErrors, clearAllErrors, hasErrors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Update a single field value
   */
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

  /**
   * Handle form submission with validation
   */
  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);
      clearAllErrors();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouched(allTouched);

      // Validate
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

  /**
   * Reset form to initial values
   */
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
