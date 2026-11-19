// ----------------------------------------------------------------------
// Typo — Caption 12 · Tag 13 · Badge 14 · Body 16 · Title 18 · SubTitle 20 · SubHead 24 · Head 28
// 굵기 .Light/.Regular/.Medium/.Semibold/.Bold. 대시보드 한 화면은 4티어 이하(title·body·badge·caption).
// ----------------------------------------------------------------------
import {
  createTypo,
  type TypoComponent,
} from '@/src/components/typo/create-typo';
import type { TypoTier, TypoWeight } from '@/src/theme/typography';

type TierSet = Record<TypoWeight, TypoComponent>;

function tierSet(tier: TypoTier): TierSet {
  return {
    Light: createTypo(tier, 'Light'),
    Regular: createTypo(tier, 'Regular'),
    Medium: createTypo(tier, 'Medium'),
    Semibold: createTypo(tier, 'Semibold'),
    Bold: createTypo(tier, 'Bold'),
  };
}

export const Typo = {
  Caption: tierSet('caption'),
  Tag: tierSet('tag'),
  Badge: tierSet('badge'),
  Body: tierSet('body'),
  Title: tierSet('title'),
  SubTitle: tierSet('subtitle'),
  SubHead: tierSet('subhead'),
  Head: tierSet('head'),
};

export type { TypoProps } from '@/src/components/typo/create-typo';
