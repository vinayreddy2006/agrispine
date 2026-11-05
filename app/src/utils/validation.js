/**
 * Validation utilities for AgriSpine authentication
 */

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return 'Phone number is required';
  }
  const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
  if (!/^\d+$/.test(cleanPhone)) {
    return 'Phone number must contain only numbers';
  }
  if (cleanPhone.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

export default {
  validatePhone,
  validatePassword,
  validateName,
  validateConfirmPassword,
};
