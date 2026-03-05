export interface TerminalHeaderTitleProps {
  defaultTitle?: string;
}

export function TerminalHeaderTitle({ defaultTitle = "ani@potts:~/anipotts.com" }: TerminalHeaderTitleProps) {
  const splitIndex = defaultTitle.indexOf("~/");
  const hasPrefix = splitIndex > 0;
  const prefix = hasPrefix ? defaultTitle.slice(0, splitIndex) : "";
  const path = hasPrefix ? defaultTitle.slice(splitIndex) : defaultTitle;

  return (
    <span className="ml-3 text-[10px] md:text-xs text-muted font-medium tracking-wide">
      {hasPrefix && <span className="hidden md:inline">{prefix}</span>}
      {path}
      <span className="animate-pulse">_</span>
    </span>
  );
}
