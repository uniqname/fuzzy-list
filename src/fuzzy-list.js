(function () {
    var findYFromViewportTop = function (el) {
        var top = 0;
        while(el) {
            top += el.offsetTop  || 0;
            el = el.offsetParent;
        }
        return top;
    };

    if (!Node.prototype.toggleAttribute) {
        Node.prototype.toggleAttribute = function (attr) {
            if (this.hasAttribute(attr)) {
                this.removeAttribute(attr);
            } else {
                this.setAttribute(attr, attr);
            }
        };
    }

    Polymer('fuzzy-list', {
        list: null,
        tabIndex: 0,
        selected: [],
        selectedLabel: 'selected',
        filterLabel: 'filter',
        value: '',
        activeOption: null,
        ready: function () {
            var self = this,
                itemClickHandler = function (evt) {
                    var target = evt.target, 
                        clonedSelectedNode, vals;

                    if (target.nodeName.toLowerCase() === 'fuzzy-option') {
                      
                        isInSelectedList = Array.prototype.slice.call(self.$.selectedList.children).some(function (el, i, arr) {
                            return (el.value === target.value);
                        });
                        if (!isInSelectedList) {
                            // clone target node
                            clonedSelectedNode = target.cloneNode(true);

                            // bind textContent, value and selected attribute
                            clonedSelectedNode.bind('value', target, 'value');
                            clonedSelectedNode.bind('selected?', target, 'selected');

                            // fuzzy-option nodes may only have a single text node decendent
                            clonedSelectedNode.childNodes[0].bind('textContent', target, 'textContent');

                            // Attach click hadler. 
                            // TODO: Figure out delegation in this case. Don't think events cross shadow roots.
                            clonedSelectedNode.addEventListener('click', function (e) {
                                var evt = new MouseEvent('click', {
                                    'view': window,
                                    'bubbles': true,
                                    'cancelable': true
                                });
                                itemClickHandler(e);
                                target.dispatchEvent(evt);
                            });


                            // append cloned node to selectedList
                            self.$.selectedList.appendChild(clonedSelectedNode);

                            vals = self.value.split(',');
                            vals.push(encodeURIComponent(clonedSelectedNode.value));
                            self.value  = vals.join(',').replace(/^,/, '');
                            // self.$.input.focus();

                            // NOTE: if the target was previously selected. The bound values will update on the selected list
                            // when the "selected" attr is toggled and the ontransitionend handler will unbind the node and 
                            // remove it from the selected list.

                        }
                        // toggle "selected" attribute on target
                        target.toggleAttribute('selected');
                    }
                };

            // self.width = window.getComputedStyle(self.$.input).width;

            //Allow for keyboard navigation and focusability
            self.tabIndex = (self.tabIndex <= 0) ? 0 : self.tabIndex;

            self.addEventListener('focusin', function (e) {
                self.showList();
            });

            self.addEventListener('focusout', function (e) {
                self.hideList();
                self.$.input.placeholder = decodeURIComponent(self.value);
                self.$.input.value = '';
            });

            self.addEventListener('click', itemClickHandler);

            self.addEventListener('keydown', function (e) {
                var getNextMatchedElement = function (el, directionMethod) {
                        do {
                            el = el[directionMethod];
                        } while (el !== null && !el.hasAttribute('data-matches'));
                        return el;
                    },
                    newTarget,
                    nextSiblingMethod, evt;

                // down or up arrow
                if (e.which === 40 || e.which === 38) {
                    nextSiblingMethod = (e.which === 40) ? 'nextElementSibling' : 'previousElementSibling';

                    self.activeOption = self.activeOption ? getNextMatchedElement(self.activeOption, nextSiblingMethod) : null;
                    self.activeOption = self.activeOption || ((e.which === 40) ? self.querySelector('fuzzy-option[data-matches]') : Array.prototype.reverse.call(self.$.selectedList.querySelectorAll('fuzzy-option[data-matches]'))[0]);
                    if (self.activeOption) {
                        self.activeOption.focus();
                    } else {
                        self.$.input.focus();
                    }
                    // console.log(self.activeOption.value);
                    e.preventDefault();

                // enter
                } else if (e.which === 13) {
                    evt = new MouseEvent('click', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                    target.dispatchEvent(evt);

                }
            });

              self.$.input.addEventListener('input', function (e) {
                var which = e.which;
                self.filter(e.target.value, true);
              });

              (function (events) {
                var onTransEnd = function (evt) {
                    var val,
                        tgt = evt.target;
                    if (!tgt.selected) {
                        self.$.input.focus();
                        evt.currentTarget.removeChild(tgt);
                        val = decodeURIComponent(self.value).split(',');
                        val.splice(val.indexOf(tgt.value), 1);
                        val = val.join(',');
                        self.$.input.placeholder = val;
                        self.value = encodeURIComponent(val);
                    }
                }, selectedList = self.$.selectedList;

                for (var i = events.length - 1; i >= 0; i--) {
                  selectedList.addEventListener(events[i], onTransEnd);
                }
              })('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd'.split(' '));

                // set max-height based on distance from top of viewport
                self.$.selectedList.style.maxHeight = findYFromViewportTop(self) + 'px';
                            
          },
          filter: function (filter, all) {
            // escape chars the make for invalid regexs
            var rFilter = new RegExp(filter.replace(/[\^\[\].${}*()\/\\+?|<>]+/, '\\$&'), 'ig');
            Array.prototype.slice.call(this.children).forEach(function (el, i, arr) {
                if (el.textContent.match(rFilter) || el.value.match(rFilter)) {
                    el.setAttribute('data-matches', 'matches');
                } else {
                    el.removeAttribute('data-matches');
                }
            });
          },
          toggleSelect: function (e, detail, sender) {
            if (sender.getAttribute('selected')) {
              sender.removeAttribute('selected');
            } else {
              sender.setAttribute('selected', true);
            }
          },
          showList: function (e, detail, sender) {
            this.classList.add('alive');
          },
          hideList: function (e, detail, sender) {
            this.classList.remove('alive');
          },
          selectValue: function (value) {
            var sel = this.selected;
            if (sel.indexOf(value) < 0) {
              sel.push(value);
              return true;
            }
            return false;
          },
          unselectValue: function (value) {
            var sel = this.selected;
            sel.splice(sel.indexOf(value), 1);
          },
          get filteredList() {
            return this.$.filteredList.querySelectorAll('li');
          },
          get datalist() {
            var items = Array.prototype.map.call(this.querySelectorAll('option'), function (el, i, a) {
              var li = document.createElement('li');
              li.innerText = el.value;
              li.tabIndex = 0;
              li.setAttribute('data-value', el.value);
              return li;
            }),
            frag = document.createDocumentFragment();
            for (var i = 0; i < items.length; i++) {
              frag.appendChild(items[i]);
            }
            return frag;
          },
          get selectedValues() {
            return this.$.selectedList.querySelectorAll('li');
          }
    });
})();