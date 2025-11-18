const fs = require('fs').promises;
const pdf = require('pdf-parse');

async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        
        if (!data || !data.text) {
            throw new Error('Failed to extract text from PDF');
        }

        console.log('Successfully extracted text from PDF');
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

module.exports = {
    extractTextFromPDF
};