# pickfiles
HTML javascript for picking and default loading of files.
Focus is on versatile capabilities rather than a bare minimum file picker.

Single or multiple file picks are supported.

FilePicker can be instantiated with an existing HTML element, an options object,
or no parameters.

```javascript
import FilePicker from 'pickfiles';

let fp = new FilePicker( element, (picked)=>{

});

```

Setting the `FilePicker.readAs` property enables automatic loading for any picked files.
The possible `readAs` options are exported:
```javascript
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
```

The following events can be subscribed:
```javascript

let fp = new FilePicker();

fp.on( 'pick', (picked)=>{});
fp.on( 'abort', (picker)=>{});
// called once for each file loaded.
fp.on( 'load', (data)=>{});
// called after all files have loaded.
fp.on('loadend', (datas)=>{});

```