class ChordSet {
    constructor (chords, onComplete) {
        this.chords = chords
        this.onComplete = onComplete
        this.current = 0
    }

    getCurrent() {
        if (this.current < this.chords.length) {
            return this.chords[this.current]
        }
    }

    complete() {
        this.current++
        this.render()
        console.log("complete!")
    }

    render() {
        var desc = "";
        this.chords.forEach((chord, i) => {
            if (i < this.current) {
                desc += chord.name.strike() + ", "
            } else {
                desc += chord.name + ", "
            }
        })
        desc = desc.substr(0, desc.lastIndexOf(", "))
        document.querySelector("#chords").innerHTML = desc
    }
}

// TODO: merge with blackKeys
function whiteKeys(keys) {
    let whites = [];
    keys.forEach(key => {
        if (white(key)){
            whites.push(key)
        }
    });
    return whites
}

function white(key) {
    return !key.includes("#")
}

// Black keys includes ghost black keys like the key that would be between b and c
function physicalBlackKeys(keys) {
    let blacks = [];
    var lastWasWhite = true;
    keys.forEach(key => {
        if (!white(key)) {
            blacks.push(key)
            lastWasWhite = false
        } else {
            if (lastWasWhite) {
                blacks.push("")
                lastWasWhite = false
            } else {
                lastWasWhite = true
            }
        }
    });
    return blacks
}

class Piano {
    constructor(el, options) {
        this.canvas = el;
        this.context = this.canvas.getContext('2d')
        this.keys = options.keys
        this.pressed = new Map()

        this.width = window.innerWidth * 0.9

        this.keyWidth = this.width / (whiteKeys(this.keys).length)
        this.height = 300;
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.chords = options.chords
    }

    render() {
        // Clear the canvas
        this.context.clearRect(0, 0, this.width, this.height)

        // Draw the white keys
        var x = 0;
        this.keys.forEach(key => {
            this.context.fillStyle = "#FFFFFF";
            if (this.pressed.get(key)) {
                this.context.fillStyle = "#00FF00";
            }

            if (white(key)) {
                this.context.fillRect(x*this.keyWidth, 0, this.keyWidth-1, this.height)
                x += 1
            }
        });

        // Draw the black keys
        var x = 0;
        this.keys.forEach(key => {
            this.context.fillStyle = "#000000";
            if (this.pressed.get(key)) {
                this.context.fillStyle = "#00FF00";
            }

            if (!white(key)) {
                this.context.fillRect((x - 0.25)*this.keyWidth , 0, this.keyWidth/2, this.height/2)
            } else {
                x += 1
            }
        });
    }

    CheckSuccess() {
        if (this.chords.getCurrent().equals(this.pressed)) {
            this.chords.complete()
        }
    }
    
    pressKey(note) {
        this.pressed.set(note, true)
        this.render()
        this.CheckSuccess()
    }

    releaseKey(note) {
        this.pressed.set(note, false)
        this.render()
        this.CheckSuccess()
    }

    // Handles computer keyboard note playing
    keyUp(event) {
        this.releaseKey(this.keyboardInputNote(event.keyCode))
    }

    // Handles computer keyboard note releasing
    keyDown(event) {
        this.pressKey(this.keyboardInputNote(event.keyCode))
    }

    // Keys the note repsented by a key on the computer keyboard
    keyboardInputNote(key) {
        // TODO: don't assume wasd
        key = String.fromCharCode(key).toLocaleLowerCase()

        // handle naturals
        var naturals = ["a","s","d","f","g","h","j","k","l",";"]
        var index = naturals.indexOf(key)
        if (index != -1) {
            return whiteKeys(this.keys)[index]
        }

        // handle black notes
        var blackKeys = ["q", "w","e","r","t","y","u","i","o","p","["]
        var index = blackKeys.indexOf(key)
        if (index != -1) {
            return physicalBlackKeys(this.keys)[index]
        }

        return ""
    }
}

const noteOrder = ["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"]

function octavesFrom(note, octavesLeft) {
    if (!white(note)) {
        throw "the notes on a keyboard must start from a white note, otherwise there'll be a weird half note space at the end of the keyboard"
    }

    var notes = [];
    var octave = 0;
    while (octavesLeft > 0) {
        var notesLeft = 12
        while (notesLeft > 0) {
            notes.push(note + octave)
            notesLeft--
            note = noteOrder[(noteOrder.indexOf(note)+1)%12]
        }
        octavesLeft--
        octave++
    }
    notes.push(note + octave)
    return notes
}

class Chord {
    constructor(note, name) {
        this.name = name
        this.root = note
        this.highest = note
        this.notes = [note]
    }

    stack(interval) {
        var index = (noteOrder.indexOf(this.highest) + semitonesIn(interval)) % 12
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

class ChordBook {
    constructor () {}

    // TODO: handle different octaves
    majorTriad(root) {
        var chord = new Chord(root, root + " major");
        chord.stack("maj3").stack("min3")
        return chord
    }
    
}

function semitonesIn(interval) {
    switch (interval) {
        case "maj3":
            return 4
        case "min3":
            return 3
    }
}

book = new ChordBook()
chords = new ChordSet(
    [
        book.majorTriad("c"),
        book.majorTriad("d")
    ],
)

const options = {
    keys: octavesFrom("c", 3),
    chords: chords,
}

const piano = new Piano(document.querySelector("#piano"), options);

document.addEventListener('keydown', (event) => {
    piano.keyDown(event)
});

document.addEventListener('keyup', (event) => {
    piano.keyUp(event)
});

piano.render();
chords.render();