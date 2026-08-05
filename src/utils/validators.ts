export const isEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  export const isPhone = (phone: string) =>
    /^[6-9]\d{9}$/.test(phone);