import { FullSlug, QuartzTransformerPlugin } from '@quartz-community/types';
export { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzTransformerPlugin } from '@quartz-community/types';
import { NotePropertiesOptions } from './types.js';
export { NotePropertiesComponent, NotePropertiesComponentOptions } from './components/index.js';

declare const NoteProperties: QuartzTransformerPlugin<Partial<NotePropertiesOptions>>;
declare module "vfile" {
    interface DataMap {
        aliases: FullSlug[];
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
