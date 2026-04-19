import { Prism } from 'prism-react-renderer';

// Register PHP grammar (not included in prism-react-renderer's default bundle).
// Guarded so it only runs once across all importing modules.
if (typeof Prism !== 'undefined' && !Prism.languages.php) {
  Prism.languages.php = {
    comment: [
      { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
      { pattern: /\/\/.*/, greedy: true },
      { pattern: /#(?!\[).*/, greedy: true },
    ],
    string: [{ pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/, greedy: true }],
    keyword:
      /\b(?:abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
    variable: /\$+\w+\b/,
    function: /\b\w+(?=\s*\()/,
    'class-name': /\b[A-Z]\w*\b/,
    number:
      /\b0(?:x[\da-f]+|b[01]+|o[0-7]+)\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator:
      /=>|->|\.\.\.|\?\?=?|&&|\|\||[!=]==?|<=>|[<>]=?|[&|^~]|[+\-*/%]=?|\.=?|\?:/,
    punctuation: /[{}()\[\];:,]/,
  };
}
