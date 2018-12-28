import EventEmitter from 'eventemitter3';

/**
 * Constants for auto-reading file data.
 */
const ReadAs = {

	ARRAY:'array',
	/**
	 * Exists only for backward-compatibility.
	 */
	BINARY:'binstring',
	DATA_URL:'dataurl',
	TEXT:'text'

};

export { ReadAs };

/**
 * @fires FilePicker#pick
 * @fires FilePicker#abort
 * @fires FilePicker#load
 * @fires FilePicker#complete
 */
export default class FilePicker extends EventEmitter {

	/**
	 * {HTMLElement}
	 */
	get element() { return this._element; }
	set element(v) {

		if ( this._element ) this.__removeEvents();
		this._element=v;
		this.initElement();

	}

	/**
	 * {string} - one of the constants from the 'ReadAs' object.
	 * 'array', 'binstring', 'dataurl' or 'text'
	 * If set, the picker will attempt to read the loaded data in the correct format.
	 */
	get readAs() { return this._readAs; }
	set readAs(v) {

		this._readAs = v;


	}

	/**
	 * {Boolean} whether to allow selecting multiple files.
	 */
	get multiple() { return this._multiple; }
	set multiple(v) {

		this._multiple=v;
		if ( this._element && this._element.type === 'file') this._element.multiple = v;

	}

	/**
	 * {Boolean} - Whether to allow file dragging and dropping.
	 */
	get allowDrop() { return this._allowDrop; }
	set allowDrop(v) {

		if ( v != this._allowDrop ) {

			this._allowDrop = v;

			// change events.
			if ( this._element ) {

				if ( v === true ) {
					this._element.addEventListener( 'dragover', this.dragLambda );
					this._element.addEventListener('drop', this.dropLambda );
				} else {
					this._element.removeEventListener( 'dragover', this.dragLambda );
					this._element.removeEventListener('drop', this.dropLambda );
				}

			}

		}

	}

	/**
	 * {Number} Number of images currently loading.
	*/
	get loading() { return this._loading; }

	/**
	 * {Number} Number of images with loading completed.
	 */
	get loaded() { return this._loaded;}

	/**
	 * 
	 * @param {HTMLElement|Object} opts - Picker options or Element which selects a file.
	 * @param {HTMLElement} opts.element - HTMLElement for selecting the file.
	 * @param {Boolean} [opts.allowDrop=true] - Allow drag and dropping files.
	 * @param {Boolean} [multiple=false] - Allow multiple file selections.
	 * @param {string} [readAs] - Method for loading the picked file[s], if any.
	 * @param {function} [onpick=null] - Function to call on file selection.
	 */
	constructor( opts=null, onpick=null ) {

		super();

		this._allowDrop = true;

		var elm;

		if ( opts instanceof HTMLElement ) {

			elm = opts;

		} else if ( opts ) {

			Object.assign( this, opts );
			onpick = onpick || opts.onpick;
			elm = opts.element;

		}

		this._loading = this._loaded = 0;
		this._readers = [];

		if ( elm ) this._element = elm;
		else {

			this._element = document.createElement('input' );
			this._element.type = 'file';

		}

		if ( onpick ) this.on( 'pick', onpick );

		this.selectLambda = e=>this.dispatch(e.target.files);
		this.dragLambda = e=>this.dragOver(e);
		this.dropLambda = e=>this.drop(e);

		this.initElement();

	}

	__removeEvents() {

		if (!this._element ) return;

		if ( this._allowDrop === true ) {
			this._element.removeEventListener( 'dragover', this.dragLambda );
			this._element.removeEventListener('drop', this.dropLambda );
		}

		if ( this._element.type === ' file' ) this._element.removeEventListener('change', this.selectLambda, false );

	}

	initElement() {

		if ( !this._element ) return;

		if ( this._element.type === 'file') {
			this._element.addEventListener('change', this.selectLambda, false );
		}

		if ( this._allowDrop === true ) {
			this._element.addEventListener( 'dragover', this.dragLambda );
			this._element.addEventListener('drop', this.dropLambda );
		}
	
	}
	
	dispatch( files ) {

		if ( !files || files.length === 0 ) return;

		/**
		 * @event FilePicker#pick
		 * @type {FileList|File} the file[s] picked.
		 */
		if ( this._multiple === true ) this.emit( 'pick', files );
		else this.emit('pick', files[0]);

		if ( this._readAs ) this._readAll( files );

	}

	_readAll( files ) {

		this._loading = this._loaded = 0;

		if ( files instanceof FileList ) {

			this._loading = files.length;
			for( let i = files.length-1; i>=0; i-- ) this._read( files[i] );

		} else {

			this._loading = 1;
			this._read( files );

		}

	}

	
	/**
	 * Abort all data loading.
	 */
	abort() {

		if ( this._loading === 0 || this._readers.length === 0 ) return;

		for( let i = this._readers.length-1; i >= 0; i-- ) {
			this._readers[i].abort();
		}

		/**
		 * @event FilePicker#abort
		 * @type {FilePicker}
 		*/
		this.emit('abort', this );

	}

	_read( file ) {

		var reader = new FileReader();
		reader.onload = ()=> {

			this._loaded++;
			/**
			 * Single file loaded.
			 * @event FilePicker#load
			 * @type {*} Data loaded.
			 */
			this.emit( 'load', reader.result );

			if ( ++this._loaded === this._loading ) {

				/**
				 * All files loaded.
				 * @event FilePicker#complete
				 * @type {Array} Array of files loaded.
				 */
				if ( this._readers.length === 1 ) this.emit('complete', this._readers[0].result )
				else this.emit( 'complete', this._readers.map( r=>r.result) );

			}

		}
		reader.onerror=e=>this._error(e);

		this._readers.push( reader );

		switch ( this._readAs ) {

			case ReadAs.ARRAY:
				reader.readAsArrayBuffer( file );
				break;
			case ReadAs.BINARY:
				reader.readAsBinaryString( file );
				break;
			case ReadAs.DATA_URL:
				reader.readAsDataURL( file );
				break;
			case ReadAs.TEXT:
				reader.readAsText( file );
				break;
			default: return;

		}
		

	}

	_error( evt ) {
		this.emit( 'error', evt );
	}

	drop(evt) {

		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files;
		this.dispatch( files );

	}

	dragOver(evt) {

		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy';

	}

}