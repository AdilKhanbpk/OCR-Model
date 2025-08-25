import { google } from 'googleapis';
import { storage } from '../../storage';
import { Job } from '@shared/schema';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  };
}

interface SheetMapping {
  [fieldName: string]: string; // Maps extracted field names to column headers
}

export class GoogleSheetsIntegration {
  private auth: any;

  constructor(private config: GoogleSheetsConfig) {
    this.auth = new google.auth.OAuth2(
      config.credentials.client_id,
      config.credentials.client_secret
    );
    
    this.auth.setCredentials({
      refresh_token: config.credentials.refresh_token,
    });
  }

  async syncJob(job: Job, mapping: SheetMapping): Promise<void> {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      // Get or create worksheet
      const spreadsheetId = this.config.spreadsheetId;
      const worksheetName = this.config.worksheetName;
      
      // Ensure worksheet exists
      await this.ensureWorksheetExists(sheets, spreadsheetId, worksheetName);
      
      // Get headers and find the next empty row
      const headerRange = `${worksheetName}!A1:Z1`;
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: headerRange,
      });
      
      const headers = headerResponse.data.values?.[0] || [];
      
      // If no headers, create them
      if (headers.length === 0) {
        const defaultHeaders = this.getDefaultHeaders(job.docType || 'generic');
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: headerRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: [defaultHeaders],
          },
        });
      }
      
      // Find next empty row
      const dataRange = `${worksheetName}!A:A`;
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: dataRange,
      });
      
      const nextRow = (dataResponse.data.values?.length || 0) + 1;
      
      // Prepare row data
      const rowData = this.prepareRowData(job, headers, mapping);
      
      // Insert the row
      const insertRange = `${worksheetName}!A${nextRow}:Z${nextRow}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: insertRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData],
        },
      });
      
      console.log(`Successfully synced job ${job.id} to Google Sheets`);
      
    } catch (error) {
      console.error('Google Sheets sync error:', error);
      throw new Error(`Failed to sync to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureWorksheetExists(sheets: any, spreadsheetId: string, worksheetName: string): Promise<void> {
    try {
      // Check if worksheet exists
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const worksheetExists = spreadsheet.data.sheets?.some(
        (sheet: any) => sheet.properties.title === worksheetName
      );
      
      if (!worksheetExists) {
        // Create the worksheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: worksheetName,
                },
              },
            }],
          },
        });
      }
    } catch (error) {
      console.error('Error ensuring worksheet exists:', error);
      throw error;
    }
  }

  private getDefaultHeaders(docType: string): string[] {
    const baseHeaders = ['Date', 'Filename', 'Document Type', 'Status', 'Confidence'];
    
    const typeSpecificHeaders: Record<string, string[]> = {
      invoice: ['Invoice Number', 'Invoice Date', 'Due Date', 'Vendor Name', 'Total Amount', 'Currency'],
      receipt: ['Merchant Name', 'Receipt Date', 'Total Amount', 'Tax Amount', 'Currency'],
      id: ['Full Name', 'Date of Birth', 'ID Number', 'Expiry Date', 'Document Type'],
      bank_statement: ['Account Number', 'Statement Date', 'Balance', 'Bank Name'],
      business_card: ['Full Name', 'Company', 'Title', 'Phone', 'Email', 'Website'],
    };
    
    const specificHeaders = typeSpecificHeaders[docType] || ['Extracted Text'];
    return [...baseHeaders, ...specificHeaders];
  }

  private prepareRowData(job: Job, headers: string[], mapping: SheetMapping): string[] {
    const rowData: string[] = [];
    
    // Extract fields from job
    const extractedFields = this.getExtractedFieldsMap(job);
    
    headers.forEach(header => {
      let value = '';
      
      // Handle standard fields
      switch (header.toLowerCase()) {
        case 'date':
          value = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '';
          break;
        case 'filename':
          value = job.filename;
          break;
        case 'document type':
          value = job.docType || '';
          break;
        case 'status':
          value = job.status;
          break;
        case 'confidence':
          value = job.confidence ? `${Math.round(parseFloat(job.confidence) * 100)}%` : '';
          break;
        default:
          // Try to map from extracted fields
          const mappedFieldName = Object.keys(mapping).find(
            fieldName => mapping[fieldName] === header
          );
          
          if (mappedFieldName && extractedFields[mappedFieldName]) {
            value = extractedFields[mappedFieldName];
          } else {
            // Try direct field name mapping (convert header to field name format)
            const fieldName = header.toLowerCase().replace(/\s+/g, '_');
            value = extractedFields[fieldName] || '';
          }
          break;
      }
      
      rowData.push(value);
    });
    
    return rowData;
  }

  private getExtractedFieldsMap(job: Job): Record<string, string> {
    const fieldsMap: Record<string, string> = {};
    
    if (job.extractedFields && typeof job.extractedFields === 'object') {
      const fields = (job.extractedFields as any).fields || [];
      fields.forEach((field: any) => {
        if (field.name && field.value !== undefined) {
          // Use normalized value if available, otherwise use raw value
          let value = field.value;
          if (field.normalized) {
            if (typeof field.normalized === 'object') {
              // For currency objects, format nicely
              if (field.normalized.amount !== undefined && field.normalized.currency) {
                value = `${field.normalized.currency} ${field.normalized.amount}`;
              } else {
                value = JSON.stringify(field.normalized);
              }
            } else {
              value = field.normalized.toString();
            }
          }
          fieldsMap[field.name] = value.toString();
        }
      });
    }
    
    return fieldsMap;
  }

  // Test the connection
  async testConnection(): Promise<boolean> {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      // Try to get spreadsheet info
      await sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });
      
      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }

  // Get spreadsheet info
  async getSpreadsheetInfo(): Promise<any> {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      const response = await sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });
      
      return {
        title: response.data.properties?.title,
        worksheets: response.data.sheets?.map(sheet => ({
          title: sheet.properties?.title,
          id: sheet.properties?.sheetId,
        })),
      };
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      throw error;
    }
  }
}

// Factory function to create Google Sheets integration from stored config
export async function createGoogleSheetsIntegration(userId: string, integrationId: string): Promise<GoogleSheetsIntegration> {
  const integration = await storage.getUserIntegrations(userId);
  const sheetsIntegration = integration.find(i => i.id === integrationId && i.type === 'google_sheets');
  
  if (!sheetsIntegration) {
    throw new Error('Google Sheets integration not found');
  }
  
  const config = sheetsIntegration.config as any;
  const credentials = sheetsIntegration.credentials as any;
  
  return new GoogleSheetsIntegration({
    spreadsheetId: config.spreadsheetId,
    worksheetName: config.worksheetName || 'OCR Results',
    credentials: {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
    },
  });
}

// Webhook handler for automatic syncing
export async function handleJobCompletedWebhook(job: Job): Promise<void> {
  try {
    // Find all Google Sheets integrations for this user
    const integrations = await storage.getUserIntegrations(job.userId);
    const sheetsIntegrations = integrations.filter(i => i.type === 'google_sheets' && i.active);
    
    // Sync to each configured Google Sheets integration
    for (const integration of sheetsIntegrations) {
      try {
        const sheetsService = await createGoogleSheetsIntegration(job.userId, integration.id);
        const mapping = (integration.config as any).fieldMapping || {};
        
        await sheetsService.syncJob(job, mapping);
        
        // Update integration sync stats
        await storage.updateIntegration(integration.id, {
          lastSync: new Date(),
          syncCount: (integration.syncCount || 0) + 1,
        });
        
      } catch (error) {
        console.error(`Failed to sync job ${job.id} to Google Sheets integration ${integration.id}:`, error);
        
        // Update error count
        await storage.updateIntegration(integration.id, {
          errorCount: (integration.errorCount || 0) + 1,
        });
      }
    }
  } catch (error) {
    console.error('Error in Google Sheets webhook handler:', error);
  }
}
