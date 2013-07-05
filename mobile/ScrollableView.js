define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/sniff",
	"dijit/registry",	// registry.byNode
	"./View",
	"./_ScrollableMixin"
], function(array, declare, domClass, domConstruct, domStyle, has, registry, View, ScrollableMixin){

	// module:
	//		dojox/mobile/ScrollableView

	return declare("dojox.mobile.ScrollableView", [View, ScrollableMixin], {
		// summary:
		//		A container that has a touch scrolling capability.
		// description:
		//		ScrollableView is a subclass of View (dojox/mobile/View).
		//		Unlike the base View class, ScrollableView's domNode always stays
		//		at the top of the screen and its height is "100%" of the screen.
		//		Inside this fixed domNode, the containerNode scrolls. The browser's
		//		default scrolling behavior is disabled, and the scrolling mechanism is
		//		reimplemented in JavaScript. Thus the user does not need to use the
		//		two-finger operation to scroll the inner DIV (containerNode).
		//		The main purpose of this widget is to realize fixed-positioned header
		//		and/or footer bars.

		// scrollableParams: Object
		//		Parameters for dojox/mobile/scrollable.init().
		scrollableParams: null,

		// keepScrollPos: Boolean
		//		Overrides dojox/mobile/View/keepScrollPos.
		keepScrollPos: false,

		constructor: function(){
			// summary:
			//		Creates a new instance of the class.
			this.scrollableParams = {noResize: true};			
		},

		buildRendering: function(){
			this.inherited(arguments);
			console.log("ScrollableView.buildRendering");
			domClass.add(this.domNode, "mblScrollableView");
			this.domNode.style.overflow = "hidden";
			if(this.scrollDir === "v"){
				this.containerNode.style.width = "100%";
			}
			if(this.scrollType === "overflowScroll"){
				if(has("webkit")){ // request hardware acceleration
					domStyle.set(this.containerNode, "webkitTransform", "translate3d(0,0,0)");
				}
				if(this.scrollDir.indexOf("v") != -1){
					domStyle.set(this.containerNode, "overflowY", "scroll"); // or "auto"...
				}
				if(this.scrollDir.indexOf("h") != -1){
					domStyle.set(this.containerNode, "overflowX", "scroll"); // or "auto"...
				}
				domStyle.set(this.containerNode, 
					{"webkitTransform": "translate3d(0,0,0)",
					"webkitOverflowScrolling": "touch", // currently only for iOS; used to have bad effect on iOS5; fixed in iOS6.
					"webkitTransformStyle": "preserve-3d"});
			}
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);
		},

		resize: function(){
			// summary:
			//		Calls resize() of each child widget.
			
			console.log("ScrollableView.resize on " + this.id);
			this.inherited(arguments); // scrollable#resize() will be called
			/* Now in the parent FixedBarMixin
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
			*/
			this._dim = this.getDim(); // update dimension cache
			if(this._conn){
				// if a resize happens during a scroll, update the scrollbar
				this.resetScrollBar();
			}
		},

		onAfterTransitionIn: function(moveTo, dir, transition, context, method){
			// summary:
			//		Overrides View.onAfterTransitionIn to flash the scroll bar
			//		after performing a view transition.
			this.flashScrollBar();
		},

		getChildren: function(){
			// summary:
			//		Overrides _WidgetBase.getChildren to add local fixed bars,
			//		which are not under containerNode, to the children array.
			var children = this.inherited(arguments);
			var fixedWidget;
			if(this.fixedHeader && this.fixedHeader.parentNode === this.domNode){
				fixedWidget = registry.byNode(this.fixedHeader);
				if(fixedWidget){
					children.push(fixedWidget);
				}
			}
			if(this.fixedFooter && this.fixedFooter.parentNode === this.domNode){
				fixedWidget = registry.byNode(this.fixedFooter);
				if(fixedWidget){
					children.push(fixedWidget);
				}
			}
			return children;
		},

		_addTransitionPaddingTop: function(/*String|Integer*/ value){
			// add padding top to the view in order to get alignment during the transition
			this.domNode.style.paddingTop = value + "px";
			this.containerNode.style.paddingTop = value + "px";
		},

		_removeTransitionPaddingTop: function(){
			// remove padding top from the view after the transition
			this.domNode.style.paddingTop = "";
			this.containerNode.style.paddingTop = "";
		}

	});
});
