/**
 * oAlert
 * version: 0.0.1 beta
 * author: nino zhang
 * email: ninozhang@foxmail.com
 * last update: 2011/8/5
 * https://github.com/ninozhang/oAlert
 */
 
(function ($) {
var win = window,
	doc = window.document,
	
	version = '0.0.1 beta',
	homepage = 'https://github.com/ninozhang/oAlert',
	
	collection = {};

String.prototype.replaceAll = function(s1, s2) {
	return this.replace(new RegExp(s1, 'gm'), s2);
};

var oAlertModel = Backbone.Model.extend({
	merge: function(options) {
		if(!options) {
			return;
		}
		var clone = this.clone().toJSON(),
			attrs = {};
		for(var name in clone) {
			var type = typeof options[name];
			if((type == 'undefined')) {
				continue;
			} else if(!clone[name]) {
				attrs[name] = options[name];
			} else if(type == 'string' || type == 'number' || type == 'boolean') {	
				attrs[name] = options[name];
			} else {
				var count = 0;
				for(var key in options[name]) {
					count++;
				}
				if(count == 0) {
					attrs[name] = options[name];
				} else {
					attrs[name] = $.extend(true, {}, clone[name], options[name]);
				}
			}
		}
		this.set(attrs);
	},
	randKey: function(prefix) {
		var date = new Date(),
			times = Math.round(Math.random() * 10 + 3),
			key = date.getTime();
		while(times > 0) {
			var rand = String(Math.random()).substring(2),
				length = rand.length,
				start = Math.round(Math.random() * 3),
				end = Math.round(Math.random() * (length - 3) + 5);
			key += '-' + rand.substring(start, end);
			times--;
		}
		if(prefix) {
			key = prefix + '-' + key
		}
		return key;
	}
});

var oAlertView = Backbone.View.extend({
	effect: function(el, name, duration, options, callback) {
		var jel = $(el);
		switch(name.toLowerCase()) {
			case 'fadein':
				jel.fadeIn(duration, options, callback);
				break;
			case 'fadeout':
				jel.fadeOut(duration, options, callback);
				break;
			case 'slideup':
				jel.slideUp(duration, options, callback);
				break;
			case 'slidedown':
				jel.slideDown(duration, options, callback);
				break;
			default:
				jel.effect(name, options, duration, callback);
		}
	}
});

var OverlayModel = oAlertModel.extend({
	defaults: {
		host: null,
		click: true,
		parent: null,
		style: {
			position: 'fixed',
			color: '#000',
			opacity: .3,
			top: 0,
			left: 0,
			width: 0,
			height: 0,
			zIndex: 9999
		},
		show: {
			effect: 'fadeIn',
			duration: 300,
			easing: 'swing',
			callback: null
		},
		hide: {
			destroy: true,
			effect: 'fadeOut',
			duration: 200,
			easing: 'swing',
			callback: null
		}
	}
});

var Overlay = oAlertView.extend({
	tagName: 'div',
	className: 'oalert-overlay',
	events: {
		'click': 'onClick',
		'hide': 'hide'
	},
	initialize: function() {
		this.model = new OverlayModel();
		this.model.merge(this.options);
		this.render();
	},
	render: function() {
		var parent = this.model.get('parent'),
			el = this.el,
			jel = $(el),
			style = this.model.get('style'),
			css = {
				position: style.position,
				background: style.color,
				height: style.height + 'px',
				width: style.width + 'px', 
				opacity: style.opacity,
				zIndex: style.zIndex
			};
		jel.css(css).hide();
		parent.append(el);
		this.reposition();
	},
	reposition: function() {
		var el = this.el,
			jel = $(el),
			parent = this.model.get('parent'),	
			style = this.model.get('style'),
			css = {
				top: style.top,
				left: style.left
			};
		css.top += 'px';
		css.left += 'px';
		jel.css(css);
	},
	show: function() {
		var jel = $(this.el),
			show = this.model.get('show'),
			effect = show.effect,
			duration = show.duration,
			easing = show.easing,
			callback = show.callback;
		if(effect) {
			this.effect(jel, effect, duration, easing, callback);
		} else {
			jel.show();
		}
	},
	hide: function() {
		var jel = $(this.el),
			hide = this.model.get('hide'),
			destroy = hide.destroy,
			effect = hide.effect,
			duration = hide.duration,
			easing = hide.easing,
			callback = hide.callback,
			_ = this;
		if(effect) {
			this.effect(jel, effect, duration, easing, function() {
				if(destroy) {
					_.destroy();
				}
				if(callback) {
					callback.call(_, _);
				}
			});
		} else {
			jel.hide();
			if(destroy) {
				this.destroy();
			}
		}
	},
	destroy: function() {
		var jel = $(this.el);
		jel.remove();
	},
	onClick: function(event) {
		var host = this.model.get('host'),
			click = this.model.get('click');
		if(click == true) {
			if(host) {
				host.hide();
			}
		}
	}
});

var Model = oAlertModel.extend({
	defaults: {
		id: null,
		key: null,
		host: null,
		visible: false,
		overwrite: true,
		parent: {
			jel: null,
			key: null,
			width: NaN,
			height: NaN,
			windowWidth: NaN,
			windowHeight: NaN,
			scrollTop: NaN,
			scrollLeft: NaN
		},
		style: {
			className: null,
			position: 'fixed',
			opacity: 1,
			boxShadow: null,
			textShadow: null,
			radius: NaN,
			width: NaN,
			height: NaN,
			minWidth: NaN,
			minHeight: NaN,
			maxWidth: NaN,
			maxHeight: NaN,
			zIndex: 99999
		},
		content: {
			title: null,
			text: null,
			buttons: null,
			inputs: null,
			ajax: {
				url: null,
				type: 'GET',
				data: {},
				dataType: 'json',
				delay: 0,
				loaded: false,
				loading: true, // 内容装载完毕才显示
				once: false // 只拉取一次内容
			}
		},
		position: {
			top: .382,
			left: NaN,
			offsetX: NaN,
			offsetY: NaN
		},
		show: {
			modal: true,
			solo: false,
			delay: 0,
			effect: 'fadeIn',
			duration: 300
		},
		hide: {
			auto: true,
			delay: 5000,
			escape: true,
			destroy: true,
			effect: 'fadeOut',
			duration: 200
		},
		callbacks: {
			move: null,
			focus: null,
			blur: null,
			beforeRender: null,
			render: null,
			beforeReposition: null,
			reposition: null,
			beforeShow: null,
			show: null,
			beforeHide: null,
			hide: null,
			buttonClick: null
		},
		overlay: {
			style: {},
			show: {},
			hide: {}
		}
	},
	change: function() {
		var key = this.get('key'),
			host = this.get('host'),
			parent = this.get('parent'),
			content = this.get('content'),
			overlay = this.get('overlay'),
			style = this.get('style'),
			show = this.get('show'),
			hide = this.get('hide'),
			ref = this.get('ref'),
			jels = this.get('jels'),
			timer = this.get('timer'),
			msie = $.browser.msie,
			msie6 = $.browser.msie && ($.browser.version == '6.0');
			
		if(!ref) {
			ref = {};
		}
		if(!jels) {
			jels = {};
		}
		if(!timer) {
			timer = {};
		}
			
		if(!key) {
			key = this.randKey('oalert');
		}
		
		if(!parent || !jels.parent) {
			if(typeof parent == 'string') {
				jels.parent = $(parent);
				parent = {
					width: jels.parent.width(),
					height: jels.parent.height(),
					windowWidth: jels.parent.width(),
					windowHeight: jels.parent.height(),
					scrollTop: jels.parent[0].scrollTop,
					scrollLeft: jels.parent[0].scrollLeft
				}
				style.position = 'absolute';
			} else {
				jels.parent = $(doc.body);
				parent = {
					width: $(doc).width(),
					height: $(doc).height(),
					windowWidth: msie ? doc.documentElement.clientWidth : win.innerWidth,
					windowHeight: msie ? doc.documentElement.clientHeight : win.innerHeight,
					scrollTop: msie6 ? doc.documentElement.scrollTop : doc.body.scrollTop,
					scrollLeft: msie6 ? doc.documentElement.scrollLeft : doc.body.scrollLeft
				};
				if(msie6) {
					style.position = 'absolute';
				} else {
					style.position = 'fixed';
				}
			}
		}
		if(jels.parent && !parent.key) {
			parent.key = jels.parent.attr('oalert');
			if(!parent.key) {
				parent.key = this.randKey('oalert-parent');
				jels.parent.attr('oalert', parent.key);
			}
		}
		
		overlay.host = host,
		overlay.parent = jels.parent;
		overlay.style.position = style.position;
		overlay.style.width = parent.width;
		overlay.style.height = parent.height;
		overlay.style.zIndex = style.zIndex - 1;
		overlay.hide.destroy = hide.destroy;
		if(isNaN(overlay.show.duration)) {
			overlay.show.duration = show.duration;
		}
		if(isNaN(overlay.hide.duration)) {
			overlay.hide.duration = hide.duration;
		}
		
		this.set({key: key, parent: parent, content: content, style: style, overlay: overlay, ref: ref, jels: jels, timer: timer}, {silent: true});
	}
});

var View = oAlertView.extend({
	tagName: 'div',
	className: 'oalert',
	events: {
		'click .oalert-button': 'onButtonClick'
	},
	initialize: function() {
		this.model = new Model();
		this.options.host = this;
		this.model.merge(this.options);
		this.render();
	},
	render: function() {
		var callbacks = this.model.get('callbacks'),
			content = this.model.get('content'),
				jels = this.model.get('jels'),
			jel = $(this.el);
		if(callbacks.beforeRender) {
			callbacks.beforeRender.call(this);
		}
		this.renderOverlay();
		jel.hide().appendTo(jels.parent);
		this.renderInner();
		this.applyStyle();
		this.register();
		if(!content || !content.ajax || content.ajax.loading) {
			this.show();
		}
		if(callbacks.render) {
			callbacks.render.call(this);
		}
	},
	renderOverlay: function() {
		var show = this.model.get('show'),
			overlay = this.model.get('overlay'),
			ref = this.model.get('ref');
		if(show.modal && !ref.overlay) {
			ref.overlay = new Overlay(overlay);
			this.model.set({ref: ref}, {silent: true});
			this.setJel('overlay', $(ref.overlay.el));
		}
	},
	renderInner: function() {
		var jel = $(this.el),
			inner = $('<div>').addClass('oalert-inner').appendTo(jel);
		this.setJel('inner', inner);
		this.renderContent();
	},
	renderContent: function() {
		var content = this.model.get('content'),
			title = content.title,
			text = content.text,
			buttons = content.buttons,
			inputs = content.inputs,
			ajax = content.ajax,
			inner = this.getJel('inner').empty(),
			_ = this;
		if(title) {
			$('<div>').addClass('oalert-title')
					  .html(title)
					  .appendTo(inner);
		}
		if(text == null && (!ajax || !ajax.url)) {
			text = '请稍候...';
		}
		if(text) {
			text = text.replaceAll('\n', '<br/>');
			$('<div>').addClass('oalert-content')
					  .html(text)
					  .appendTo(inner);
		}
		if(inputs) {
			var inputCount = inputs.length,
				inputBox = $('<div>').addClass('oalert-inputs');
			for(var i = 0; i < inputCount; i++) {
				var ii = inputs[i],
					create = ii.create === false ? false : true,
					type = ii.type ? ii.type : 'text',
					labelText = ii.label,
					field = ii.field,
					maxLength = ii.maxLength ? ii.maxLength : NaN,
					readOnly = ii.readOnly ? true : false,
					disabled = ii.disabled === true ? true : false,
					defaultValue = ii.defaultValue ? ii.defaultValue : null,
					attr = {},
					input = null,
					label = null,
					labelWidth = 0;
				if(create) {
					if(labelText) {
						label = $('<span>').addClass('oalert-input-label')
										   .html(labelText)
										   .appendTo(inputBox);
						labelWidth = label.outerWidth();
					}
					input = $('<input>').addClass('oalert-input');
					attr.type = type;
					if(field) {
						attr.field = field;
					}
					if(!isNaN(maxLength)) {
						attr.maxLength = maxLength;
					}
					if(readOnly) {
						attr.readOnly = '';
					}
					if(disabled) {
						attr.disabled = '';
					}
					input.attr(attr).appendTo(inputBox);
					if(defaultValue) {
						input.val(defaultValue);
					}
				}
			}
			if(inputBox.children().size() > 0) {
				inputBox.appendTo(inner);
			}
		}
		if(buttons) {
			var buttonCount = buttons.length,
				buttonBox = $('<div>').addClass('oalert-buttons').appendTo(inner);
			for(var i = 0; i < buttonCount; i++) {
				var bi = buttons[i],
					label = bi.label,
					flat = bi.flat,
					code = bi.code,
					hide = (bi.hide == false) ? false : true,
					b = $('<div>').addClass('oalert-button').appendTo(buttonBox);
				b.attr('hidefocus', true);
				if(code) {
					b.attr('value', code);
				}
				if(!hide) {
					b.attr('hide', false);
				}
				if(flat == true) {
					b.addClass('oalert-button-flat');
				}
				if(label) {
					b.html(label);
				}
			}
		}
		if(ajax && ajax.url && !ajax.loaded) {
			var url = ajax.url,
				type = ajax.type ? ajax.type : 'GET',
				data = ajax.data,
				dataType = ajax.dataType ? ajax.dataType : 'text',
				delay = ajax.delay,
				success = ajax.success,
				error = ajax.error,
				timer = this.model.get('timer'),
				loadingBox = $('<div>').addClass('oalert-loading-container').appendTo(inner),
				loading = $('<div>').addClass('oalert-loading').appendTo(loadingBox);
			timer.ajax = setTimeout(function() {
				var callback = function() {
					var content = this.model.get('content');
					content.ajax.loaded = true;
					this.model.set({content: content}, {silent: true});
					if(!content.ajax.loading) {
						this.show();
					}
				}
				$.ajax({
					url: url,
					type: type,
					data: data,
					dataType: dataType,
					success: function(data, textStatus) {
						callback.call(_);
						if(success) {
							success.call(_, data, textStatus);
						}
					},
					error: function(jqXHR, textStatus, errorThrown) {
						callback.call(_);
						if(error) {
							error.call(_, textStatus, errorThrown);
						}
					}
				});
			}, delay);
		}
		this.reposition();
	},
	applyStyle: function() {
		var style = this.model.get('style'),
			className = style.className,
			boxShadow = style.boxShadow,
			textShadow = style.textShadow,
			position = style.position,
			width = style.width,
			height = style.height,
			minWidth = style.minWidth,
			minHeight = style.minHeight,
			maxWidth = style.maxWidth,
			maxHeight = style.maxHeight,
			radius = style.radius,
			opacity = style.opacity,
			zIndex = style.zIndex,
			jel = $(this.el),
			css = {},
			jels = this.model.get('jels'),
			inner = jels.inner,
			innerCSS = {};
		if(className) {
			jel.addClass('oalert-' + className);
		}
		if(boxShadow) {
			css['box-shadow'] = boxShadow;
			css['-webkit-box-shadow'] = boxShadow;
			css['-moz-box-shadow'] = boxShadow;
		}
		if(textShadow) {
			css['text-shadow'] = textShadow;
		}
		if(!isNaN(radius)) {
			css['border-radius'] = radius + 'px';
			css['-moz-border-radius'] = radius + 'px';
			css['-webkit-border-radius'] = radius + 'px';
		}
		css.position = position;
		css.opacity = opacity;
		css.zIndex = zIndex;
		jel.css(css);
		if(!isNaN(width)) {
			innerCSS.width = width + 'px';
		}
		if(!isNaN(height)) {
			innerCSS.height = height + 'px';
		}
		if(!isNaN(minWidth)) {
			innerCSS.minWidth = minWidth + 'px';
		}
		if(!isNaN(minHeight)) {
			innerCSS.minHeight = minHeight + 'px';
		}
		if(!isNaN(maxWidth)) {
			innerCSS.maxWidth = maxWidth + 'px';
		}
		if(!isNaN(maxHeight)) {
			innerCSS.maxHeight = maxHeight + 'px';
		}
		inner.css(innerCSS);
		this.reposition();
	},
	reposition: function() {
		var jel = $(this.el),
			jels = this.model.get('jels'),
			callbacks = this.model.get('callbacks'),
			parent = this.model.get('parent'),
			parentPosition = jels.parent.css('position'),
			position = this.model.get('position'),
			top = position.top,
			left = position.left,
			offsetX = position.offsetX,
			offsetY = position.offsetY,
			overlay = this.model.get('ref').overlay,
			style = this.model.get('style'),
			css = {};
		if(callbacks.beforeReposition) {
			callbacks.beforeReposition.call(this);
		}
		if(top == 'content') {
			var outerWidth = Number(jel.css('border-top-width').replace('px', ''));
			var innerWidth = Number(jels.inner.css('border-top-width').replace('px', ''));
			css.top = - outerWidth - innerWidth;
		} else if(top >= 0 && top <= 1) {
			css.top = (parent.windowHeight - jel.height()) * top;
		} else if(!isNaN(top)) {
			css.top = top;
		} else {
			css.top = (parent.windowHeight - jel.height()) / 2;
		}
		if(!isNaN(offsetY)) {
			css.top += offsetY;
		}
		if(left == 'content') {
			var outerWidth = Number(jel.css('border-left-width').replace('px', ''));
			var innerWidth = Number(jels.inner.css('border-left-width').replace('px', ''));
			css.left = - outerWidth - innerWidth;
		} else if(left >= 0 && left <= 1) {
			css.left = (parent.windowWidth - jel.width()) * left;
		} else if(!isNaN(left)) {
			css.left = left;
		} else {
			css.left = (parent.windowWidth - jel.width()) / 2;
		}
		if(!isNaN(offsetX)) {
			css.left += offsetX;
		}
		if(parentPosition != 'relative') {
			var parentMarginTop = Number(jels.parent.css('margin-top').replace('px', '')),
				parentMarginLeft = Number(jels.parent.css('margin-left').replace('px', '')),
				parentTop = jels.parent.position().top + parentMarginTop,
				parentLeft = jels.parent.position().left + parentMarginLeft,
				overlayStyle = {
					top: parentTop,
					left: parentLeft
				};
			css.top += parentTop;
			css.left += parentLeft;
			if(overlay) {
				overlay.model.merge({style: overlayStyle});
				overlay.reposition();
			}
		}
		if(style.position != 'fixed') {
			css.top += parent.scrollTop;
			css.left += parent.scrollLeft;
		}
		css.top += 'px';
		css.left += 'px';
		jel.css(css);
		if(callbacks.reposition) {
			callbacks.reposition.call(this);
		}
	},
	register: function() {
		var parent = this.model.get('parent'),
			group = collection[parent.hash];
	},
	show: function(settings) {
		var jel = $(this.el),
			callbacks = this.model.get('callbacks'),
			overlay = this.model.get('ref').overlay,
			show = this.model.get('show'),
			delay = show.delay,
			effect = show.effect,
			duration = show.duration,
			easing = show.easing,
			hide = this.model.get('hide'),
			escape = hide.escape,
			timer = this.model.get('timer'),
			_ = this;
		if((!settings || !settings.force) && delay) {
			timer.show = setTimeout(function() { _.show({force: true}); }, delay);
			this.model.set({timer: timer}, {silent: true});
			return;
		}
		if(callbacks.beforeShow) {
			callbacks.beforeShow.call(this);
		}
		if(overlay) {
			overlay.show();
		}
		if(escape == true) {
			this.addEscapeHandler();
		}
		if(effect) {
			this.effect(jel, effect, duration, easing);
		} else {
			jel.show();
		}
		this.visible(true);
		this.hide({detect: true});
		if(callbacks.show) {
			callbacks.show.call(this);
		}
	},
	hide: function(settings) {
		var jel = $(this.el),
			key = this.model.get('key'),
			callbacks = this.model.get('callbacks'),
			overlay = this.model.get('ref').overlay,
			hide = this.model.get('hide'),
			auto = hide.auto,
			delay = hide.delay,
			destroy = hide.destroy,
			effect = hide.effect,
			duration = hide.duration,
			easing = hide.easing,
			timer = this.model.get('timer'),
			_ = this;
		if(settings && settings.detect) {
			if(auto && delay) {
				timer.hide = setTimeout(function() { _.hide(); }, delay);
				this.model.set({timer: timer}, {silent: true});
			}
			return;
		}
		if(timer.hide) {
			clearTimeout(timer.hide);
		}
		if(callbacks.beforeHide) {
			callbacks.beforeHide.call(this);
		}
		if(overlay) {
			overlay.hide();
		}
		if(effect) {
			this.effect(jel, effect, duration, easing, function() {
				if(destroy) {
					_.destroy();
				}
			});
		} else {
			jel.hide();
			if(destroy) {
				this.destroy();
			}
		}
		this.visible(false);
		if(callbacks.hide) {
			callbacks.hide.call(this, this);
		}
	},
	destroy: function() {
		var jel = $(this.el),
			timer = this.model.get('timer'),
			ref = this.model.get('ref');
		if(timer) {
			for(var name in timer) {
				if(timer[name]) {
					clearTimeout(timer[name]);
				}
			}
		}
		jel.remove();
		ref.overlay = null;
	},
	get: function(option) {
		if(option == 'overlay') {
			var ref = this.model.get('ref');
			return ref.overlay;
		}
	},
	set: function(option, value, silent) {
		if(option == 'content') {
			this.model.merge({content: value});
			this.renderContent();
		} else if(option == 'content.text') {
			this.model.merge({content: { text: value }});
			this.renderContent();
		} else if(option == 'content.title') {
			this.model.merge({content: { title: value }});
			this.renderContent();
		} else if(option == 'content.buttons') {
			this.model.merge({content: { buttons: value }});
			this.renderContent();
		}
	},
	getJel: function(name) {
		var jels = this.model.get('jels');
		return jels[name];
	},
	setJel: function(name, jel) {
		var jels = this.model.get('jels');
		jels[name] = jel;
		this.model.set({jels: jels}, {silent: true});
	},
	onButtonClick: function(event) {
		var callbacks = this.model.get('callbacks'),
			jel = $(event.target),
			code = jel.attr('value'),
			hide = jel.attr('hide'),
			values = this.values();
		if(callbacks.buttonClick) {
			callbacks.buttonClick.call(this, code, values);
		}
		if(hide != 'false') {
			this.hide();
		}
	},
	visible: function(bool) {
		if(bool == true || bool == false) {
			this.model.set({visible: bool}, {silent: true});
		}
		return this.model.get('visible');
	},
	addEscapeHandler: function() {
		var handler = function(event) {
				var keyCode = event.keyCode,
					_ = event.data._;
				if(keyCode == 27) {
					$(this).unbind(event);
					_.hide();
				}
			};
		$(doc).keyup({_: this}, handler);
	},
	values: function() {
		var jels = this.model.get('jels'),
			inner = jels.inner,
			values = {};
		
		inner.find('input').each(function() {
			var input = $(this),
				field = input.attr('field'),
				value = input.val();
			values[field] = value;
		});
		return values;
	}
});
	
win.oAlert = View;
})(jQuery);