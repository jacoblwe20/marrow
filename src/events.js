(function(Marrow){

	Marrow.prototype = Marrow.prototype || {}; 

	var 
	// some local utilities
	delimiter = /\:/g,
	// simple function that splits apart event string into array
	// input a string get out an array
	parseEventString = function(str){
		if(typeof str === "string"){
			return str.split(delimiter);
		}
		return null;
	};

	// Marrow::__events creates the _events object ~ can probably
	// be phased out

	Marrow.prototype.__events = function(){
		this._events = {};
	};

	// Marrow::on is a way to bind to a event emitted by the object
	// The first parameter is a String that defined what event type
	// that you want to attach to. The second parameter is a function
	// that will be queued and executed once the evnt fires

	Marrow.prototype.on = function( event, callback ){

		// subscribing to another objects events
		if( typeof event === 'object' ){
			this._objBind( event, callback, arguments[2]);
			return null;		
		}

		if( typeof event === 'function' ){
			this._contructorBind( event, callback, arguments[2] );
			return null;		
		}

		if(
			typeof callback === "function" &&
			typeof event === "string"
		){

			var 
			events = parseEventString(event),
			// only support two layer events
			e = ( events.length > 1 ) ? events[ 0 ] + ":" + events[ 1 ]  : events[ 0 ];


			if( !this._events ){
				this.__events(); // create events object
			}

			if( typeof this._events[ e ] !== "object" ){
				this._events[ e ] = [];
			}

			if( typeof this._events[ e ].length === "number" ){
				this._events[ e ].push( callback );
			}
			
		}

		return this;
	};

	// Marrow::once is a way to bind to an event once. see on for more
	// details on event binding

	Marrow.prototype.once = function ( event, callback ) {
		var 
		_this = this,
		handle = function ( ) {
			callback.apply( _this, arguments );
			_this.off( event, handle );
			_this.off( event, callback );
		};
		this.on( event, handle );
	};

	// Marrow::off is a way to remove a binding to an event that would
	// be attached with the on method. The first parameter is a String
	// with the name of the event you want to unbind from this is optional,
	// when omited all events will be unbound from object. The second parameter
	// is a funcion that is a referance to a function that was bound to an event
	// this will only remove that one binding. The second argument is also
	// optional and when omitted will then unbind and bindings to the specified
	// event in the first parameter

	Marrow.prototype.off = function( event, fn ){

		if( typeof event === 'object' ){
			event = this._objUnbind( event, fn, arguments[2] );
			return null;
		}


		if(
			typeof this._events === "object" &&
			typeof event === "string" &&
			typeof this._events[ event ] === "object" && 
			this._events[ event ].length
		){

			var events = this._events[ event ];


			if( typeof fn === "function" ){

				for( var i = 0; i < events.length; i += 1 ){

					if( '' + events[i] === '' + fn ){ 
						this._events[ event ][ i ] = null; // remove specific fn
					}

				}

			}else{
				this._events[ event ] = []; // remove all events in group
			}

		} else {
			if( 
				typeof event === 'undefined' &&
				typeof fn === 'undefined' 
			) {
				this._events = {}; // remove all
			}
		}

	};

	// Marrow::emit is a way to fire off events to all the binding functions
	// The first parameter in emit is the event type as a String this is 
	// a referance used to bind the events to functions. Emit will also take
	// any other parameters passed into the emits method and will pass them to
	// the and event binds... only omiting the first parameter, the event type.
	// eg. obj.on("payload", function(payload){ /*Do stuff with payload*/});
	// obj.emit("payload", payload);

	Marrow.prototype.emit = function( event ){

		if(
			typeof this._events === "object" &&
			typeof event === "string"
		){

			var 
			events = parseEventString(event),
			e,
			arg = [].slice.call( arguments ); // copying argument so we can pass
			// though a chunk of them

			if( !this._events ){
				this.__events(); // create events object
			}

			for( var i = 0; i < events.length; i += 1 ){

				e = ( i ) ? events[ 0 ] + ":" + events[ i ] : events[ i ];	

				if(
					typeof this._events[ e ] === "object" && 
					this._events[ e ].length
				){

					for( var q = 0; q < this._events[ e ].length; q += 1 ){
						var payload = ( !( i ) && events.length > 1 ) ?
							arg : 
							arg.slice( 1 ); 

						if( this._events[ e ][ q ] ){
							this._events[ e ][ q ].apply( this, payload );
						} 
					}

				}

			}

			// if an all event binding is made emit event to it
	
		}

	};

	// Marrow._objBind binds to another object on event

	Marrow.prototype._objBind = function ( obj, event, fn ) {
		if ( 
			!obj && 
			typeof obj.on !== 'function' &&
			typeof event !== 'string' &&
			typeof fn !== 'function'
		) {
			// bad
			return null;
		} 
		obj.on( event, fn );
		
	};

	// Marrow._objBind removes binding

	Marrow.prototype._objUnbind = function ( obj, event, fn ) {
		if ( 
			!obj && 
			typeof obj.off !== 'function' &&
			typeof event !== 'string'
		) {
			// bad
			return null;
		} 
		obj.off( event, fn );
	};

	// Marrow._instanceBind binds events to an instance using task

	Marrow.prototype._contructorBind = function ( instance, event, fn ) {
		if (
			typeof instance !== 'function' ||
			typeof event !== 'string' ||
			typeof fn !== 'function' ||
			!( 'registerTask' in this )
		){
			// bad
			return null;
		}

		var constructor = instance._name;

		this.registerTask( '_contructorBind', 
			function ( _this ) {
				if ( _this && typeof _this.on === 'function' ) {
					_this.on( event, fn );
				}
			}, {
				instance : constructor,
				// this is when we want to bind to the instance
				event : 'initialize'
			}
		);

		//need a method to look up already created
		//instances especially for un binding events
	};

}( 'function' === typeof Marrow ? Marrow : this ));