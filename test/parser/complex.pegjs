{
  function autoCompleteTracer () {
    this.level = 1
    this.tree = {rule: 'root', level: 0, children:[]}
    this.currentNode = this.tree
  }
  autoCompleteTracer.prototype.trace = function (input) {
  }
}

start
  = ws10 v:OR    ws01 { return v }
  / ws10 v:AND   ws01 { return v }
  / ws10 v:NOT   ws01 { return v }
  / ws10 v:Block ws01 { return v }

ws "whitespace"
  = chars:[ \t\n\r]* { return chars.join("") }

// means when start <  cursorPos <  end, do auto complete
ws00 'ws00'
  = ws
// means when start <= cursorPos <  end, do auto complete
ws10 'ws10'
  = ws
// means when start <  cursorPos <= end, do auto complete
ws01 'ws01'
  = ws
// means when start <= cursorPos <= end, do auto complete
ws11 'ws11'
  = ws

OR "or"
  = head:ANDBlock
    tail:(ws01 ORSeperator ws10 v:ANDBlock { return v; })+
    { return {$or: [head].concat(tail)}; }

AND "and"
  = head:NOTBlock
    tail:(ANDSeperator ws10 v:NOTBlock { return v; })+
    { return {$and: [head].concat(tail)}; }

ANDBlock "andblock"
  = AND
  / NOTBlock

NOTBlock "notblock"
  = NOT
  / Block

NOT "not"
  = NOTSeperator ws v:Block { return {$not: v} }

Block "block"
  = NestedORBlock
  / NestedANDBlock
  / NestedNOTBlock
  / NestedPairBlock
  / NestedValueBlock
  / Pair
  / ValueBlock

NestedORBlock 'nestedorblock'
  = NestedStart ws01 v:OR ws10 NestedEnd  {return v}
NestedANDBlock 'nestedandblock'
  = NestedStart ws01 v:AND ws10 NestedEnd  {return v}
NestedNOTBlock 'nestednotblock'
  = NestedStart ws01 v:NOT ws10 NestedEnd  {return v}
NestedPairBlock 'nestedpairblock'
  = NestedStart ws01 v:Pair ws10 NestedEnd  {return v}
NestedValueBlock 'nestedvalueblock'
  = NestedStart ws01 v:ValueBlock ws10 NestedEnd  {return v}

NestedStart = "("
NestedEnd = ")"


ANDSeperator
  = ws01 '&&' { return text() }
  / ws00 { return text() }

ORSeperator
  = '||' { return text() }

NOTSeperator
  = '~' { return text() }

ws10Object 'ws10object'
  = ws

ws01Object 'ws01object'
  = ws

Object "object"
  = ObjectStart ws10Object
    pairs:(
      head:Pair ws01Object
      tail:(ObjectSeperator ws10Object m:Pair ws01Object { return m; })*
      {
        var result = {};

        [head].concat(tail).forEach(function(element) {
          Object.assign(result, element)
        });

        return result;
      }
    )?
    ObjectEnd
    { return pairs !== null ? pairs: {} }

ObjectStart = "{"
ObjectEnd = "}"
ObjectSeperator = ','

ws10Array 'ws10array'
  = ws

ws01Array 'ws01array'
  = ws

Array "array"
  = ArrayStart ws10Array
    values:(
      head:ValueArray ws01Array
      tail:(ArraySeperator ws10Array v:ValueArray ws01Array { return v; })*
      { return [head].concat(tail); }
    )?
    ArrayEnd
    { return values !== null ? values : []; }

ArrayStart = "["
ArrayEnd = "]"
ArraySeperator = ','

Pair "pair"
  = keys:Key ws PairSeperator ws v:ValuePair {
    if (keys.length===1) {
      return {[keys[0]]: v}
    } else {
      keys = keys.map(_ => _)
      let key = keys.splice(0,1)[0]
      let pop = keys.pop()
      v = {[`\$${pop}`]: v}
      let length = keys.length
      for (let i=0; i<length; i++) {
        pop = keys.pop()
        v = {[`\$${pop}`]: v}
      }
      return {[key]: v}
    }
  }
  / keys:Key ws ws01PS {
    if (keys.length===1) {
      return {[keys[0]]: null}
    } else {
      keys = keys.map(_ => _)
      let key = keys.splice(0,1)[0]
      let pop = keys.pop()
      let v = {[`\$${pop}`]: null}
      let length = keys.length
      for (let i=0; i<length; i++) {
        pop = keys.pop()
        v = {[`\$${pop}`]: v}
      }
      return {[key]: v}
    }
  }

ws01PS "pws01"
  = PairSeperator

OPSeperator
  = '|'

PairSeperator
  = ':'

OP "op"
  = chars:[0-9a-zA-Z_$]* { return chars.join("") }

//Key "key"
//  = key:KeyValue ws OPSeperator ws op:OP { return [key, op] }
//  / key:KeyValue ws OPSeperator { return [key, ''] }
//  / key:KeyValue { return [key] }

Key "key"
  = head:KeyValue
    middle:(
      ws OPSeperator ws op:OP
      { return op }
    )*
    tail:(
      ws OPSeperator
    )?
    {
      if (tail === null) {
        return [head].concat(middle)
      } else {
        return [head].concat(middle).concat([""])
      }
    }

KeyValue "keyvalue"
  = String
  / SimpleString
  / Number

SimpleString "simpleString"
  = prefix:[a-zA-Z_$] suffix:[0-9a-zA-Z_$.]* { return prefix + suffix.join(""); }

// ----- Numbers ----- from https://github.com/pegjs/pegjs/blob/master/examples/json.pegjs

ValuePair "value:pair"
  = Value
ValueBlock "value:block"
  = Value
ValueArray "value:array"
  = Value

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
