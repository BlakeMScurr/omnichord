"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: replace with enum, fix weird "cannot find name" error
const semitonesIn = new Map([
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
]);
class ChordType {
    constructor(intervals, symbol, description) {
        this.symbol = symbol;
        this.description = description;
        this.intervals = intervals;
    }
}
class ChordBook {
    constructor() {
        this.symbolMap = new Map([
            ["dim", new ChordType(new Array("Minor3rd", "Minor3rd"), "dim", "diminished triad root")],
            ["m", new ChordType(new Array("Minor3rd", "Major3rd"), "m", "minor triad root position")],
            ["m", new ChordType(new Array("Minor3rd", "Major3rd", "Minor3rd"), "m", "minor 7th root position")],
            ["", new ChordType(new Array("Major3rd", "Minor3rd"), "", "major triad root position")],
            ["7", new ChordType(new Array("Major3rd", "Minor3rd", "Minor3rd"), "7", "7th root position")],
            ["maj7", new ChordType(new Array("Major3rd", "Minor3rd", "Major3rd"), "maj7", "major 7th root position")],
            ["aug", new ChordType(new Array("Major3rd", "Major3rd"), "aug", "augmented triad")],
        ]);
    }
    // TODO: note type
    make(root, symbol) {
        var chord = new Chord(root);
        chord.symbol = root.toUpperCase() + symbol;
        // Ensure the chord type exists
        // TODO: more succinct way - does ? throw an error?
        var possibleType = this.symbolMap.get(symbol);
        if (!possibleType) {
            throw "chord " + symbol + "unknown";
        }
        var type = possibleType;
        type.intervals.forEach((interval) => {
            chord.stack(interval);
        });
        return chord;
    }
}
exports.ChordBook = ChordBook;
class ChordSet {
    constructor() {
        this.current = 0;
        this.chords = [];
    }
    // infer the right set of chords from a comma separated list of chord symbols
    infer(book) {
        this.chords = [];
        var chordElem = document.querySelector("#chords");
        var text = chordElem.innerHTML;
        var symbols = text.split(" ");
        symbols.forEach(symbol => {
            var root = symbol[0].toLocaleLowerCase();
            if (symbol.includes("#")) {
                root += "#";
            }
            this.chords.push(book.make(root, symbol.substring(root.length)));
        });
    }
    getCurrent() {
        if (this.current < this.chords.length) {
            return this.chords[this.current];
        }
    }
    completeNext() {
        this.current = (this.current + 1) % this.chords.length;
        this.render();
    }
    reset() {
        this.current = 0;
        this.render();
    }
    render() {
        var desc = "";
        this.chords.forEach((chord, i) => {
            if (i < this.current) {
                desc += chord.symbol.strike() + " ";
            }
            else {
                desc += chord.symbol + " ";
            }
        });
        desc = desc.substr(0, desc.lastIndexOf(" "));
        var chordElem = document.querySelector("#chords");
        chordElem.innerHTML = desc;
    }
}
exports.ChordSet = ChordSet;
exports.NoteOrder = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
class Chord {
    constructor(note) {
        this.symbol = "";
        this.root = note;
        this.highest = note;
        this.notes = [note];
    }
    stack(interval) {
        var index = (exports.NoteOrder.indexOf(this.highest) + semitonesIn.get(interval)) % 12;
        var newNote = exports.NoteOrder[index];
        this.notes.push(newNote);
        this.highest = newNote;
        return this;
    }
    equals(notes) {
        // cajole map of octaved notes into the abstract
        // TODO: get the piano to output cajoled notes
        var abstractNotes = [];
        notes.forEach((isPressed, note, map) => {
            if (isPressed) {
                abstractNotes.push(note);
            }
        });
        var strip = function (note) {
            var stripped = note.substring(0, note.search(/\d/));
            if (stripped == "") {
                throw "note stripped of its octave is empty";
            }
            return note.substring(0, note.search(/\d/));
        };
        abstractNotes.sort((a, b) => {
            // sort by octave
            var aoctave = a[a.search(/\d/)];
            var boctave = b[b.search(/\d/)];
            if (aoctave < boctave) {
                return -1;
            }
            else if (aoctave > boctave) {
                return 1;
            }
            else {
                // TODO: handle the fact that the starting note of the octaves may change where the note order ought to start
                if (exports.NoteOrder.indexOf(strip(a)) < exports.NoteOrder.indexOf(strip(b))) {
                    return -1;
                }
                return 1;
            }
        });
        // remove octave digit
        abstractNotes.forEach((note, index) => {
            abstractNotes[index] = strip(note);
        });
        // check notes against chord
        // TODO: perhaps more detailed help notes
        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i] != abstractNotes[i]) {
                return false;
            }
        }
        return true;
    }
}
