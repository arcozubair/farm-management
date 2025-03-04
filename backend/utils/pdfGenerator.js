const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatAddress, formatCurrency, capitalizeFirstLetter } = require('./formatters');

// Define the invoices directory path
const invoicesDir = path.join(__dirname, '../public/uploads/invoices');

// Ensure the directory exists
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

const generateInvoiceP = async (invoiceData, companyDetails) => {
    console.log("the invoiceData", invoiceData?.date);
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const sanitizedSaleNumber = invoiceData.saleNumber.replace(/[^a-zA-Z0-9-]/g, '');
        
        // Use absolute path for file creation
        const filePath = path.join(invoicesDir, `invoice-${sanitizedSaleNumber}.pdf`);
        console.log('Generating PDF at:', filePath);

        const writeStream = fs.createWriteStream(filePath);

        // Return promise to handle async PDF generation
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                // Generate public URL
                const publicUrl = `${process.env.BASE_URL || `http://localhost:${PORT}`}/uploads/invoices/invoice-${sanitizedSaleNumber}.pdf`;
                console.log('PDF generated successfully. Public URL:', publicUrl);
                resolve({ filePath, publicUrl });
            });

            writeStream.on('error', (error) => {
                console.error('Error generating PDF:', error);
                reject(error);
            });

            doc.pipe(writeStream);

            // Use default fonts
            doc.font('Helvetica');

            // Title
            doc.font('Helvetica-Bold')
               .fontSize(24)
               .text('INVOICE', { align: 'center' });

            doc.moveDown();

            // Header Box
            const headerBox = {
                x: 50,
                y: 120,
                width: 495,
                height: 150
            };
            doc.rect(headerBox.x, headerBox.y, headerBox.width, headerBox.height).stroke();

            // Company Details (Left side)
            doc.font('Helvetica-Bold')
               .fontSize(16)
               .text(companyDetails.companyName.toUpperCase(), 60, 130);

            doc.font('Helvetica')
               .fontSize(10)
               .text(formatAddress(companyDetails.address), 60, 155)
               .text(`Phone: ${companyDetails.contactNumbers.join(', ')}`, 60, 170);

            if (companyDetails.gstNumber) {
                doc.text(`GSTIN: ${companyDetails.gstNumber}`, 60, 185);
            }

            // Invoice Details (Right side)
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .text(`Invoice No: ${invoiceData.saleNumber}`, 350, 130)
               .text(`Date: ${invoiceData?.date}`, 350, 145)
               .moveDown()
               .text('Party Details:', 350, 170)
               .text(`Name: ${invoiceData?.customerName || 'N/A'}`, 350, 185)
               .text(`Contact: ${invoiceData?.customerPhone || 'N/A'}`, 350, 200);

            // Items Table
            const tableTop = 300;
            const tableHeaders = ['Sr.', 'Particulars', 'Quantity', 'Weight', 'Rate', 'Amount'];
            const columnWidths = [30, 170, 75, 75, 70, 70];
            let currentLeft = 50;

            // Table Header
            doc.rect(50, tableTop - 5, 495, 25).fill('#f8f8f8').stroke();
            doc.fillColor('black');
            
            currentLeft = 60;
            doc.font('Helvetica-Bold').fontSize(10);
            tableHeaders.forEach((header, i) => {
                const align = i === 0 ? 'left' : 'right';
                doc.text(header, currentLeft, tableTop + 7, {
                    width: columnWidths[i],
                    align: i === 1 ? 'left' : align
                });
                currentLeft += columnWidths[i];
            });

            // Table Rows
            let currentTop = tableTop + 30;
            doc.font('Helvetica').fontSize(10);

            invoiceData.items.forEach((item, index) => {
                currentLeft = 60;
                
                // Sr. No.
                doc.text((index + 1).toString(), currentLeft, currentTop);
                currentLeft += columnWidths[0];

                // Item Name
                doc.font('Helvetica-Bold')
                   .text(capitalizeFirstLetter(item.name), currentLeft, currentTop);
                currentLeft += columnWidths[1];

                // Quantity
                doc.font('Helvetica')
                   .text(`${item.quantity} ${item.unit === "kg" ? "" : item.unit}`, 
                         currentLeft, currentTop, { align: 'right', width: columnWidths[2] });
                currentLeft += columnWidths[2];

                // Weight
                doc.text(`${item.weight || '-'} ${item.weight ? item.unit : ''}`, 
                        currentLeft, currentTop, { align: 'right', width: columnWidths[3] });
                currentLeft += columnWidths[3];

                // Rate
                doc.text(formatCurrency(item.price), 
                        currentLeft, currentTop, { align: 'right', width: columnWidths[4] });
                currentLeft += columnWidths[4];

                // Amount
                doc.text(formatCurrency(item.total), 
                        currentLeft, currentTop, { align: 'right', width: columnWidths[5] });

                currentTop += 20;
            });

            // Totals Section
            const totalsY = currentTop + 30;
            doc.font('Helvetica-Bold');

            // Sub Total
            doc.text('Sub Total:', 375, totalsY)
               .text(formatCurrency(invoiceData.grandTotal - (invoiceData.gstAmount || 0)), 
                     475, totalsY, { align: 'right' });

            // GST if applicable
            if (invoiceData.gstPercentage > 0) {
                doc.text(`GST (${invoiceData.gstPercentage}%):`, 375, totalsY + 20)
                   .text(formatCurrency(invoiceData.gstAmount), 
                         475, totalsY + 20, { align: 'right' });
            }

            // Grand Total
            doc.fontSize(12)
               .text('Grand Total:', 375, totalsY + 40)
               .text(formatCurrency(invoiceData.grandTotal), 
                     475, totalsY + 40, { align: 'right' });

            // Declaration
            const declaration = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
            doc.fontSize(9)
               .font('Helvetica-Oblique')
               .text(declaration, 50, totalsY + 70, { width: 300 });

            // Signatures Section
            const signatureY = totalsY + 120;
            doc.rect(50, signatureY, 495, 80).stroke();

            // Signature boxes
            const signatureWidth = 495 / 4;
            for (let i = 1; i < 4; i++) {
                doc.moveTo(50 + (signatureWidth * i), signatureY)
                   .lineTo(50 + (signatureWidth * i), signatureY + 80)
                   .stroke();
            }

            // Company name above signatures
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .text(`For ${companyDetails.companyName}`, 50, signatureY - 20, { align: 'right', width: 495 });

            // Signature titles
            doc.fontSize(9)
               .text("Customer's Seal &\nSignature", 60, signatureY + 50)
               .text("Prepared by", 185, signatureY + 50)
               .text("Verified by", 310, signatureY + 50)
               .text("Authorized Signatory", 435, signatureY + 50);

            // Footer
            doc.fontSize(8)
               .font('Helvetica-Oblique')
               .text(companyDetails.termsAndConditions || '', 50, 750, { align: 'center' })
               .text('This is a Computer Generated Invoice', 50, 770, { align: 'center' });

            doc.end();
        });
    } catch (error) {
        console.error('PDF Generation error:', error);
        throw error;
    }
   
};

const generateInvoicePDF = async (invoice, companyDetails) => {
    try {
        console.log('Preparing invoice data for PDF generation', invoice);
        
        // Format the data for PDF generation
        const invoiceData = {
            saleNumber: invoice.saleNumber,
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
            gstPercentage: companyDetails.gstPercentage || 0,
            gstAmount: invoice.gstAmount || 0,
            remainingBalance: invoice.remainingBalance
        };
        
        // Generate PDF using the local function
        const { publicUrl } = await generateInvoiceP(invoiceData, companyDetails);
        
        console.log('PDF generated successfully:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('PDF Generation failed:', {
            error: error.message,
            stack: error.stack
        });
        throw new Error(`PDF Generation failed: ${error.message}`);
    }
};

module.exports = { generateInvoicePDF }; 