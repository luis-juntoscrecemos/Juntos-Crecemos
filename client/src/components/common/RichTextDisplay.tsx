interface RichTextDisplayProps {
  html: string;
  className?: string;
  testId?: string;
}

export function RichTextDisplay({ html, className, testId }: RichTextDisplayProps) {
  if (!html) return null;

  const isPlainText = !html.includes('<');

  if (isPlainText) {
    return (
      <p className={className} data-testid={testId}>
        {html}
      </p>
    );
  }

  return (
    <div
      className={`rich-text-content ${className || ''}`}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
