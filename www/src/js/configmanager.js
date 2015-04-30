var ConfigManager = function(controlBar, viewer) {
    'use strict';

    controlBar.configManager = this;

    var url = viewer.config.dbUrl,
        dataType = 'json';

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
            url: url,
            data: newConfig,
            success: function(data) {
                // reload configStore
                this.loadAllConfigs();
                console.log(data.message);
            }.bind(this),
            error: function(data) {
                console.log('could not write config to database');
            },
            dataType: dataType
        });
    };

    this.loadAllConfigs = function() {
        $.ajax({
            type: 'GET',
            url: url,
            success: function(data) {
                controlBar.updateConfigStore(data);
            },
            error: function(data) {
                console.log('could not read configs from database');
            },
            dataType: dataType
        });
    };

    // load all available configs and push to gui selectbox
    this.loadAllConfigs();
};
