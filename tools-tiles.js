class Tools {
	tw;
	th;

	tx = 0;
	ty = 0;

	constructor(tw, th, container) {
		this.tw = tw;
		this.th = th;
		this.container = container;
	}

	add(tileID) {
		let eTile = document.getElementById(tileID);
		eTile.dataset.left = eTile.style.left = this.tx;
		eTile.dataset.top = eTile.style.top = this.ty;
		eTile.style.width = this.tw;
		eTile.style.height = this.th;
		
		this.tx += this.tw;

		if (this.tx + this.tw > this.container.clientWidth) {
			this.tx = 0;
			this.ty += this.th;
		}
	}
	
	unfocus(id) {
		let eTile = document.getElementById(id);
		if (eTile) {
			eTile.style.transition = 'all 200ms ease-in-out';
			eTile.style.left = eTile.dataset.left;
			eTile.style.top = eTile.dataset.top;
			eTile.style.width = this.tw;
			eTile.style.height = this.th;
			eTile.classList.replace('focused', 'unfocused')
		}
	}
}