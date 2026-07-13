import { Text, type TextStyle } from "react-native";

/**
 * Renders prose containing the backend's `*"verbatim quote"*` convention
 * (see the system prompt in generate-blueprint/index.ts) as visible
 * emphasis — the cue that a phrase is the person's own words, not a
 * summary. A narrow, purpose-built parser rather than a markdown library:
 * the backend only ever emits this one pattern, so that's the only pattern
 * this needs to understand. Ports EmphasizedText.swift's role exactly;
 * React Native has no `AttributedString(markdown:)` equivalent, so this
 * does the split by hand instead of parsing real Markdown.
 *
 * Never crashes on malformed input — a string with no matches (or a stray
 * unmatched asterisk) just renders as plain text, same fallback guarantee
 * the Swift source documents.
 */
const QUOTE_PATTERN = /\*"([^"]+)"\*/g;

type Segment = { text: string; isQuote: boolean };

function splitOnQuotes(content: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  QUOTE_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = QUOTE_PATTERN.exec(content))) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index), isQuote: false });
    }
    segments.push({ text: `"${match[1]}"`, isQuote: true });
    lastIndex = QUOTE_PATTERN.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex), isQuote: false });
  }
  return segments;
}

type EmphasizedTextProps = {
  content: string;
  style?: TextStyle | TextStyle[];
  quoteStyle?: TextStyle | TextStyle[];
};

export function EmphasizedText({ content, style, quoteStyle }: EmphasizedTextProps) {
  const segments = splitOnQuotes(content);

  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.isQuote ? (
          <Text key={index} style={quoteStyle}>
            {segment.text}
          </Text>
        ) : (
          segment.text
        )
      )}
    </Text>
  );
}
