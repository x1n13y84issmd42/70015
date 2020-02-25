/**
 * Keystroke is a sequence of keys which triggers some function.
 */
class KeyStroke {
	with = [];
	keys = [];
	handler = () => {};

	/**
	 * Specifies the keys you need to hold before starting the keystroke (think shifts, ctrls & alts).
	 * @param {*} keys A keys to hold.
	 */
	with(keys) {
		this.with = keys.slice(0);
	}
	
	/**
	 * Specifies a sequence of keys making a keystroke.
	 * @param {*} keys A sequence of keys in a keystroke.
	 * @param {Function} fn A function to invoke when a keystroke is performed.
	 */
	on(keys) {
		this.keys = keys.slice(0);
	}
	
	/**
	 * Specifies a function to execute on the keystroke.
	 * @param {Function} fn A function to invoke.
	 */
	do(fn) {
		this.handler = fn;
	}

	/**
	 * Specifies a time span during which a keystroke must be executed.
	 * @param {number} t A time span in ms.
	 */
	during(t) {}

	/**
	 * Checks if the given keystroke matches. Called by KeyStrokeHandler.
	 * @param {Array} withKeys A list of keys to hold.
	 * @param {Array} keys A sequence of pressed keys.
	 */
	match(withKeys, keys) {}

}

/**
 * KeyStrokeHandler is a collection of keystrokes.
 */
class KeyStrokeHandler {
	strokes = [];
	
	add(ks) {
		this.strokes.push(ks);
	}

	handleEvent(evt) {
		//TODO:
		//	Store the current sequence here
		//	Count matched strokes (there may be multiple)
		//	If none has matched - reset
	}

	onKeyDown() {

	}

	onKeyUp() {

	}
}

class NaiveInputHandler {
	handlers = [];

	handle(cb) {
		this.handlers.push(cb);
	}

	handleEvent(evt) {
		this.handlers.forEach((h) => h(evt));
	}
}

/**
 * The main keyboard input handler. Stores input handlers in a stack,
 * only the last pushed item handles input. This is used by modal dialogs
 * to override input handling for the underlying UI.
 */
class Input {
	handlers = [];

	push(h) {
		this.handlers.push(h)
	}

	pop() {
		return this.handlers.pop();
	}

	handleEvent(e) {
		if (this.handlers.length) {
			this.handlers[this.handlers.length - 1].handleEvent(e);
		}
	}
}

/*
let ihGlobal = new KeyStrokeHandler();
ihShare.on(['esc']).do(() => bench.back());
ihShare.on(['esc', 'esc', 'esc']).during(200).do(() => bench.closeAll());

let ihShare = new KeyStrokeHandler();
ihShare.with('shift').on(['j', '1']).during(200).do(() => {   });

input.push(ihGlobal);
input.push(ihShare);
input.pop();

[J, C]

let km = {
	J: {
		C: () => {}
	}
};
*/
