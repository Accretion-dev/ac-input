start
  = ws v:OR    ws { return v }
  / ws v:AND   ws { return v }
  / ws v:NOT   ws { return v }
  / ws v:Block ws { return v }

OR "or"
  = head:ANDBlock
    tail:(ws orSeperator ws v:ANDBlock { return v; })+
    { return {$or: [head].concat(tail)}; }

AND "and"
  = head:Block
    tail:(andSeperator ws v:Block { return v; })+
    { return {$and: [head].concat(tail)}; }

ANDBlock "andblock"
  = AND
  / Block

NOT "not"
  = notSeperator ws v:Block { return {$not: v} }

Block "block"
  = "(" ws v:OR ws ")" {return v}
  / "(" ws v:AND ws ")" {return v}
  / "(" ws v:NOT ws ")" {return v}
  / Pair
  / Value

andSeperator
  = ws '&&'
  / ws

orSeperator
  = '||'

notSeperator
  = '~'

Object "object"
  = '{' ws
    pairs:(
      head:Pair ws
      tail:(',' ws m:Pair ws { return m; })*
      {
        var result = {};

        [head].concat(tail).forEach(function(element) {
          Object.assign(result, element)
        });

        return result;
      }
    )?
    '}'
    { return pairs !== null ? pairs: {} }

Array "array"
  = '[' ws
    values:(
      head:Value ws
      tail:(',' ws v:Value ws { return v; })*
      { return [head].concat(tail); }
    )?
    ']'
    { return values !== null ? values : []; }

Pair "pair"
  = key:Key ws '|' ws op:OP ws ':' ws v:Value { return {[key]: {[`\$${op}`]: v}}}
  / key:Key ws '|' ws op:OP ws ':' { return {[key]: {[`\$${op}`]: null}}}
  / key:Key ws ':' ws v:Value { return {[key]:v} }
  / key:Key ws ':' { return {[key]:null} }

OP "op"
  = chars:[a-zA-Z_]* { return chars.join("") }

Key "key"
  = String
  / SimpleString
  / Number

SimpleString "simpleString"
  = prefix:[a-zA-Z_$] suffix:[0-9a-zA-Z_$.]* { return prefix + suffix.join(""); }

// ----- Numbers ----- from https://github.com/pegjs/pegjs/blob/master/examples/json.pegjs

Value "value"
  = false
  / null
  / true
  / Object
  / Array
  / String
  / SimpleString
  / Number

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }

DIGIT  = [0-9]

Number "number"
  = minus? int frac? exp? { return Number(text()) }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"

// ----- Strings ----- from https://github.com/pegjs/pegjs/blob/master/examples/javascript.pegjs
ws "whitespace"
  = [ \t\n\r]*

String "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return chars.join("")
    }
  / "'" chars:SingleStringCharacter* "'" {
      return chars.join("")
    }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" LineTerminatorSequence { return ""; }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b"; }
  / "f"  { return "\f"; }
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }
  / "v"  { return "\v"; }

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) SourceCharacter { return text(); }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

HexEscapeSequence
  = "x" digits:$(HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

UnicodeEscapeSequence
  = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

LineTerminator
  = [\n\r\u2028\u2029]

SourceCharacter
  = .

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

DecimalDigit
  = [0-9]

HexDigit
  = [0-9a-f]i
