const { processFilingData } = require('./sec-data-fetcher');

describe('processFilingData', () => {
  test('formats a raw filing object', () => {
    const raw = {
      accessionNo: '000123456-24-000001',
      formType: '8-K',
      filedAt: '2024-01-01T00:00:00Z',
      ticker: 'TEST',
      cik: '123456',
      companyName: 'Test Corp',
      linkToFilingDetails: 'http://example.com/filing'
    };
    const result = processFilingData(raw);
    expect(result).toMatchObject({
      accessionNo: raw.accessionNo,
      formType: raw.formType,
      filedAt: raw.filedAt,
      ticker: raw.ticker,
      cik: raw.cik,
      companyName: raw.companyName,
      secLink: raw.linkToFilingDetails
    });
    expect(result.importedAt).toBeInstanceOf(Date);
  });
});
