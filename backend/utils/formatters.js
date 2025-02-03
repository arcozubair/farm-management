const formatAddress = (address) => {
    if (!address) return '';
    const { line1, line2, city, state, pincode } = address;
    return [
        line1,
        line2,
        `${city}, ${state}${pincode ? ` - ${pincode}` : ''}`
    ].filter(Boolean).join(', ');
};

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

module.exports = {
    formatAddress,
    formatCurrency,
    capitalizeFirstLetter
}; 