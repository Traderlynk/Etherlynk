Polymer.NeonAnimatableBehavior = {
    properties: {
        animationConfig: {
            type: Object
        },
        entryAnimation: {
            observer: "_entryAnimationChanged",
            type: String
        },
        exitAnimation: {
            observer: "_exitAnimationChanged",
            type: String
        }
    },
    _entryAnimationChanged: function() {
        this.animationConfig = this.animationConfig || {}, this.animationConfig.entry = [{
            name: this.entryAnimation,
            node: this
        }]
    },
    _exitAnimationChanged: function() {
        this.animationConfig = this.animationConfig || {}, this.animationConfig.exit = [{
            name: this.exitAnimation,
            node: this
        }]
    },
    _copyProperties: function(i, n) {
        for (var t in n) i[t] = n[t]
    },
    _cloneConfig: function(i) {
        var n = {
            isClone: !0
        };
        return this._copyProperties(n, i), n
    },
    _getAnimationConfigRecursive: function(i, n, t) {
        if (this.animationConfig) {
            if (this.animationConfig.value && "function" == typeof this.animationConfig.value) return void this._warn(this._logf("playAnimation", "Please put 'animationConfig' inside of your components 'properties' object instead of outside of it."));
            var o;
            if (o = i ? this.animationConfig[i] : this.animationConfig, Array.isArray(o) || (o = [o]), o)
                for (var e, a = 0; e = o[a]; a++)
                    if (e.animatable) e.animatable._getAnimationConfigRecursive(e.type || i, n, t);
                    else if (e.id) {
                var r = n[e.id];
                r ? (r.isClone || (n[e.id] = this._cloneConfig(r), r = n[e.id]), this._copyProperties(r, e)) : n[e.id] = e
            } else t.push(e)
        }
    },
    getAnimationConfig: function(i) {
        var n = {},
            t = [];
        this._getAnimationConfigRecursive(i, n, t);
        for (var o in n) t.push(n[o]);
        return t
    }
};


Polymer.NeonAnimationRunnerBehaviorImpl = {
    _configureAnimations: function(n) {
        var i = [];
        if (n.length > 0)
            for (var e, t = 0; e = n[t]; t++) {
                var o = document.createElement(e.name);
                if (o.isNeonAnimation) {
                    var a = null;
                    try {
                        a = o.configure(e), "function" != typeof a.cancel && (a = document.timeline.play(a))
                    } catch (n) {
                        a = null, console.warn("Couldnt play", "(", e.name, ").", n)
                    }
                    a && i.push({
                        neonAnimation: o,
                        config: e,
                        animation: a
                    })
                } else console.warn(this.is + ":", e.name, "not found!")
            }
        return i
    },
    _shouldComplete: function(n) {
        for (var i = !0, e = 0; e < n.length; e++)
            if ("finished" != n[e].animation.playState) {
                i = !1;
                break
            }
        return i
    },
    _complete: function(n) {
        for (var i = 0; i < n.length; i++) n[i].neonAnimation.complete(n[i].config);
        for (var i = 0; i < n.length; i++) n[i].animation.cancel()
    },
    playAnimation: function(n, i) {
        var e = this.getAnimationConfig(n);
        if (e) {
            this._active = this._active || {}, this._active[n] && (this._complete(this._active[n]), delete this._active[n]);
            var t = this._configureAnimations(e);
            if (0 == t.length) return void this.fire("neon-animation-finish", i, {
                bubbles: !1
            });
            this._active[n] = t;
            for (var o = 0; o < t.length; o++) t[o].animation.onfinish = function() {
                this._shouldComplete(t) && (this._complete(t), delete this._active[n], this.fire("neon-animation-finish", i, {
                    bubbles: !1
                }))
            }.bind(this)
        }
    },
    cancelAnimation: function() {
        for (var n in this._animations) this._animations[n].cancel();
        this._animations = {}
    }
}, Polymer.NeonAnimationRunnerBehavior = [Polymer.NeonAnimatableBehavior, Polymer.NeonAnimationRunnerBehaviorImpl];


Polymer.IronFitBehavior = {
    properties: {
        sizingTarget: {
            type: Object,
            value: function() {
                return this
            }
        },
        fitInto: {
            type: Object,
            value: window
        },
        noOverlap: {
            type: Boolean
        },
        positionTarget: {
            type: Element
        },
        horizontalAlign: {
            type: String
        },
        verticalAlign: {
            type: String
        },
        dynamicAlign: {
            type: Boolean
        },
        horizontalOffset: {
            type: Number,
            value: 0,
            notify: !0
        },
        verticalOffset: {
            type: Number,
            value: 0,
            notify: !0
        },
        autoFitOnAttach: {
            type: Boolean,
            value: !1
        },
        _fitInfo: {
            type: Object
        }
    },
    get _fitWidth() {
        var t;
        return t = this.fitInto === window ? this.fitInto.innerWidth : this.fitInto.getBoundingClientRect().width
    },
    get _fitHeight() {
        var t;
        return t = this.fitInto === window ? this.fitInto.innerHeight : this.fitInto.getBoundingClientRect().height
    },
    get _fitLeft() {
        var t;
        return t = this.fitInto === window ? 0 : this.fitInto.getBoundingClientRect().left
    },
    get _fitTop() {
        var t;
        return t = this.fitInto === window ? 0 : this.fitInto.getBoundingClientRect().top
    },
    get _defaultPositionTarget() {
        var t = Polymer.dom(this).parentNode;
        return t && t.nodeType === Node.DOCUMENT_FRAGMENT_NODE && (t = t.host), t
    },
    get _localeHorizontalAlign() {
        if (this._isRTL) {
            if ("right" === this.horizontalAlign) return "left";
            if ("left" === this.horizontalAlign) return "right"
        }
        return this.horizontalAlign
    },
    attached: function() {
        "undefined" == typeof this._isRTL && (this._isRTL = "rtl" == window.getComputedStyle(this).direction), this.positionTarget = this.positionTarget || this._defaultPositionTarget, this.autoFitOnAttach && ("none" === window.getComputedStyle(this).display ? setTimeout(function() {
            this.fit()
        }.bind(this)) : this.fit())
    },
    fit: function() {
        this.position(), this.constrain(), this.center()
    },
    _discoverInfo: function() {
        if (!this._fitInfo) {
            var t = window.getComputedStyle(this),
                i = window.getComputedStyle(this.sizingTarget);
            this._fitInfo = {
                inlineStyle: {
                    top: this.style.top || "",
                    left: this.style.left || "",
                    position: this.style.position || ""
                },
                sizerInlineStyle: {
                    maxWidth: this.sizingTarget.style.maxWidth || "",
                    maxHeight: this.sizingTarget.style.maxHeight || "",
                    boxSizing: this.sizingTarget.style.boxSizing || ""
                },
                positionedBy: {
                    vertically: "auto" !== t.top ? "top" : "auto" !== t.bottom ? "bottom" : null,
                    horizontally: "auto" !== t.left ? "left" : "auto" !== t.right ? "right" : null
                },
                sizedBy: {
                    height: "none" !== i.maxHeight,
                    width: "none" !== i.maxWidth,
                    minWidth: parseInt(i.minWidth, 10) || 0,
                    minHeight: parseInt(i.minHeight, 10) || 0
                },
                margin: {
                    top: parseInt(t.marginTop, 10) || 0,
                    right: parseInt(t.marginRight, 10) || 0,
                    bottom: parseInt(t.marginBottom, 10) || 0,
                    left: parseInt(t.marginLeft, 10) || 0
                }
            }
        }
    },
    resetFit: function() {
        var t = this._fitInfo || {};
        for (var i in t.sizerInlineStyle) this.sizingTarget.style[i] = t.sizerInlineStyle[i];
        for (var i in t.inlineStyle) this.style[i] = t.inlineStyle[i];
        this._fitInfo = null
    },
    refit: function() {
        var t = this.sizingTarget.scrollLeft,
            i = this.sizingTarget.scrollTop;
        this.resetFit(), this.fit(), this.sizingTarget.scrollLeft = t, this.sizingTarget.scrollTop = i
    },
    position: function() {
        if (this.horizontalAlign || this.verticalAlign) {
            this._discoverInfo(), this.style.position = "fixed", this.sizingTarget.style.boxSizing = "border-box", this.style.left = "0px", this.style.top = "0px";
            var t = this.getBoundingClientRect(),
                i = this.__getNormalizedRect(this.positionTarget),
                e = this.__getNormalizedRect(this.fitInto),
                n = this._fitInfo.margin,
                o = {
                    width: t.width + n.left + n.right,
                    height: t.height + n.top + n.bottom
                },
                h = this.__getPosition(this._localeHorizontalAlign, this.verticalAlign, o, i, e),
                s = h.left + n.left,
                l = h.top + n.top,
                r = Math.min(e.right - n.right, s + t.width),
                a = Math.min(e.bottom - n.bottom, l + t.height);
            s = Math.max(e.left + n.left, Math.min(s, r - this._fitInfo.sizedBy.minWidth)), l = Math.max(e.top + n.top, Math.min(l, a - this._fitInfo.sizedBy.minHeight)), this.sizingTarget.style.maxWidth = Math.max(r - s, this._fitInfo.sizedBy.minWidth) + "px", this.sizingTarget.style.maxHeight = Math.max(a - l, this._fitInfo.sizedBy.minHeight) + "px", this.style.left = s - t.left + "px", this.style.top = l - t.top + "px"
        }
    },
    constrain: function() {
        if (!this.horizontalAlign && !this.verticalAlign) {
            this._discoverInfo();
            var t = this._fitInfo;
            t.positionedBy.vertically || (this.style.position = "fixed", this.style.top = "0px"), t.positionedBy.horizontally || (this.style.position = "fixed", this.style.left = "0px"), this.sizingTarget.style.boxSizing = "border-box";
            var i = this.getBoundingClientRect();
            t.sizedBy.height || this.__sizeDimension(i, t.positionedBy.vertically, "top", "bottom", "Height"), t.sizedBy.width || this.__sizeDimension(i, t.positionedBy.horizontally, "left", "right", "Width")
        }
    },
    _sizeDimension: function(t, i, e, n, o) {
        this.__sizeDimension(t, i, e, n, o)
    },
    __sizeDimension: function(t, i, e, n, o) {
        var h = this._fitInfo,
            s = this.__getNormalizedRect(this.fitInto),
            l = "Width" === o ? s.width : s.height,
            r = i === n,
            a = r ? l - t[n] : t[e],
            f = h.margin[r ? e : n],
            g = "offset" + o,
            p = this[g] - this.sizingTarget[g];
        this.sizingTarget.style["max" + o] = l - f - a - p + "px"
    },
    center: function() {
        if (!this.horizontalAlign && !this.verticalAlign) {
            this._discoverInfo();
            var t = this._fitInfo.positionedBy;
            if (!t.vertically || !t.horizontally) {
                this.style.position = "fixed", t.vertically || (this.style.top = "0px"), t.horizontally || (this.style.left = "0px");
                var i = this.getBoundingClientRect(),
                    e = this.__getNormalizedRect(this.fitInto);
                if (!t.vertically) {
                    var n = e.top - i.top + (e.height - i.height) / 2;
                    this.style.top = n + "px"
                }
                if (!t.horizontally) {
                    var o = e.left - i.left + (e.width - i.width) / 2;
                    this.style.left = o + "px"
                }
            }
        }
    },
    __getNormalizedRect: function(t) {
        return t === document.documentElement || t === window ? {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            right: window.innerWidth,
            bottom: window.innerHeight
        } : t.getBoundingClientRect()
    },
    __getCroppedArea: function(t, i, e) {
        var n = Math.min(0, t.top) + Math.min(0, e.bottom - (t.top + i.height)),
            o = Math.min(0, t.left) + Math.min(0, e.right - (t.left + i.width));
        return Math.abs(n) * i.width + Math.abs(o) * i.height
    },
    __getPosition: function(t, i, e, n, o) {
        var h = [{
            verticalAlign: "top",
            horizontalAlign: "left",
            top: n.top + this.verticalOffset,
            left: n.left + this.horizontalOffset
        }, {
            verticalAlign: "top",
            horizontalAlign: "right",
            top: n.top + this.verticalOffset,
            left: n.right - e.width - this.horizontalOffset
        }, {
            verticalAlign: "bottom",
            horizontalAlign: "left",
            top: n.bottom - e.height - this.verticalOffset,
            left: n.left + this.horizontalOffset
        }, {
            verticalAlign: "bottom",
            horizontalAlign: "right",
            top: n.bottom - e.height - this.verticalOffset,
            left: n.right - e.width - this.horizontalOffset
        }];
        if (this.noOverlap) {
            for (var s = 0, l = h.length; s < l; s++) {
                var r = {};
                for (var a in h[s]) r[a] = h[s][a];
                h.push(r)
            }
            h[0].top = h[1].top += n.height, h[2].top = h[3].top -= n.height, h[4].left = h[6].left += n.width, h[5].left = h[7].left -= n.width
        }
        i = "auto" === i ? null : i, t = "auto" === t ? null : t;
        for (var f, s = 0; s < h.length; s++) {
            var g = h[s];
            if (!this.dynamicAlign && !this.noOverlap && g.verticalAlign === i && g.horizontalAlign === t) {
                f = g;
                break
            }
            var p = !(i && g.verticalAlign !== i || t && g.horizontalAlign !== t);
            if (this.dynamicAlign || p) {
                f = f || g, g.croppedArea = this.__getCroppedArea(g, e, o);
                var d = g.croppedArea - f.croppedArea;
                if ((d < 0 || 0 === d && p) && (f = g), 0 === f.croppedArea && p) break
            }
        }
        return f
    }
};
