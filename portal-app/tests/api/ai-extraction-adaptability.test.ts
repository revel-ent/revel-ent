import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractAtlasSignalsFromDocument } from '@/lib/ai';

// These tests exercise the offline (no GEMINI_API_KEY) regex fallback path,
// which must remain culturally adaptable: a wedding of ANY tradition should
// surface its own function names plus universal contract obligations. With a
// real key present the Gemini path is open-ended and strictly broader, so the
// fallback is the floor we guarantee.
describe('extractAtlasSignalsFromDocument — cross-cultural fallback', () => {
  const savedKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (savedKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = savedKey;
    }
  });

  it('surfaces South Asian functions and universal contract terms', async () => {
    const doc = `Wedding services agreement. The baraat begins at 5:00 PM followed by the
      ceremony and reception. A 25% deposit is due on signing; balance due 30 days prior.
      A certificate of insurance is required. Force majeure applies.`;

    const result = await extractAtlasSignalsFromDocument({ sourceType: 'contract', content: doc });

    expect(result.keywordSignals).toEqual(
      expect.arrayContaining(['baraat', 'ceremony', 'reception', 'deposit', 'balance due', 'certificate of insurance', 'force majeure'])
    );
    expect(result.extractedPercentages).toContain('25%');
  });

  it('surfaces Jewish wedding functions without any South Asian terms present', async () => {
    const doc = `Catering contract for the wedding. Program: bedeken, then the chuppah,
      followed by the hora during the reception. Service charge of 22% applies.
      Payment terms: balance due upon delivery.`;

    const result = await extractAtlasSignalsFromDocument({ sourceType: 'contract', content: doc });

    expect(result.keywordSignals).toEqual(
      expect.arrayContaining(['bedeken', 'chuppah', 'hora', 'reception', 'service charge', 'payment terms', 'balance due'])
    );
    // No South-Asian-specific function should be hallucinated by the regex path.
    expect(result.keywordSignals).not.toContain('baraat');
    expect(result.keywordSignals).not.toContain('sangeet');
  });

  it('surfaces Western / Christian wedding functions', async () => {
    const doc = `Venue rental for the wedding. Includes rehearsal dinner on Friday, the
      processional and recessional on Saturday, and a cocktail hour before the reception.
      Curfew is 11:00 PM. Overtime billed per hour. Gratuity not included.`;

    const result = await extractAtlasSignalsFromDocument({ sourceType: 'proposal', content: doc });

    expect(result.keywordSignals).toEqual(
      expect.arrayContaining(['rehearsal dinner', 'processional', 'recessional', 'cocktail hour', 'reception', 'curfew', 'overtime', 'gratuity'])
    );
  });

  it('surfaces an East Asian tea ceremony', async () => {
    const doc = `Event order: tea ceremony at 10:00 AM, ceremony at noon, reception in the
      evening. Deposit of $5,000.00 required to hold the date.`;

    const result = await extractAtlasSignalsFromDocument({ sourceType: 'contract', content: doc });

    expect(result.keywordSignals).toEqual(expect.arrayContaining(['tea ceremony', 'ceremony', 'reception', 'deposit']));
    expect(result.extractedAmounts).toContain('$5,000.00');
  });

  it('returns a low-confidence review prompt when no structured signals exist', async () => {
    const result = await extractAtlasSignalsFromDocument({ sourceType: 'note', content: 'Looking forward to the big day!' });

    expect(result.keywordSignals).toHaveLength(0);
    expect(result.extractedDates).toHaveLength(0);
    expect(result.extractedAmounts).toHaveLength(0);
    expect(result.summary).toContain('No strong structured signals');
  });
});
