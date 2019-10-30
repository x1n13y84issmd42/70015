
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


class Tool {
	constructor(id) {
		let E = this.E = document.getElementById(id);
	
		E.querySelector('.preview').onclick = () => {
			focus(id);
		}

		this.ID = id;
		this._autoinput = false;
	
		let ctrls = E.querySelector(".controls");
		let eClose = document.createElement("a");
		eClose.innerHTML = "<i>&#x1F860</i><span>CLOSE</span>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {unfocus(id); e.preventDefault();e.cancelBubble=true;}
		ctrls.append(eClose);

		this.switches = this.$('input[type=radio],input[type=checkbox]');
	}

	$(s) {
		return this.E.querySelectorAll(s);
	}

	$$(id) {
		return document.getElementById(`${this.ID}-${id}`);
	}

	autoinput(ai) {
		if (ai) {
			this._autoinput = !!ai;
		} else {
			return this._autoinput;
		}
	}

	T(s, v) {
		this.tplNodes(this.$(s));				
	}

	removeChildren(e) {
		while (e.firstChild)
			e.removeChild(e.firstChild);
	}

	tplNodes(nodes, v) {
		for (let e of nodes) {
			switch (e.tagName) {
				case "INPUT":
				case "TEXTAREA":
					e.value = v;
				break;
	
				default:
					e.innerHTML = v;
				break;
			}
		}
	}

	Component(s) {
		let args = Array.prototype.slice.apply(arguments);
		let compID = args.shift();
		let compE = this.$(`.components .${compID}`)[0];
	
		if (compE) {
			compE = compE.cloneNode(true);
	
			for (let aI in args) {
				if (compE.dataset.arg == aI) {
					this.tplNodes([compE], args[aI])
				}

				let nodes = compE.querySelectorAll(`[data-arg="${aI}"]`);
				this.tplNodes(nodes, args[aI])
			}

			compE.querySelectorAll('.copy').forEach((v, k, p) => {v.onclick = onclickCopyToClipboard});
	
			return compE;
		}
	}

	Error(id, err) {
		let errEs = this.$(`.${id}`);
		for (let errE of errEs) {
			if (err) {
				errE.classList.add('shown');
				errE.firstChild.nextSibling.innerHTML = err;
			} else {
				errE.classList.remove('shown');
				errE.firstChild.nextSibling.innerHTML = '&nbsp;';
			}
		}
	}
}



class Tools {
	constructor(container) {
		this.container = container;
		this.tools = {};
	}

	add(tool) {
		this.tools[tool.ID] = tool;
	}
	
	focus(id) {
		let tool = this.tools[id];
		if (tool && tool.E) {
			tool.E.classList.replace('unfocused', 'focused');
			tool.E.focus();
			window.location.hash = id;
			let af = tool.E.querySelector("[autofocus]");
			if (af) {
				af.focus();
			}
		}

		document.body.onkeydown = (e) => {
			if (e.key == 'Escape') {
				unfocus(id);
			}
		}
	}

	unfocus(id) {
		let eTool = document.getElementById(id);
		if (eTool) {
			eTool.classList.replace('focused', 'unfocused');
		}
	}

	filter(s) {
		for (let tI in this.tools) {
			let tool = this.tools[tI];
			if (s) {
				for (let sch of s) {
					if (tool.E.dataset.tag && tool.E.dataset.tag.includes(sch)) {
						tool.E.classList.add("matched");
						tool.E.classList.remove("filteredOut");
					} else {
						tool.E.classList.add("filteredOut");
						tool.E.classList.remove("matched");
						break;
					}
				}
			} else {
				tool.E.classList.remove("filteredOut");
				tool.E.classList.remove("matched");
			}
		}
	}

	render() {
		document.body.style.display = 'block';
	}
}



