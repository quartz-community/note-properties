import { FullSlug, QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzTransformerPlugin } from '@quartz-community/types';
import { NotePropertiesOptions } from './types.js';
export { NotePropertiesComponent, NotePropertiesComponentOptions } from './components/index.js';

declare const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>>;
declare module "vfile" {
    interface DataMap {
        aliases: FullSlug[];
        frontmatter: {
            [key: string]: unknown;
        } & {
            title: string;
        } & Partial<{
            tags: string[];
            aliases: string[];
            modified: string;
            created: string;
            published: string;
            description: string;
            socialDescription: string;
            publish: boolean | string;
            draft: boolean | string;
            lang: string;
            enableToc: string;
            cssclasses: string[];
            socialImage: string;
            comments: boolean | string;
        }>;
        frontmatterLinks: string[];
        noteProperties: {
            properties: Record<string, unknown>;
            hideView: boolean;
            /** Per-note override: true = show, false = hide, undefined = follow config */
            showProperties?: boolean;
            /** Per-note override: true = collapsed, false = expanded, undefined = follow component option */
            collapseProperties?: boolean;
        };
    }
}

export { NoteProperties, NotePropertiesOptions };
