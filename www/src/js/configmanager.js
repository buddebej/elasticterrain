var ConfigManager = function(viewer, controlBar, initShowCase) {
    'use strict';

    if (typeof(controlBar) !== 'undefined') {
        controlBar.configManager = this;
    }

    this.url = viewer.config.dbUrl;
    this.dataType = 'json';

    this.saveConfigButton = function() {
        var anchor = document.createElement('button');
        anchor.innerHTML = '<i class="fa fa-star"></i>';
        anchor.id = 'saveConfigButton';
        var handleSaveConfigButton = function(e) {
            e.preventDefault();
            saveConfig();
        };
        anchor.addEventListener('click', handleSaveConfigButton, false);
        anchor.addEventListener('touchstart', handleSaveConfigButton, false);
        var element = document.createElement('div');
        element.className = 'saveConfigButton ol-control ol-unselectable';
        element.appendChild(anchor);
        ol.control.Control.call(this, {
            element: element,
        });
    };
    ol.inherits(this.saveConfigButton, ol.control.Control);

    this.saveConfig = function(title) {
        var newConfig = viewer.config.get();

        // add title attribute when specified
        if (typeof title !== 'undefined') {
            newConfig.title = title;
        }

        // delete id element to avoid duplicates in database. every saved config gets a unique id.
        delete newConfig._id;
        $.ajax({
            type: 'POST',
            url: this.url,
            data: newConfig,
            success: function(data) {
                // reload configStore
                this.loadAllConfigs();
                console.log(data.message);
            }.bind(this),
            error: function(data) {
                console.log('could not write config to database');
            },
            dataType: this.dataType,
            context: this
        });
    }.bind(this);

    this.loadAllConfigs = function() {
        $.ajax({
            type: 'GET',
            url: this.url,
            success: function(data) {
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
            },
            error: function(data) {
                console.log('could not read configs from database');
            },
            dataType: this.dataType,
            context: this
        });
    }.bind(this);

    this.updateConfig = function() {
        $.ajax({
            type: 'PUT',
            url: this.url + '/' + viewer.config.get()._id,
            data: viewer.config.get(),
            success: function(data) {
                // reload configStore
                this.loadAllConfigs();
                console.log(data.message);
            }.bind(this),
            error: function(data) {
                console.log('could not update config');
            },
            dataType: this.dataType,
            context: this
        });
    }.bind(this);


    // load all available configs and push to gui selectbox
    this.loadAllConfigs();
};
