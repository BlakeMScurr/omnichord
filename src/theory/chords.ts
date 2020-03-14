// TODO: replace with enum, fix weird "cannot find name" error
const semitonesIn: Map<string, number> = new Map([
    ["Semitone", 1],
    ["Tone", 2],
    ["Minor3rd", 3],
    ["Major3rd", 4],
    ["Perfect4th", 5],
    ["Augmented4th", 6],
    ["Perfect5th", 7],
    ["Minor6th", 8],
    ["Major6th", 9],
    ["Minor7th", 10],
    ["Major7th", 11],
])

class ChordType {
    intervals: Array<string>;
    symbol: string;
    description: string;

    constructor(intervals: Array<string>, symbol: string, description: string) {
        this.symbol = symbol
        this.description = description
        this.intervals = intervals
    }
}

export class ChordBook {
    symbolMap: Map<string, ChordType>;

    constructor () {
        this.symbolMap = new Map([
            // TODO: remove repeated symbol
            ["dim", new ChordType(new Array("Minor3rd", "Minor3rd"), "dim", "diminished triad root")],
            ["m", new ChordType(new Array("Minor3rd", "Major3rd"), "m", "minor triad root position")],
            ["m7", new ChordType(new Array("Minor3rd", "Major3rd", "Minor3rd"), "m7", "minor 7th root position")],
            ["", new ChordType(new Array("Major3rd", "Minor3rd"), "", "major triad root position")],
            ["7", new ChordType(new Array("Major3rd", "Minor3rd", "Minor3rd"), "7", "7th root position")],
            ["maj7", new ChordType(new Array("Major3rd", "Minor3rd", "Major3rd"), "maj7", "major 7th root position")],
            ["aug", new ChordType(new Array("Major3rd", "Major3rd"), "aug", "augmented triad")],
        ]);
    }

    // TODO: voicing booleans as options
    make(root: Note, symbol: string, octaveIndependent: boolean, voicingIndependent: boolean) {
        var chord = new Chord(root);
        chord.symbol = root.abstract.string().toUpperCase() + symbol

        // Ensure the chord type exists
        // TODO: more succinct way - does ? throw an error?
        var possibleType = this.symbolMap.get(symbol)
        if (!possibleType) {
            throw "chord " + symbol + "unknown"
        }
        var type = <ChordType>possibleType

        type.intervals.forEach((interval) => {
            chord.stack(interval);
        });
        return chord
    }

    recognise(notes: Array<Note>):Chord|undefined {
        if (notes.length != 0) {
            for (const [symbol, value] of this.symbolMap) { 
                var chord = this.make(notes[0], symbol, true, true)
                if (chord.equals(notes)) {
                    return chord
                }
            }
        }
    }
}

function noteString(notes: Array<Note>) {
    return notes.map((note: Note)=>{
        return note.string()
    }).join(", ")
}

export class ChordSet {
    current: number;
    chords: Array<Chord>;

    constructor () {
        this.current = 0
        this.chords = [];
    }

    // infer the right set of chords from a comma separated list of chord symbols
    infer(book: ChordBook) {
        this.chords = [];
        var chordElem = <HTMLParagraphElement>document.querySelector("#chords")
        var text = chordElem.innerHTML

        var symbols = text.split(" ")
        symbols.forEach(symbol => {
            var root = symbol[0].toLocaleLowerCase();
            if (symbol.includes("#")) {
                root += "#"
            }
            // start in fourth octave with middle c
            this.chords.push(book.make(new Note(NewAbstractNote(root), 4), symbol.substring(root.length), false, true))
        })
    }
    
    getCurrent() {
        if (this.current < this.chords.length) {
            return this.chords[this.current]
        }
    }

    completeNext() {
        this.current = (this.current + 1) % this.chords.length
        this.render()
    }

    reset() {
        this.current = 0
        this.render()
    }

    render() {
        var desc = "";
        this.chords.forEach((chord, i) => {
            if (i < this.current) {
                desc += chord.symbol.strike() + " "
            } else {
                desc += chord.symbol + " "
            }
        })
        desc = desc.substr(0, desc.lastIndexOf(" "))
        var chordElem = <HTMLParagraphElement>document.querySelector("#chords")
        chordElem.innerHTML = desc
    }
}

// Abstract notes like B and F# don't depend on octaves
export class AbstractNote {
    letter: string;
    sharp: boolean; // We only handle sharps in fundamental representation, enharmonic flats are a rendering issue
    constructor(name: string) {
        if (name.length == 0 || name.length > 2) {
            throw "invalid note name length " + name.length + " for note " + name
        }

        var validNote = new RegExp(/[a-gA-GX]/)
        this.letter = name[0]
        if (!validNote.test(this.letter)) {
            throw "note letter must be between \"a\" and \"g\", got " + this.letter
        }

        if (name.length == 2 && name[1] != "#") {
            throw "only sharps are valid accidentals, got " + name[1] + " from " + name
        }

        this.sharp = name.length == 2
    }
    
    string() {
        var str = this.letter
        if (this.sharp) {
            str += "#"
        }
        return str
    }

    next() {
        var i = NoteOrder.indexOf(this)
        var n = NoteOrder[(i+1)%12];
        return n
    }
}

export class Note {
    abstract: AbstractNote;
    octave: number;

    // TODO: parseNot function that accepts a nice string
	constructor(note: AbstractNote, octave: number) {
        this.abstract = note
        this.octave = octave
    }
    
    lowerThan(note: Note) {
        console.log("is " + note.string() + " lower than " + this.string())
        if (this.octave < note.octave) {
            return false
        }

        return NoteOrder.indexOf(this.abstract) < NoteOrder.indexOf(note.abstract)
    }

    next() {
        var octave = this.octave
        if (NoteOrder.indexOf(this.abstract) == 11) {
            octave++
        }
        return new Note(this.abstract.next(), octave)
    }

    string() {
        return this.abstract.string() + this.octave
    }
}

// TODO: unexport
const notelist = ["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"]
export const NoteOrder = notelist.map((name: string)=>{return new AbstractNote(name)})

export function NewAbstractNote(name: string) {
    for (var i = 0; i < NoteOrder.length; i++ ) {
        var note = NoteOrder[i]
        if (note.string() == name) {
            return note
        }
    }

    // Placeholder note/key
    // TODO: factor out
    if (name == "X") {
        return new AbstractNote("X")
    }
    throw "unknown note " + name
}

// Chords are actually strict voicings, and use octaved notes, not abstract notes
export class Chord {
    symbol: string;
    root: Note;
    highest: Note;
    notes: Array<Note>;

    constructor(note: Note) {
        this.symbol = ""
        this.root = note
        this.highest = note
        this.notes = [note]
    }

    stack(interval: string) {
        var index = NoteOrder.indexOf(this.highest.abstract) + <number>semitonesIn.get(interval)
        var nextAbstractNote = NoteOrder[index % 12]
        var newNote = new Note(nextAbstractNote, this.highest.octave + Math.floor((this.highest.octave + index)/12));
        this.notes.push(newNote)
        this.highest = newNote
        return this
    }

    equals(notes: Array<Note>) {
        // check notes against chord
        // TODO: perhaps more detailed help notes
        if (this.notes.length != notes.length) {
            return false
        }
        for (var i = 0; i < this.notes.length; i++) {
            if (notes[i] != undefined && this.notes[i].abstract.string() != notes[i].abstract.string()) {
                return false
            }
        }

        return true
    }
}