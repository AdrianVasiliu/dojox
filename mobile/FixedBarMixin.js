define([
	"dojo/_base/kernel",
	"dojo/_base/config",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dijit/registry",
	"./viewRegistry"
], function(dojo, config, declare, lang, win, dom, domClass, 
		domConstruct, domGeom, registry, viewRegistry){
	// module:
	//		dojox/mobile/FixedBarMixin


/* Private temporary comments :
 * 
 * Picture in dojo <= 1.9:
 *   
 * dojox/mobile/_ScrollableMixin : 
 *   extended by ScrollablePane, ScrollableView and SwapView 
 * dojox/mobile/scrollable :
 *   extended by _ScrollableMixin, SpinWheelSlot
 *   instanciated by _ComboBoxMenu  
 * dojox/mobile/ScrollableView
 *   extended by TreeView
 *   instanciated by FilteredListMixin
 */

	var cls = declare("dojox.mobile.FixedBarMixin", null, {
		// summary:
		//		Mixin for widgets to support fixed headers and footers.
	
		// fixedHeader: String
		//		Id of the fixed header.
		fixedHeader: "", // TBD REMOVEME

		// _fixedFooter: String
		//		Id of the fixed footer.
		fixedFooter: "", // TBD REMOVEME
		
		// _fixedHeaderHeight: Number
		//		height of a fixed header
		_fixedHeaderHeight: 0,

		// _fixedFooterHeight: Number
		//		height of a fixed footer
		_fixedFooterHeight: 0,

		// _hasLocalFooter: Boolean
		//		Whether there is a header and/or a footer.
		_hasLocalFooter: false,

		_fixedParentViewFooter: "",
		
		_parentViewFooterHeight: 0,

		// scrollableParams: Object
		//		Parameters for dojox/mobile/scrollable.init().
		// scrollableParams: null,

		// allowNestedScrolls: Boolean
		//		Flag to allow scrolling in nested containers, e.g. to allow ScrollableView in a SwapView.
		// allowNestedScrolls: true,

		// appBars: Boolean
		//		Enables the search for application-specific bars (header or footer).
		// appBars: true, 

/*
		constructor: function(){
			// summary:
			//		Creates a new instance of the class.
			// tags:
			//		private
		},

		destroy: function(){
			// this.cleanup();
			this.inherited(arguments);
		},
*/

		buildRendering: function(){
			this.inherited(arguments);
			console.log("FixedBarMixin.buildRendering");
			this.domNode.style.top = "0px";
			this.containerNode = domConstruct.create("div",
				{className:"mblViewContainer"}, this.domNode);
			this.containerNode.style.position = "absolute";
			this.containerNode.style.top = "0px"; // view bar is relative
		},
		
		startup: function(){
			if(this._started){ return; }
			/*
			if(this._fixedAppFooter){
				this._fixedAppFooter = dom.byId(this._fixedAppFooter);
			}
			var node, params = this.scrollableParams;
			*/
			this.findParentViewBars();
			var node;
			var params = this.scrollableParams ? this.scrollableParams : {};
			this.reparent();
			if(this.fixedHeader){
				node = dom.byId(this.fixedHeader);
				if(node.parentNode == this.domNode){ // local footer
					this._hasLocalHeader = true;
				}
				params._fixedHeaderHeight = node.offsetHeight;
				this.containerNode.style.paddingTop = node.offsetHeight + "px";;
			}
			if(this.fixedFooter){
				node = dom.byId(this.fixedFooter);
				if(node.parentNode == this.domNode){ // local footer
					this._hasLocalFooter = true;
					node.style.bottom = "0px";
				}
				params._fixedFooterHeight = node.offsetHeight;
				this.containerNode.style.paddingBottom = node.offsetHeight + "px";;
			}
			
			// IMPROVEME
			this.domNode.style.height = "100%";
			// this.domNode.style.overflow =  "hidden";
			
			this.init(params);
			
			// subscribe to afterResizeAll to scroll the focused input field into view
			// so as not to break layout on orientation changes while keyboard is shown (#14991)
			// ADRIAN TODO
			/*
			this._resizeHandle = this.subscribe("/dojox/mobile/afterResizeAll", function(){
				if(this.domNode.style.display === 'none'){ return; }
				var elem = win.doc.activeElement;
				if(this.isFormElement(elem) && dom.isDescendant(elem, this.containerNode)){
					this.scrollIntoView(elem);
				}
			});
			*/
			
			// this.reparent();
			this.inherited(arguments);
		},

		findParentViewBars: function(){
			// summary:
			//		Search for header or footer of the parent View.
			var i, len, c;
			var parentNode = this.domNode.parentNode;
			var parentView = parentNode ? viewRegistry.getEnclosingView(parentNode) : null;
			var parentViewChildNodes = parentView ? parentView.domNode.childNodes : null;
			console.log("============ this.id: " + this.id +
				" parentNode : " + parentNode +
				" parentNode.id " + (parentNode ? parentNode.id : " n/a ") +
				" parentView.id= " + 
				(parentView ? parentView.id : " none") + 
				" parentViewChildNodes: " + (parentViewChildNodes ? parentViewChildNodes : " null"));
			if(parentViewChildNodes){
				for(i = 0, len = parentViewChildNodes.length; i < len; i++){
					c = parentViewChildNodes[i];
					this.checkFixedBar(c, false);
				}
				this._fixedFooterHeight = this.fixedFooter ? this.fixedFooter.offsetHeight : 0;
			}
		},

		checkFixedBar: function(/*DomNode*/node, /*Boolean*/local){
			// summary:
			//		Checks if the given node is a fixed bar or not.
			if(node.nodeType === 1){
				var fixed = node.getAttribute("data-mobile-fixed")
					|| (registry.byNode(node) && registry.byNode(node).fixed);
				if(fixed === "top"){
					domClass.add(node, "mblFixedHeaderBar");
					if(local){
						node.style.top = "0px";
						this.fixedHeader = node;
					}
					return fixed;
				}else if(fixed === "bottom"){
					domClass.add(node, "mblFixedBottomBar");
					if(local){
						this.fixedFooter = node;
					}else{
						this._fixedParentViewFooter = node;
					}
					return fixed;
				}
			}
			return null;
		},
		
		addFixedBar: function(/*Widget*/widget){
			// summary:
			//		Adds a view local fixed bar to this widget.
			// description:
			//		This method can be used to programmatically add a view local
			//		fixed bar to ScrollableView. The bar is appended to this
			//		widget's domNode. The addChild API cannot be used for this
			//		purpose, because it adds the given widget to containerNode.
			var c = widget.domNode;
			var fixed = this.checkFixedBar(c, true);
			if(!fixed){ return; }
			// Fixed bar has to be added to domNode, not containerNode.
			this.domNode.appendChild(c);
			if(fixed === "top"){
				this._fixedHeaderHeight = c.offsetHeight;
				this._hasLocalHeader = true;
			}else if(fixed === "bottom"){
				this._fixedFooterHeight = c.offsetHeight;
				this._hasLocalFooter = true;
				c.style.bottom = "0px";
			}
			this.resize();
		},

		reparent: function(){
			// summary:
			//		Moves all the children, except header and footer, to
			//		containerNode.
			console.log("reparent");
			var i, idx, len, c;
			for(i = 0, idx = 0, len = this.domNode.childNodes.length; i < len; i++){
				c = this.domNode.childNodes[idx];
				// search for view-specific header or footer
				if(c === this.containerNode || this.checkFixedBar(c, true)){
					idx++;
					continue;
				}
				this.containerNode.appendChild(this.domNode.removeChild(c));
			}
		},
		
		/*
		resize: function(){
			// summary:
			//		Calls resize() of each child widget.
			console.log("FixedBarMixin.resize");
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		},
*/
		resize: function(){
			// summary:
			//		Adjusts the height of the widget.
			// description:
			//		If the height property is 'inherit', the height is inherited
			//		from its offset parent. If 'auto', the content height, which
			//		could be smaller than the entire screen height, is used. If an
			//		explicit height value (ex. "300px"), it is used as the new
			//		height. If nothing is specified as the height property, from the
			//		current top position of the widget to the bottom of the screen
			//		will be the new height.
console.log("FixedBarMixin.resize on " + this.id);
			this.inherited(arguments);
			// moved from init() to support dynamically added fixed bars
			var toto = true;
			if(toto) return;
			console.log("XXXXXXXXXXXXXXXXXX on " + this.id);
			console.log(this._fixedParentViewFooter);
			this._parentViewFooterHeight = this._fixedParentViewFooter ?
				this._fixedParentViewFooter.offsetHeight : 0;
			
			console.log("set marginTop = " + this._fixedHeaderHeight + "px on " + this.id);
			if(this._hasLocalHeader){
				// this.containerNode.style.marginTop = this._fixedHeaderHeight + "px";
			}
			/* if(this._hasLocalHeader && !this.isTopLevel()){
				this.containerNode.style.marginTop = this._fixedHeaderHeight + "px";
			} */
			// Get the top position. Same as dojo.position(node, true).y
			var top = 0;
			for(var n = this.domNode; n && n.tagName != "BODY"; n = n.offsetParent){
				n = this.findDisp(n); // find the first displayed view node
				if(!n){ break; }
				top += n.offsetTop;
			}

			// adjust the height of this view
			var	h,
				screenHeight = this.getScreenSize().h,
				dh = screenHeight - top - this._parentViewFooterHeight; // default height
			if(this.height === "inherit"){
				if(this.domNode.offsetParent){
					h = this.domNode.offsetParent.offsetHeight + "px";
				}
			}else if(this.height === "auto"){
				var parent = this.domNode.offsetParent;
				if(parent){
					this.domNode.style.height = "0px";
					var	parentRect = parent.getBoundingClientRect(),
						scrollableRect = this.domNode.getBoundingClientRect(),
						contentBottom = parentRect.bottom - this._parentViewFooterHeight - this._parentPadBorderExtentsBottom;
					if(scrollableRect.bottom >= contentBottom){ // use entire screen
						dh = screenHeight - (scrollableRect.top - parentRect.top) - this._parentViewFooterHeight - this._parentPadBorderExtentsBottom;
					}else{ // stretch to fill predefined area
						dh = contentBottom - scrollableRect.bottom;
					}
				}
				// content could be smaller than entire screen height
				var contentHeight = Math.max(this.domNode.scrollHeight, this.containerNode.scrollHeight);
				h = (contentHeight ? Math.min(contentHeight, dh) : dh) + "px";
			}else if(this.height){
				h = this.height;
			}
			if(!h){
				h = dh + "px";
			}
			if(h.charAt(0) !== "-" && // to ensure that h is not negative (e.g. "-10px")
				h !== "default"){
				this.domNode.style.height = h;
				this.containerNode.style.height = h;
			}
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
		
		init: function(/*Object?*/params){
			// summary:
			//		Initialize according to the given params.
			// description:
			//		Mixes in the given params into this instance. At least domNode
			//		and containerNode have to be given.
			//		Starts listening to the touchstart events.
			//		Calls resize(), if this widget is a top level widget.
			console.log("init");
			if(params){
				for(var p in params){
					if(params.hasOwnProperty(p)){
						this[p] = ((p == "domNode" || p == "containerNode") && typeof params[p] == "string") ?
							win.doc.getElementById(params[p]) : params[p]; // mix-in params
					}
				}
			}
			if(this.isTopLevel() && !this.noResize){
				this.resize();
			}
		},

		isTopLevel: function(/*Event*/e){
			// summary:
			//		Returns true if this is a top-level widget.
			//		Overrides dojox/mobile/scrollable.isTopLevel.
			var parent = this.getParent && this.getParent();
			return (!parent || !parent.resize); // top level widget
		},
		
		resizeBis: function(){
			// summary:
			//		Adjusts the height of the widget.
			// description:
			//		If the height property is 'inherit', the height is inherited
			//		from its offset parent. If 'auto', the content height, which
			//		could be smaller than the entire screen height, is used. If an
			//		explicit height value (ex. "300px"), it is used as the new
			//		height. If nothing is specified as the height property, from the
			//		current top position of the widget to the bottom of the screen
			//		will be the new height.
console.log("resize");
			// moved from init() to support dynamically added fixed bars
			/* if(this._hasLocalHeader){
				this.containerNode.style.marginTop = this._fixedHeaderHeight + "px";
			} */

			// Get the top position. Same as dojo.position(node, true).y
			var top = 0;
			for(var n = this.domNode; n && n.tagName != "BODY"; n = n.offsetParent){
				n = this.findDisp(n); // find the first displayed view node
				if(!n){ break; }
				top += n.offsetTop + domGeom.getBorderExtents(n).h;
			}

			// adjust the height of this view
			var	h,
				screenHeight = this.getScreenSize().h,
				dh = screenHeight - top; // default height
			if(this.height === "inherit"){
				if(this.domNode.offsetParent){
					h = domGeom.getContentBox(this.domNode.offsetParent).h - domGeom.getBorderExtents(this.domNode).h + "px";
				}
			}else if(this.height === "auto"){
				var parent = this.domNode.offsetParent;
				if(parent){
					this.domNode.style.height = "0px";
					var	parentRect = parent.getBoundingClientRect(),
						scrollableRect = this.domNode.getBoundingClientRect(),
						contentBottom = parentRect.bottom - this._parentPadBorderExtentsBottom;
					if(scrollableRect.bottom >= contentBottom){ // use entire screen
						dh = screenHeight - (scrollableRect.top - parentRect.top) - this._parentPadBorderExtentsBottom;
					}else{ // stretch to fill predefined area
						dh = contentBottom - scrollableRect.bottom;
					}
				}
				// content could be smaller than entire screen height
				var contentHeight = Math.max(this.domNode.scrollHeight, this.containerNode.scrollHeight);
				h = (contentHeight ? Math.min(contentHeight, dh) : dh) + "px";
			}else if(this.height){
				h = this.height;
			}
			if(!h){
				h = dh + "px";
			}
			if(h.charAt(0) !== "-" && // to ensure that h is not negative (e.g. "-10px")
				h !== "default"){
				this.domNode.style.height = h;
			}
		},
		
		findDisp: function(/*DomNode*/node){
			// summary:
			//		Finds the currently displayed view node from my sibling nodes.
			if(!node.parentNode){ return null; }

			// the given node is the first candidate
			if(node.nodeType === 1 && domClass.contains(node, "mblSwapView") && node.style.display !== "none"){
				return node;
			}

			var nodes = node.parentNode.childNodes;
			for(var i = 0; i < nodes.length; i++){
				var n = nodes[i];
				if(n.nodeType === 1 && domClass.contains(n, "mblView") && n.style.display !== "none"){
					return n;
				}
			}
			return node;
		},
		
		getScreenSize: function(){
			// summary:
			//		Returns the dimensions of the browser window.
			return {
				h: win.global.innerHeight||win.doc.documentElement.clientHeight||win.doc.documentElement.offsetHeight,
				w: win.global.innerWidth||win.doc.documentElement.clientWidth||win.doc.documentElement.offsetWidth
			};
		}

	});
	return cls;
});
