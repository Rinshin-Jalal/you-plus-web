/**
 * 🔍 TEST: Field Extraction for transformation_date and daily_non_negotiable
 *
 * This test specifically checks if these two fields are being extracted and saved.
 *
 * Run: npx tsx src/features/onboarding/tests/test-field-extraction.ts
 */
declare const CONFIG: {
    AUTH_TOKEN: string;
    API_URL: string;
};
declare function testFieldExtraction(): Promise<void>;
