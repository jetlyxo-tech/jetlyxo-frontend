export const formatPrice = (
    price: number | string,
    currency = "INR"
  ) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };