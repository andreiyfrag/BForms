﻿(function (factory) {
    if (typeof define === "function" && define.amd) {
        define('bforms-rangepicker', ['jquery', 'icanhaz'], factory);
    } else {
        factory(window.jQuery, window.ich);
    }
}(function ($) {

    var rangePicker = function (elem, options) {

        this.$element = elem;
        this.options = $.extend(true, {}, options);

        if (this.$element.hasClass('bs-hasRangepicker')) return;

        else {
            this.$element.addClass('bs-hasRangepicker');
            this._init();
        }

    };

    //#region init
    rangePicker.prototype._init = function () {

        this.r = window.ich;

        if (this.$element.is('input')) {
            this.$input = this.$element;
            if (this.options.readonlyInput || ($.browser != null && $.browser.mobile == true)) {
                this.$input.prop('readonly', true);
            }
        }

        this._initOptions();
        this._initRenderModel();
        this._initRenderer();
        this._buildElement();
        this._initInitialValues();
        this._addHandlers();
    };

    rangePicker.prototype._addHandlers = function () {

        if (!this.isInline || this.options.inlineMobile) {

            if (this.options.closeOnBlur) {

                $(document).on('mouseup', $.proxy(function (e) {

                    var $target = $(e.target);

                    if ($target[0] != this.$element[0] && $target.closest('.bs-number_range-picker').length === 0) {
                        if ((!$target.hasClass('glyphicon') || $target.parent()[0] != this.$input.parent()[0]) && !$target.hasClass(this.options.ignoreBlurClass)) {

                            var allowHide = true;

                            if (typeof this.options.toggleButtons !== "undefined") {
                                for (var toggle in this.options.toggleButtons) {
                                    var $toggleElement = $(this.options.toggleButtons[toggle].selector);
                                    if ($target.closest($toggleElement).length > 0) {
                                        allowHide = false;
                                    }
                                }
                            }

                            if (allowHide) {
                                this.hide();
                            }
                        }
                    }

                }, this));
            }

            if (this.options.openOnFocus) {
                this.$element.on('focus', $.proxy(function (e) {
                    this.show();
                }, this));
            }

            if (typeof this.options.openOn !== "undefined" && $.isArray(this.options.openOn)) {

                for (var idxO in this.options.openOn) {

                    var currentOpenOn = this.options.openOn[idxO];
                    this.unbindEvent(currentOpenOn.selector, currentOpenOn.event);

                    $('body').on(currentOpenOn.event, currentOpenOn.selector, $.proxy(function (e) {
                        this.show();
                    }, this));
                }
            }

            if (typeof this.options.closeOn !== "undefined" && $.isArray(this.options.closeOn)) {
                for (var idxC in this.options.closeOn) {

                    var currentCloseOn = this.options.closeOn[idxC];
                    this.unbindEvent(currentCloseOn.selector, currentCloseOn.event);

                    $('body').on(currentCloseOn.event, currentCloseOn.selector, $.proxy(function (e) {
                        this.hide();
                    }, this));
                }
            }

            if (typeof this.options.toggleButtons !== "undefined" && $.isArray(this.options.toggleButtons)) {
                for (var idxT in this.options.toggleButtons) {

                    var currentTogle = this.options.toggleButtons[idxT];

                    this.unbindEvent(currentTogle.selector, currentTogle.event);
                    $('body').on(currentTogle.event, currentTogle.selector, $.proxy(function (e) {

                        if (this._visible) {
                            this.hide();
                        } else {
                            this.show();
                        }

                    }, this));
                }
            }

            $(document).on('scroll', $.proxy(function () {
                if (this._visible) {
                    if (this.options.withScrollTimeout) {
                        window.clearTimeout(this._timeoutHandler);
                        this._timeoutHandler = window.setTimeout($.proxy(this._positionPicker, this), 20);
                    } else {
                        this._positionPicker();
                    }
                }
            }, this));

            $(window).on('resize', $.proxy(function () {
                this._positionPicker();
            }, this));

            this.$picker.on('click', '.bs-closeBtn', $.proxy(function (e) {
                this._stopEvent(e);
                this.hide();
            }, this));
        }

        this.$picker.on('mousedown touchstart', '.bs-rangeUp', $.proxy(function (e) {
            var idx = $(e.currentTarget).data('index');
            this._rangeUpTimeout(idx);
        }, this));

        this.$picker.on('mouseup mouseleave touchend', '.bs-rangeUp', $.proxy(function (e) {
            window.clearTimeout(this._rangeUpHandler);
            this._rangeUpTimeoutSpeed = null;
        }, this));

        this.$picker.on('mousedown touchstart', '.bs-rangeDown', $.proxy(function (e) {
            var idx = $(e.currentTarget).data('index');
            this._rangeDownTimeout(idx);
        }, this));

        this.$picker.on('mouseup mouseleave touchend', '.bs-rangeDown', $.proxy(function (e) {
            window.clearTimeout(this._rangeDownHandler);
            this._rangeDownTimeoutSpeed = null;
        }, this));

        this.$picker.on('change', '.bs-rangeInput', $.proxy(this._onInputChange, this));
    };

    rangePicker.prototype._initRenderer = function () {
        if (typeof this.r["rangePickerRanges"] !== "function") {
            this.r.addTemplate('rangePickerRanges', $.fn.bsRangePickerTemplates.rangesTemplate);
        }

        if (typeof this.r["renderNumberRangePicker"] !== "function") {
            this.r.addTemplate("renderNumberRangePicker", $.fn.bsRangePickerTemplates.mainTemplate);
        }
    };
    //#endregion

    //#region private methods
    rangePicker.prototype._initInitialValues = function() {
        this._initialValues = {};

        this.$picker.find('.bs-rangeInput').each($.proxy(function(index, range) {
            var $range = $(range),
                val = $range.val();
            
            this._initialValues[index] = val;

        }, this));
    };

    rangePicker.prototype._initOptions = function () {

        if (this.options.ranges.length == 1) {
            this._single = true;
        } else {
            this._single = false;
        }
        
        if (typeof this.options.minValue === "undefined") {
            this.options.minValue = -Infinity;
        }
        
        if (typeof this.options.maxValue === "undefined") {
            this.options.maxValue = Infinity;
        }

    };

    rangePicker.prototype._initRenderModel = function () {

        $.each(this.options.ranges, function (idx, elem) {
            elem.index = idx;
        });

        this._renderModel = {
            showClose: this.options.showClose,
            ranges: this.options.ranges,
            renderTitle: true,
            wrapperClass: typeof this.options.wrapperClass === "string" ? (this.options.wrapperClass + " " + (this._single ? "bs-single_range " : "")) : (this._single ? "bs-single_range " : "")
    };

        var rangesWithTitle = $.grep(this._renderModel.ranges, function (range) {
            return typeof range.title !== "undefined" && range.title != null && range.title != '';
        });

        if (typeof rangesWithTitle[0] === "undefined") {
            this._renderModel.renderTitle = false;
        }
    };

    rangePicker.prototype._buildElement = function () {

        this.$picker = this._renderPicker(this._renderModel);

        if (this.isInline) {
            this.$element.after(this.$picker.show());
            this.$element.hide();

        } else {
            $('body').append(this.$picker);
            this._positionPicker();
        }

        if (!this._visible) {
            this.$picker.hide();
        }

        this._blockRanges();

    };

    rangePicker.prototype._renderPicker = function () {

        var html = this.r.renderNumberRangePicker(this._renderModel, true);

        return $(html);
    };

    rangePicker.prototype._positionPicker = function () {
        if (this.isInline) return;

        if (this.options.fixedPicker === true && this.$picker.css('position') == 'fixed') return;

        var xOrient = this.options.xOrient,
            yOrient = this.options.yOrient,
            pickerHeight = this.$picker.outerHeight(true),
            pickerWidth = this.$picker.outerWidth(true),
            elemOffset = this.$element.offset(),
            newTop = -1,
            newLeft = -1;

        if (yOrient != 'below' && yOrient != 'above') {

            var windowHeight = $(window).innerHeight(),
                scrollTop = $(document).scrollTop(),
                elemHeight = this.$element.outerHeight(true);

            var topOverflow = -scrollTop + elemOffset.top - pickerHeight,
                bottomOverflow = scrollTop + windowHeight - (elemOffset.top + elemHeight + pickerHeight);

            if (Math.max(topOverflow, bottomOverflow) === bottomOverflow) {
                yOrient = 'below';
            } else {
                yOrient = 'above';
            }
        }


        if (xOrient != 'right' && xOrient != 'left') {

            var windowWidth = $(window).innerWidth(),
                elemWidth = this.$element.outerWidth(true);

            var rightOverflow = elemOffset.left - (elemWidth > pickerWidth ? elemWidth - pickerWidth : pickerWidth - elemWidth),
                leftOverflow = windowWidth - (elemOffset.left + pickerWidth);

            if (rightOverflow > 0 && leftOverflow > 0) {
                xOrient = "left";
            } else {
                if (Math.max(rightOverflow, leftOverflow) === rightOverflow) {
                    xOrient = 'right';
                } else {
                    xOrient = 'left';
                }
            }
        }

        if (yOrient == 'below') {

            newTop = elemOffset.top + this.$element.height() + this.options.heightPosition;

            this.$picker.removeClass('open-above');
            this.$picker.addClass('open-below');

        } else if (yOrient == 'above') {

            newTop = elemOffset.top - this.$element.height() - pickerHeight + 16;

            this.$picker.removeClass('open-below');
            this.$picker.addClass('open-above');
        }

        if (xOrient != 'right' && xOrient != 'left') {
            xOrient = 'left';
        }

        if (xOrient == 'left') {

            newLeft = elemOffset.left;
            this.$picker.removeClass('open-right');
            this.$picker.addClass('open-left');

        } else if (xOrient == 'right') {

            newLeft = elemOffset.left + this.$element.outerWidth() - this.$picker.outerWidth();
            this.$picker.removeClass('open-left');
            this.$picker.addClass('open-right');
        }

        if (this.options.fixedPicker === true) {
            this.$picker.css('position', 'fixed');
        }

        if (newTop !== -1) {
            this.$picker.css('top', newTop);
        }

        if (newLeft !== -1) {
            this.$picker.css('left', newLeft);
        }
    };

    rangePicker.prototype._trigger = function (name, arguments, preventElementTrigger) {

        if (typeof this.options[name] === "function") {
            this.options[name].apply(this, arguments);
        }

        if (preventElementTrigger !== true) {
            this.$element.trigger(name, arguments);
        }

    };

    rangePicker.prototype._getLimits = function (idx) {
        var limits = {
            max: this.options.maxValue,
            min: this.options.minValue
        };

        var $prevRange = this._getInput(idx - 1);
        if ($prevRange.length) {
            limits.min = window.parseInt($prevRange.val() || limits.min, 10);
        }

        var $nextRange = this._getInput(idx + 1);
        if ($nextRange.length) {
            limits.max = window.parseInt($nextRange.val() || limits.max, 10);
        }


        return limits;
    };

    rangePicker.prototype._getInput = function (idx) {
        return this.$picker.find('.bs-rangeInput[data-index="' + idx + '"]');
    };

    rangePicker.prototype._getUpArrow = function (idx) {
        return this.$picker.find('.bs-rangeUp[data-index="' + idx + '"]');
    };

    rangePicker.prototype._getDownArrow = function (idx) {
        return this.$picker.find('.bs-rangeDown[data-index="' + idx + '"]');
    };

    rangePicker.prototype._allowHold = function () {
        return this._visible;
    };

    rangePicker.prototype._blockRanges = function () {
        var $ranges = this.$picker.find('.bs-rangeInput');

        $ranges.each($.proxy(function (it, range) {
            var $range = $(range),
                idx = $range.data('index'),
                currentValue = $range.val();

            var limits = this._getLimits(idx);

            if (limits.min >= currentValue) {
                this._getDownArrow(idx).addClass('disabled');
            } else {
                this._getDownArrow(idx).removeClass('disabled');
            }

            if (limits.max <= currentValue) {
                this._getUpArrow(idx).addClass('disabled');
            } else {
                this._getUpArrow(idx).removeClass('disabled');
            }

        }, this));
    };

    rangePicker.prototype._updateLabels = function () {
        var formattedString = "";

        var startVal = this._getInput(0).val();

        if (this._single) {
            formattedString = typeof this.options.format !== "undefined" ? this.options.format.replace('{0}', startVal) : startVal;
        } else {
            var endVal = this._getInput(1).val();
            formattedString = typeof this.options.format !== "undefined" ? this.options.format.replace('{0}', startVal).replace('{1}', endVal) : startVal + this.options.delimiter + endVal;
        }

        this.$input.val(formattedString);

        this.$picker.find('.bs-rangeInput').each($.proxy(function (index, range) {

            var $range = $(range),
                val = $range.val(),
                idx = $range.data('index');

            if (this.options.listeners && this.options.listeners[idx]) {
                var $currentListener = this.options.listeners[idx];

                if ($currentListener.is(':input')) {
                    $currentListener.val(val);
                } else {
                    $currentListener.text(val);
                }
            }

        }, this));
    };

    rangePicker.prototype._isValidValue = function(value, idx) {
        var limits = this._getLimits(idx),
            parsedValue = window.parseInt(value, 10);

        if (!window.isNaN(parsedValue) && parsedValue >= limits.min && parsedValue <= limits.max) return true;
        return false;
    };
    //#endregion

    //#region events
    rangePicker.prototype.upClick = function (arg) {

        var index = arg;

        if (typeof arg === "object") {
            index = $(arg.currentTarget).data('index');
        }

        var limits = this._getLimits(index),
             $input = this._getInput(index),
             oldVal = window.parseInt($input.val(), 10),
             newVal;

        if (!window.isNaN(oldVal)) {
            newVal = oldVal + 1;
        } else {
            newVal = limits.min + 1;
        }

        if (newVal >= limits.min && newVal <= limits.max) {
            $input.val(newVal).trigger('change');
        }
    };

    rangePicker.prototype._rangeUpTimeout = function (idx) {
        this.upClick(idx);

        if (this._allowHold()) {

            this._rangeUpTimeoutSpeed = this._rangeUpTimeoutSpeed || this.options.holdInterval;
            this._rangeUpHandler = window.setTimeout($.proxy(function () {
                this._rangeUpTimeout(idx);
            }, this), this._rangeUpTimeoutSpeed);

            if (this._rangeUpTimeoutSpeed && this._rangeUpTimeoutSpeed > this.options.holdMinInterval) {
                this._rangeUpTimeoutSpeed -= this.options.holdDecreaseFactor;
            }

        } else {
            window.clearTimeout(this._rangeUpHandler);
            this._rangeUpTimeoutSpeed = null;
        }
    };

    rangePicker.prototype.downClick = function (arg) {

        var index = arg;

        if (typeof arg === "object") {
            index = $(arg.currentTarget).data('index');
        }

        var limits = this._getLimits(index),
            $input = this._getInput(index),
            oldVal = window.parseInt($input.val(), 10),
            newVal;

        if (!window.isNaN(oldVal)) {
            newVal = oldVal - 1;
        } else {
            newVal = limits.max - 1;
        }

        if (newVal >= limits.min && newVal <= limits.max) {
            $input.val(newVal).trigger('change');
        }
    };

    rangePicker.prototype._rangeDownTimeout = function (idx) {

        this.downClick(idx);

        if (this._allowHold()) {

            this._rangeDownTimeoutSpeed = this._rangeDownTimeoutSpeed || this.options.holdInterval;
            this._rangeDownHandler = window.setTimeout($.proxy(function () {
                this._rangeDownTimeout(idx);
            }, this), this._rangeDownTimeoutSpeed);

            if (this._rangeDownTimeoutSpeed && this._rangeDownTimeoutSpeed > this.options.holdMinInterval) {
                this._rangeDownTimeoutSpeed -= this.options.holdDecreaseFactor;
            }

        } else {
            window.clearTimeout(this._rangeDownHandler);
            this._rangeDownTimeoutSpeed = null;
        }

    };

    rangePicker.prototype._onInputChange = function (e) {
        var $range = $(e.currentTarget),
            currentVal = $range.val(),
            idx = $range.data('index');
        
        if (this._isValidValue(currentVal, idx)) {
            this._initialValues[idx] = currentVal;
            this._blockRanges();
            this._updateLabels();
        } else {
            $range.val(this._initialValues[idx]);
        }
        
    };
    //#endregion

    //#region public methods
    rangePicker.prototype.show = function () {
        if (this._visible !== true) {

            var showData = {
                preventShow: false
            };

            this._trigger('beforeShow', showData);

            if (showData.preventShow == false) {

                this._positionPicker();

                if (typeof position !== "undefined") {
                    this.updatePosition(position);
                }

                this.$picker.show();
                this._visible = true;

                this._trigger('afterShow', {
                    rangepicker: this.$picker,
                    element: this.$element
                });
            }
        }

        return this;
    };

    rangePicker.prototype.hide = function () {
        if (this._visible !== false) {

            var hideData = {
                preventHide: false
            };

            this._trigger('beforeHide', hideData);

            if (hideData.preventHide == false) {

                this.$picker.hide();
                this._visible = false;

                this._trigger('afterHide', {
                    rangepicker: this.$picker,
                    element: this.$element
                });
            }
        }

        return this;
    };
    //#endregion

    //#region plugin
    $.fn.bsRangePickerTemplates = {
        mainTemplate: '<div class="bs-number_range-picker {{wrapperClass}}">' +
                         '{{#showClose}}<a href="#" class="btn btn-close bs-closeBtn"></a>{{/showClose}}' +
                         '<div class="bs-ranges-wrapper">' +
                                '{{>rangePickerRanges}}' +
                         '</div>' +
                     '</div>',
        rangesTemplate: '<div>' +
                            '{{#renderTitle}}' +
                            '<ul>' +
                              '{{#ranges}}' +
                                  '<li><span> {{title}} </span></li>' +
                               '{{/ranges}}' +
                            '</ul>' +
                            '{{/renderTitle}}' +
                        '</div>' +
                        '<ul>' +
                             '{{#ranges}}' +
                                '<li><span class="btn btn-up bs-rangeUp" data-index="{{index}}" {{#start}}data-start="true"{{/start}} {{#end}}data-end="true"{{/end}} {{#single}}data-single="true"{{/single}}></span></li>' +
                             '{{/ranges}}' +
                         '</ul>' +

                        '<ul>' +
                             '{{#ranges}}' +
                                '<li><input type="text" class="bs-rangeInput" value="{{value}}" {{#maxlength}}maxlength={{maxlength}}{{/maxlength}} data-index="{{index}}" {{#start}}data-start="true"{{/start}} {{#end}}data-end="true"{{/end}} {{#single}}data-single="true"{{/single}}></li>' +
                             '{{/ranges}}' +
                         '</ul>' +

                        '<ul>' +
                             '{{#ranges}}' +
                                '<li><span class="btn btn-down bs-rangeDown" {{#start}}data-start="true"{{/start}} {{#end}}data-end="true"{{/end}} data-index="{{index}}" {{#single}}data-single="true"{{/single}}></span></li>' +
                             '{{/ranges}}' +
                         '</ul>'

    };

    $.fn.bsRangePickerDefaults = {
        closeOnBlur: true,
        openOnFocus: true,
        readonlyInput: true,
        heightPosition: 20,
        holdInterval: 150,
        holdDecreaseFactor: 4,
        holdMinInterval: 50,
        delimiter: ' - '
    };

    $.fn.bsRangePicker = function () {
        var args = Array.prototype.slice.call(arguments, 0),
           options = args[0],
           methodParams = args.splice(1);

        if (typeof options === "undefined" || typeof options === "object") {
            return new rangePicker($(this), $.extend(true, {}, $.fn.bsRangePickerDefaults, options));
        } else if (typeof options === "string") {
            var instance = (this).data('bsNumberRangepicker');
            if (typeof instance === "undefined") {
                if ($.fn.bsRangePickerDefaults.throwExceptions === true) {
                    throw 'Cannot call method ' + options + ' before initializing plugin';
                }
            } else {
                return instance[options].apply(instance, methodParams);
            }
        }
    };
    //#endregion

    return rangePicker;
}));
