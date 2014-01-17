if (!Node.prototype.toggleAttribute) {
  Node.prototype.toggleAttribute = function (attr) {
    if (this.hasAttribute(attr)) {
      this.removeAttribute(attr);
    } else {
      this.setAttribute(attr, attr);
    }
  };
}
Polymer('fuzzy-option', {
    value: null,
    tabIndex: 0,
    selected: false,
    ready: function () {
        var self = this,
            observer = new MutationObserver(function (mutations) {
                var mutation;
                for (var i = mutations.length - 1; i >= 0; i--) {
                    mutation = mutations[i];

                    // update the value prop if the value attr is updated
                    if (mutation.attributeName === 'value') {
                        self.value = self.getAttribute('value');

                    // Update the value prop to the textContent only if a value attr does not exist.
                    } else if (mutation.type === 'childList' && !self.getAttribute('value')) {
                        self.value = self.textContent;
                    }
                };
            }),
            config = {childList: true, attributeFilter: ['value']};

        observer.observe(self, config);

        // fuzzy-option can only have text content, no HTML.
        self.textContent = self.textContent;
        self.tabIndex = 0;
    }
});