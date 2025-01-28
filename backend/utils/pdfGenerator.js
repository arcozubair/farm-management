const axios = require('axios');

const generateInvoicePDF = async (invoice, companyDetails) => {
    try {
        console.log('Preparing invoice data for PDF generation',invoice);
        
        // Format the data exactly as the external API expects
        const requestData = {
            invoiceData: {
                invoiceNumber: invoice.invoiceNumber,
                date: new Date().toLocaleDateString('en-IN'),
                customerName: invoice.customer.name,
                customerPhone: invoice.customer.contactNumber,
                items: invoice.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    weight: item.weight || 0,
                    unit: item.unit || 'pcs'
                })),
                grandTotal: invoice.grandTotal,
                remainingBalance: invoice.remainingBalance
            },
            companyDetails: {
                companyName: companyDetails.companyName,
                address: companyDetails.address,
                contactNumbers: companyDetails.contactNumbers,
                gstNumber: companyDetails.gstNumber,
                email: companyDetails.email
            }
        };

        console.log('Sending request to external PDF generator:', {
            url: 'https://9db7-115-246-93-75.ngrok-free.app/api/generate-invoice',
            invoiceNumber: requestData.invoiceData.invoiceNumber
        });
        
        const response = await axios.post(
            'https://9db7-115-246-93-75.ngrok-free.app/api/generate-invoice',
            requestData,
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data || !response.data.success || !response.data.url) {
            console.error('Invalid response from PDF generator:', response.data);
            throw new Error('Invalid response from PDF generator');
        }

        console.log('PDF generated successfully:', response.data.url);
        return response.data.url;

    } catch (error) {
        console.error('PDF Generation failed:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(`PDF Generation failed: ${error.message}`);
    }
};

module.exports = { generateInvoicePDF }; 