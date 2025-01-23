 export const numberToWords = (number) => {
    // You can use a library like 'number-to-words' or implement your own conversion
    // This is a simple implementation for example
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
    return `Indian Rupees ${formatter.format(number).replace('₹', '')} Only`;
  };
  