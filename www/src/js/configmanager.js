var ConfigManager = function(viewer, controlBar) {
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
    // viewer.map.addControl(new this.saveConfigButton());

    this.saveConfig = function(title, constraints) {
        var newConfig = viewer.config.get();

        // add title attribute when specified
        if (typeof title !== 'undefined') {
            newConfig.title = title;
        }
        if (typeof constraints !== 'undefined') {
            newConfig.viewZoomConstraint = constraints.zoom;
            newConfig.viewCenterConstraint = constraints.center;
            newConfig.viewRotationEnabled = constraints.rotation;
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
                viewer.setConfigStore(data);
                if (typeof(controlBar) !== 'undefined') {
                    controlBar.updateConfigStore();
                }
            },
            error: function(data) {
                console.log('could not read configs from database');
            },
            dataType: this.dataType,
            context: this
        });
    }.bind(this);

    // load all available configs and push to gui selectbox
    this.loadAllConfigs();
};
