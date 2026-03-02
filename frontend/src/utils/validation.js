// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation (minimum 8 characters)
export const isValidPassword = (password) => {
  return password && password.length >= 8
}

// Common validations
export const validators = {
  email: (value) => {
    if (!value) return 'Email is required'
    if (!isValidEmail(value)) return 'Invalid email format'
    return null
  },

  password: (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    return null
  },

  confirmPassword: (value, password) => {
    if (!value) return 'Please confirm your password'
    if (value !== password) return 'Passwords do not match'
    return null
  },

  name: (value) => {
    if (!value) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    return null
  },

  code: (value) => {
    if (!value) return 'Code is required'
    if (value.trim().length < 10) return 'Solution must be more than 10 characters'
    return null
  },

  explanation: (value) => {
    if (!value) return 'Explanation is required'
    if (value.trim().length < 20) return 'Please provide a detailed explanation'
    return null
  },
}

// Validate form data
export const validateForm = (data, schema) => {
  const errors = {}

  Object.keys(schema).forEach((field) => {
    const validator = schema[field]
    const value = data[field]
    const error = validator(value)
    if (error) {
      errors[field] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Format validation errors for display
export const formatValidationErrors = (errors) => {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n')
}
