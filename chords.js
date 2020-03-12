const semitonesIn = {
    "maj3": 4,
    "min3": 3,
    "maj2": 2,
}

// The chord tree is a (relatively) human readable format for encoding chords by stacking intervals
// It's an exhaustive way of representing all chords.
// Just start at the root then have a list of the chords create by stacking a given interval
// and so on recursively.
// Naturally there are deep interactions in the canopy, but at least this way is complete.
const chordTree = {
    "maj3": {
        "min3": {
            "description": "major triad root position",
            "symbol": "",
            "min3": {
                "description": "7th root position",
                "symbol": "7",
            },
            "maj3": {
                "description": "major 7th root position",
                "symbol": "maj7",
            },
            
        },
        "maj3": {
            "description": "augmented triad",
            "symbol": "aug",
        }
    },
    "min3": {
        "maj3": {
            "description": "minor triad root position",
            "symbol": "m",
            "maj2": {
                "description": "minor 6th root position",
                "symbol": "m6",
            },
            "min3": {
                "description": "minor 7th root position",
                "symbol": "m7",
            }
        },
    },
}

function flatten(tree) {
    var chords = {};
    Object.keys(tree).forEach(interval => {
        var childTree = tree[interval]
        if (semitonesIn.hasOwnProperty(interval)) {
            var childChords = flatten(childTree)
            Object.keys(childChords).forEach(symbol => {
                child = childChords[symbol]
                child.addBelow(interval)
                chords[symbol] = child
            });
        }
    });

    if (tree.hasOwnProperty("symbol")) {
        chords[tree["symbol"]] = new ChordType(tree["symbol"], tree["description"])
    }

    return chords
}

class ChordType {
    constructor(symbol, description) {
        this.symbol = symbol
        this.description = description
        this.intervals = []
    }

    addBelow(interval) {
        this.intervals.unshift(interval)
    }
}

class ChordBook {
    constructor () {
        // TODO: flatten on the server side or once ahead of time to reduce computation
        this.symbolMap = flatten(chordTree)
    }

    // flatten recurses the chord tree an makes a map from symbol to list of intervals
    

    make(root, symbol) {
        var chord = new Chord(root);
        chord.symbol = root.toUpperCase() + symbol
        this.symbolMap[symbol].intervals.forEach((interval) => {
            chord.stack(interval);
        });
        return chord
    }
}

class ChordSet {
    constructor () {
        this.current = 0
        this.chords = [];
    }

    // infer the right set of chords from a comma separated list of chord symbols
    infer(book) {
        this.chords = [];
        var text = document.querySelector("#chords").innerHTML

        var symbols = text.split(" ")
        symbols.forEach(symbol => {
            var root = symbol[0].toLocaleLowerCase();
            if (symbol.includes("#")) {
                root += "#"
            }
            this.chords.push(book.make(root, symbol.substring(root.length)))
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
        document.querySelector("#chords").innerHTML = desc
    }
}

class Chord {
    constructor(note, symbol) {
        this.symbol = symbol
        this.root = note
        this.highest = note
        this.notes = [note]
    }

    stack(interval) {
        var index = (noteOrder.indexOf(this.highest) + semitonesIn[interval]) % 12
        var newNote = noteOrder[index]
        this.notes.push(newNote)
        this.highest = newNote
        return this
    }

    equals(notes) {
        // cajole map of octaved notes into the abstract
        var abstractNotes = [];
        notes.forEach((isPressed, note, map) => {
            if (isPressed) {
                abstractNotes.push(note)
            }
        });

        var strip = function(note) {
            var stripped = note.substring(0, note.search(/\d/))
            if (stripped == "") {
                throw "note stripped of its octave is empty"
            }
            return note.substring(0, note.search(/\d/))
        } 

        abstractNotes.sort((a,b) => {
            // sort by octave
            var aoctave = a[a.search(/\d/)]
            var boctave = b[b.search(/\d/)]

            if (aoctave < boctave) {
                return -1
            } else if (aoctave > boctave) {
                return 1
            } else {
                // TODO: handle the fact that the starting note of the octaves may change where the note order ought to start
                if(noteOrder.indexOf(strip(a)) < noteOrder.indexOf(strip(b))) {
                    return -1
                }
                return 1
            }
        })

        // remove octave digit
        abstractNotes.forEach((note, index) => {
            abstractNotes[index] = strip(note)
        })

        // check notes against chord
        // TODO: perhaps more detailed help notes
        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i] != abstractNotes[i]) {
                return false
            }
        }

        return true
    }
}