const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/google-credentials.json'),
    scopes: SCOPES,
});

const uploadToDrive = async (filePath, fileName) => {
    try {
        // Create a copy of the file in the public directory
        const publicDir = path.join(__dirname, '../public/invoices');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Sanitize the filename by replacing invalid characters
        const sanitizedFileName = fileName.replace(/[\/\\]/g, '-');
        const uniqueFileName = `${uuidv4()}-${sanitizedFileName}`;
        const publicFilePath = path.join(publicDir, uniqueFileName);
        
        console.log('Copying file:', {
            from: filePath,
            to: publicFilePath
        });

        // Ensure source file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }

        // Copy the file
        fs.copyFileSync(filePath, publicFilePath);

        // Generate public URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const publicUrl = `${baseUrl}/invoices/${uniqueFileName}`;

        console.log('File copied successfully to public directory:', publicUrl);
        
        // Upload to Google Drive
        const drive = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            name: sanitizedFileName,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        };

        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath)
        };

        const driveResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webContentLink'
        });

        if (!driveResponse.data.id) {
            throw new Error('Failed to get file ID from Google Drive');
        }

        // Make the file publicly accessible
        await drive.permissions.create({
            fileId: driveResponse.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        console.log('File uploaded to Google Drive:', driveResponse.data.webContentLink);
        return publicUrl;

    } catch (error) {
        console.error('File upload error:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            filePath,
            fileName
        });
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

module.exports = { uploadToDrive };
