import siteData from '@/public/data/site-data.json';

export type SiteData = typeof siteData;

export function getSiteData(): SiteData {
  return siteData;
}
