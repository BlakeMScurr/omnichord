const WebMidi = window.WebMidi;

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
            this.chords.completeNext()
        }
    }
    
    pressKey(note) {
        this.pressed.set(note, true)
        this.render()
        this.CheckSuccess()
    }

    releaseKey(note) {
        this.pressed.delete(note)
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

function octavesFrom(note, octave, octavesLeft) {
    if (!white(note)) {
        throw "the notes on a keyboard must start from a white note, otherwise there'll be a weird half note space at the end of the keyboard"
    }

    var notes = [];
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

book = new ChordBook()
chords = new ChordSet()

const options = {
    keys: octavesFrom("c", 4, 3),
    chords: chords,
}

const piano = new Piano(document.querySelector("#piano"), options);

// Setup interactions
document.addEventListener('keydown', (event) => {
    piano.keyDown(event)
});

document.addEventListener('keyup', (event) => {
    piano.keyUp(event)
});

WebMidi.enable(function (err) {
    if (err) {
        console.log("WebMidi could not be enabled.", err);
    }
    // TODO: make sure we get the right input by checking all possible inputs
    WebMidi.inputs[0].addListener('noteon', "all",
    function (e) {
      piano.pressKey(e.note.name.toLocaleLowerCase() + e.note.octave)
    });
    WebMidi.inputs[0].addListener('noteoff', "all",
    function (e) {
        piano.releaseKey(e.note.name.toLocaleLowerCase() + e.note.octave)
    });
});

document.querySelector("#changeChords").onclick = function() {
    var newChordTextArea = document.querySelector("#newChords");
    document.querySelector("#chords").innerHTML = newChordTextArea.value
    newChordTextArea.value = ""
    chords.infer(book)
};
chords.infer(book)

// initial rendering
piano.render();
chords.render();