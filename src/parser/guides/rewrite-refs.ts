import { dirname, resolve, extname } from 'path';
import { existsSync } from 'fs';

/**
 * Rewrite relative image and link references in guide markdown body.
 *
 * - Relative images (`./diagram.png`, `../img/foo.png`) are rewritten to
 *   `/guides/_assets/<filename>` and the source files are collected for copying.
 * - Relative `.md`/`.mdx` links are rewritten to their route path.
 *
 * Returns the rewritten body and a list of asset files to copy.
 */
export interface AssetRef {
  /** Absolute source path of the asset file. */
  src: string;
  /** Destination path relative to the site's public/ directory. */
  dest: string;
}

export interface RewriteResult {
  body: string;
  assets: AssetRef[];
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);
const MD_EXTS = new Set(['.md', '.mdx']);

export function rewriteRefs(
  body: string,
  sourcePath: string,
  guideSection: string,
  guideSubsection: string | undefined
): RewriteResult {
  const sourceDir = dirname(sourcePath);
  const assets: AssetRef[] = [];

  // Match markdown images: ![alt](path) and links: [text](path)
  const rewritten = body.replace(
    /(!?\[(?:[^\]]*)\])\(([^)]+)\)/g,
    (match, prefix: string, rawHref: string) => {
      // Skip absolute URLs and anchors
      if (/^(https?:\/\/|\/|#)/.test(rawHref)) return match;

      const absPath = resolve(sourceDir, rawHref);
      const ext = extname(rawHref).toLowerCase();
      const isImage = prefix.startsWith('!') || IMAGE_EXTS.has(ext);

      if (isImage && existsSync(absPath)) {
        // Rewrite to public assets path
        const filename = rawHref.split('/').pop()!;
        const dest = `guides/_assets/${filename}`;
        assets.push({ src: absPath, dest });
        return `${prefix}(/data/${dest})`;
      }

      if (MD_EXTS.has(ext)) {
        // Rewrite .md/.mdx link to route path
        const base = rawHref.replace(/\.\w+$/, '').replace(/^\.\/?/, '');
        const parts = ['guides', guideSection];
        if (guideSubsection) parts.push(guideSubsection);
        parts.push(
          base
            .split('/')
            .pop()!
            .replace(/^\d+[-_]/, '')
        );
        return `${prefix}(/${parts.join('/')})`;
      }

      return match;
    }
  );

  return { body: rewritten, assets };
}
