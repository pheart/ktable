(function(window, document){
	var utilHelper = {};

	utilHelper.BindEventsHelper = (function() {
		function _concat() {

			var arr = [];

			$.each(arguments, function(index, argument){
				if ($.type(argument) == 'array') {
					arr = arr.concat(argument);
				} else if ($.type(argument) == 'object' && argument.length) {
					for (var i=0, l=argument.length; i < l; i++) {
						arr[arr.length] = argument[i];
					}
				}
			})

			return arr;
		}

		/**
		 * delegate events convinently.
		 * 
		 */
		BindEventsHelper = (function() {

			var delegateEventSplitter = /^(\S+)\s*(.*)$/;

			/**
			 * set delegate events
			 * @params {Object} the object of delegate events. 
			 * 		such as {'click #edit': 'edit'} 
			 * @params {Object}	the object of event handlers.
			 *		such as { edit: function(e){}}
			 * @params {jQuery(el)} the dom that event delegate targetss.
			 *
			 * @params {Object} context of function excute.
			 *
			 * @params optional these params to be used as arguments which event handlers.
			 *
			 */
			function delegateEvents( events, eventsObj, el, context) {
				var properties = arguments,
					extraPros = Array.prototype.slice.call(properties, 4),
					context = context || null;

				var curry = function(method) {
					return function(){
						//concat $(e) & extraPros.
						var args = _concat(arguments, extraPros);
						method.apply(context, args);
					}
				};

				for(key in events){
					var meth = events[key];
						method = eventsObj[meth];
					//...
					var match = key.match(delegateEventSplitter),
						eventName = match[1], 
						selector = match[2],
						method = curry(method);
					if(selector == ''){
						// if selector is '' , the handler bind to outer el.
						el.bind(eventName, method);
					}else{
						// if selector is exist, selector's events delegate to outer el.
						el.delegate(selector, eventName, method);
					}
				}
			}

			/**
			 * undelegate target's events.
			 * 
			 */
			
			function undelegateEvents( jqueryEl ) {
				jqueryEl.undelegate();
			}

			function setEvents() {
				delegateEvents.apply(null, arguments);
			}

			return {
				setEvents: setEvents,
				undelegate: undelegateEvents
			};

		})();

		return BindEventsHelper;
	})();

	/**
	 * subscribe / unsubscribe
	 *
	 */
	utilHelper.Observe = (function(){
		var observe = {
			on: function(name, callback, context){
				if(!this['eventList']){
					this['eventList'] = {};
				}
				this.eventList[name] = {};
				this.eventList[name].context = context || '';
				this.eventList[name].callback = callback;
			},
			trigger: function(name){
				var argument = Array.prototype.slice.call(arguments, 1);
				if(this.eventList && this.eventList[name] && $.type(this.eventList[name].callback)==='function'){
					var context = this.eventList[name].context || this;
					this.eventList[name].callback.apply(context, argument);
				}
			},
			remove: function(name){
				if (!this.eventList) return false;
				delete this.eventList[name];
			},
			has: function(name){
				if (!this.eventList) return false;
				return this.eventList[name] ? true : false;
			},
			make: function(o){
				for(var i in this){
					if(i!='make'){
						o[i] = this[i];
					}
				}
			}
		};
		return observe;
	})();

	window.utilHelper = utilHelper;

})(window, document)