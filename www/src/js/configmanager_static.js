var ConfigManagerStatic = function(viewer, controlBar, initShowCase) {
    'use strict';

    if (typeof(controlBar) !== 'undefined') {
        controlBar.configManager = this;
    }

    this.loadAllConfigs = function() {
        $.getJSON("data/configs.json", function(data) {
            data.sort(function(a, b) {
                var aOrder = a.hasOwnProperty('order') ? a.order : 99;
                var bOrder = b.hasOwnProperty('order') ? b.order : 99;
                return ((aOrder < bOrder) ? -1 : ((aOrder > bOrder) ? 1 : 0));
            });
            viewer.setConfigStore(data);
            if (typeof(controlBar) !== 'undefined') {
                controlBar.updateConfigStore();
            }
            if (typeof(initShowCase) !== 'undefined') {
                initShowCase();
            }
        });
    }.bind(this);


    // load all available configs and push to gui selectbox
    this.loadAllConfigs();
};
