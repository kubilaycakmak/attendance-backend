import { MIN_PASSWORD_LENGTH } from '../config/userConfig.js';

/**
 * validate user info request body
 */
const validateUserInfo = (userData, requiredFields = []) => {
  let errorMsg = '';
  if (requiredFields.length) {
    requiredFields.forEach((requiedField) => {
      if (!Object.keys(userData).includes(requiedField))
        userData[requiedField] = null;
    });
  }
  Object.keys(userData).forEach((fieldKey) => {
    if (errorMsg) return;
    const value = userData[fieldKey];
    switch (fieldKey) {
      case 'first_name':
        if (!value?.trim()) {
          errorMsg = 'Firstname cannot be empty. Please provide one.';
          return;
        }
        break;
      case 'email':
        if (!value?.trim()) {
          errorMsg = 'Email cannot be empty. Please provide one.';
          return;
        }
        const emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!value.match(emailFormat)) {
          errorMsg = 'Email was provided in the wrong format.';
          return;
        }
        break;
      case 'password':
        const password = value?.trim();
        if (!password) {
          errorMsg = 'Password cannot be empty. Please provide one.';
          return;
        }
        // check length
        if (password.length < MIN_PASSWORD_LENGTH) {
          errorMsg = `Password must consist of at least ${MIN_PASSWORD_LENGTH} characters.`;
          return;
        }
        // check special character inclusion
        const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        if (!password.match(specialChars)) {
          errorMsg =
            'Password must constain at least one special characters. (Example: !, @, %)';
          return;
        }
        // check number inclusion
        const nums = /\d+/g;
        if (!password.match(nums)) {
          errorMsg = 'Password must constain at least one number';
          return;
        }
        break;
      case 'full_name':
        if (!value?.trim()) {
          errorMsg = 'Full name cannot be empty. Please provide one.';
          return;
        }
        break;
    }
  });
  return errorMsg;
};

export default validateUserInfo;
