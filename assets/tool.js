class Tool {
	constructor(id) {
		let E = this.E = document.getElementById(id);
	
		E.querySelector('.preview').onclick = () => {
			focus(id);
		}

		this.ID = id;
	
		let ctrls = E.querySelector(".controls");
		let eClose = document.createElement("a");
		eClose.innerHTML = "<span>CLOSE</span><i>&#x1f7a8</i>";
		eClose.classList.add("close");
		eClose.onclick = (e) => {unfocus(id); e.preventDefault();e.cancelBubble=true;}
		ctrls.append(eClose);
	}

	$(s) {
		return this.E.querySelectorAll(s);
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

	Component = function(s) {
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

	Error = function(id, err) {
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
