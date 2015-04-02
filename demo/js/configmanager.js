var ConfigManager = function(controlBar, viewer) {
    'use strict';

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
    viewer.map.addControl(new this.saveConfigButton());

    var saveConfig = function() {
        var newConfig = viewer.config.get();
        // delete id element to avoid duplicates in database. every saved config gets a unique id.
        delete newConfig._id;
        $.ajax({
            type: 'POST',
            url: url,
            data: newConfig,
            success: function(data) {
                loadAllConfigs();
                controlBar.updateConfigStore(); 
                console.log(data.message);         
            },
            error: function(data) {
                console.log('could not write config to database');            
            },            
            dataType: dataType
        });
    };

    var loadAllConfigs = function() {
        $.ajax({
            type: 'GET',
            url: url,
            success: function(data) {
                controlBar.updateConfigStore(data);                
            },
            error: function(data) {
                controlBar.controls.config.cont.hide();                
            },            
            dataType: dataType
        });
    };

    // load all available configs and push to gui selectbox
    loadAllConfigs();
};
