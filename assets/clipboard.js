let Clipboard = {
	fallbackCopy: (s) => {
		var textArea = document.createElement("textarea");
		textArea.value = s;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Fallback: Copying text command was ' + msg);
		} catch (err) {
			console.error('Fallback: Oops, unable to copy', err);
		}

		document.body.removeChild(textArea);
	},

	copy: (s) => {
		if (!navigator.clipboard) {
			Clipboard.fallbackCopy(s);
			return;
		}
		navigator.clipboard.writeText(s).then(function() {
			console.log('Async: Copying to clipboard was successful!');
		}, function(err) {
			console.error('Async: Could not copy text: ', err);
		});
	}
}