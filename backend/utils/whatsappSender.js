const axios = require('axios');

const sendPdfToWhatsapp = async (customerPhone, pdfUrl, invoiceNumber, customerName) => {
    if (!process.env.AISENSY_API_KEY) {
        console.error('AISENSY_API_KEY not configured');
        return { 
            success: false, 
            error: 'WhatsApp service not configured' 
        };
    }

    try {
        // Ensure proper phone number format
        const formattedPhone = customerPhone.replace(/\D/g, '');
        const phoneWithCountryCode = formattedPhone.startsWith('91') ? 
            formattedPhone : `91${formattedPhone}`;

        console.log('Preparing WhatsApp request for:', {
            phone: phoneWithCountryCode,
            invoice: invoiceNumber
        });

        const data = {
            apiKey: process.env.AISENSY_API_KEY,
            campaignName: "invoice_pdf",  // Your approved template name
            destination: phoneWithCountryCode,
            userName: customerName || "Valued Customer",
            templateParams: [
               
                invoiceNumber,
                new Date().toLocaleDateString('en-IN')
            ],
            media: {
                url: pdfUrl,
                filename: `Invoice_${invoiceNumber}.pdf`
            }
        };

        console.log('Sending WhatsApp request with data:', {
            campaignName: data.campaignName,
            destination: data.destination,
            templateParams: data.templateParams,
            filename: data.media.filename
        });

        const response = await axios({
            method: 'post',
            url: 'https://backend.aisensy.com/campaign/t1/api',
            data: data,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000,
            validateStatus: false
        });

        console.log('WhatsApp API response:', {
            status: response.status,
            data: response.data
        });

        if (response.status === 200 && 
            (response.data?.success || response.data === 'Success.')) {
            console.log('WhatsApp message sent successfully to:', phoneWithCountryCode);
            return { 
                success: true, 
                data: response.data 
            };
        }

        console.error('WhatsApp API error response:', response.data);
        return { 
            success: false, 
            error: 'WhatsApp API error', 
            details: response.data || 'No response data'
        };

    } catch (error) {
        console.error('WhatsApp sending error:', {
            message: error.message,
            code: error.code,
            response: error.response?.data || 'No response data'
        });

        return { 
            success: false, 
            error: 'WhatsApp sending failed', 
            details: error.message
        };
    }
};

module.exports = { sendPdfToWhatsapp }; 