var OteSave = function(ui, config) {
    'use strict';

    $('body').click( function(){
      ui.updateConfig();
      console.log(config);
    });
};
