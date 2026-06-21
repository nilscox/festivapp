import clsx from 'clsx';
import production from 'react/jsx-runtime';
import rehypeReact from 'rehype-react';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeReact, production);

export function Markdown({ markdown, className, ...props }: { markdown: string } & React.ComponentProps<'div'>) {
  return (
    <div className={clsx('prose max-w-none dark:prose-invert text-inherit', className)} {...props}>
      {processor.processSync(markdown).result as React.ReactElement}
    </div>
  );
}
