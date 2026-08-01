import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('ManualContent', () => {
  it('references every bundled manual video and marks each one for autoplay playback', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'components', 'manual', 'ManualContent.vue'), 'utf8');
    const renderedVideos = [...source.matchAll(/src="\/videos\/([^"]+)"/g)].map((match) => match[1]).sort();
    const expectedVideos = readdirSync(join(process.cwd(), 'public', 'videos')).sort();

    expect(renderedVideos).toEqual(expectedVideos);
    expect((source.match(/<video\b/g) ?? []).length).toBe(expectedVideos.length);
    expect((source.match(/autoplay/g) ?? []).length).toBe(expectedVideos.length);
    expect((source.match(/loop/g) ?? []).length).toBe(expectedVideos.length);
    expect((source.match(/muted/g) ?? []).length).toBe(expectedVideos.length);
    expect((source.match(/playsinline/g) ?? []).length).toBe(expectedVideos.length);
  });
});